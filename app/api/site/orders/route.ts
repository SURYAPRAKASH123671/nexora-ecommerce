import { fallbackProducts } from "@/app/catalog";
import { resolveConfigurationBySku } from "@/app/product-details";
import {
  commerceEnv,
  errorResponse,
  HttpError,
  MERCHANT_NAME,
  MERCHANT_UPI_ID,
  requireSiteUser,
  upiPaymentUri,
  razorpayEnv,
} from "@/lib/site-commerce";
import { createRazorpayOrder } from "@/lib/razorpay";

type CheckoutPayload = {
  paymentMethod?: "UPI" | "COD" | "RAZORPAY";
  deliveryAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items?: Array<{
    productId?: number;
    variantSku?: string;
    quantity?: number;
  }>;
};

export async function POST(request: Request) {
  try {
    const user = requireSiteUser(request);
    const payload = (await request.json()) as CheckoutPayload;
    const address = payload.deliveryAddress;
    if (
      !address?.fullName?.trim() ||
      !address.email?.trim() ||
      !address.phone?.trim() ||
      !address.line1?.trim() ||
      !address.city?.trim() ||
      !address.state?.trim() ||
      !/^\d{5,6}$/.test(address.pincode ?? "")
    ) {
      throw new HttpError(
        400,
        "Complete all delivery fields and enter a valid PIN code.",
      );
    }
    if (!payload.items?.length) throw new HttpError(400, "Your bag is empty.");
    const quantities = new Map<
      string,
      { productId: number; variantSku?: string; quantity: number }
    >();
    for (const item of payload.items) {
      const id = Number(item.productId);
      const quantity = Number(item.quantity);
      if (
        !Number.isInteger(id) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 10
      )
        throw new HttpError(400, "Invalid product quantity.");
      const variantSku = item.variantSku?.trim() || undefined;
      const key = `${id}:${variantSku ?? "standard"}`;
      const current = quantities.get(key);
      quantities.set(key, {
        productId: id,
        variantSku,
        quantity: (current?.quantity ?? 0) + quantity,
      });
    }
    const selectedItems = [...quantities.values()].map(
      ({ productId, variantSku, quantity }) => {
        const product = fallbackProducts.find(
          (candidate) => candidate.id === productId,
        );
        if (!product)
          throw new HttpError(400, `Product ${productId} is unavailable.`);
        let configuration;
        try {
          configuration = resolveConfigurationBySku(product, variantSku);
        } catch {
          throw new HttpError(
            400,
            "The selected product configuration is invalid.",
          );
        }
        if (configuration.stockQuantity < quantity) {
          throw new HttpError(
            409,
            `${configuration.variantName} has only ${configuration.stockQuantity} units available.`,
          );
        }
        return {
          productId,
          variantSku: configuration.sku,
          variantName: configuration.variantName,
          name: product.name,
          imageUrl: configuration.imageUrl,
          unitPrice: configuration.price,
          quantity,
          lineTotal: configuration.price * quantity,
        };
      },
    );
    const subtotalPaise = Math.round(
      selectedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100,
    );
    const shippingPaise = subtotalPaise >= 500000 ? 0 : 9900;
    const totalPaise = subtotalPaise + shippingPaise;
    const orderNumber = `NX-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const paymentMethod = ["COD", "RAZORPAY"].includes(
      payload.paymentMethod ?? "",
    )
      ? payload.paymentMethod!
      : "UPI";
    const now = new Date().toISOString();
    const { DB } = commerceEnv();
    const providerOrder =
      paymentMethod === "RAZORPAY"
        ? await createRazorpayOrder(orderNumber, totalPaise)
        : null;
    if (
      providerOrder &&
      (providerOrder.amount !== totalPaise ||
        providerOrder.currency !== "INR" ||
        !providerOrder.id.startsWith("order_"))
    )
      throw new HttpError(502, "The payment provider returned inconsistent order details.");
    const statements = [
      DB.prepare(
        "INSERT INTO orders (order_number, customer_email, customer_name, delivery_json, items_json, payment_method, payment_status, order_status, subtotal_paise, shipping_paise, total_paise, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        orderNumber,
        user.email,
        address.fullName.trim(),
        JSON.stringify(address),
        JSON.stringify(selectedItems),
        paymentMethod,
        paymentMethod === "UPI"
          ? "PENDING"
          : paymentMethod === "RAZORPAY"
            ? "PAYMENT_PENDING"
            : "COD_PENDING",
        "PLACED",
        subtotalPaise,
        shippingPaise,
        totalPaise,
        now,
        now,
      ),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        orderNumber,
        "ORDER_STATUS",
        "NEW",
        "PLACED",
        user.email,
        "Order reference created",
        now,
      ),
    ];
    if (providerOrder)
      statements.push(
        DB.prepare(
          "INSERT INTO razorpay_payments (order_number, provider_order_id, amount_paise, currency, status, created_at, updated_at) VALUES (?, ?, ?, 'INR', 'CREATED', ?, ?)",
        ).bind(orderNumber, providerOrder.id, totalPaise, now, now),
      );
    await DB.batch(statements);
    const razorpay = providerOrder
      ? {
          keyId: razorpayEnv().RAZORPAY_KEY_ID,
          providerOrderId: providerOrder.id,
          amountPaise: totalPaise,
          currency: "INR",
          merchantName: "Nexora",
          description: `Nexora Order ${orderNumber}`,
        }
      : null;
    return Response.json(
      {
        orderNumber,
        total: totalPaise / 100,
        status: "PLACED",
        paymentStatus:
          paymentMethod === "UPI"
            ? "PENDING"
            : paymentMethod === "RAZORPAY"
              ? "PAYMENT_PENDING"
              : "COD_PENDING",
        instructions:
          paymentMethod === "UPI"
            ? {
                orderNumber,
                amount: totalPaise / 100,
                merchantName: MERCHANT_NAME,
                merchantUpiId: MERCHANT_UPI_ID,
                paymentUri: upiPaymentUri(orderNumber, totalPaise),
                paymentStatus: "PENDING",
                orderStatus: "PLACED",
              }
            : null,
        razorpay,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
