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
import { ensureCatalogSeeded } from "@/lib/catalog-store";
import { deliverOrderConfirmation } from "@/lib/order-notifications";
import { inventorySettlementStatements } from "@/lib/inventory-settlement";
import { createPayPalCheckout, createStripeCheckout } from "@/lib/international-payments";

type CheckoutPayload = {
  idempotencyKey?: string;
  paymentMethod?: "UPI" | "COD" | "RAZORPAY" | "STRIPE" | "PAYPAL";
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

export async function GET(request: Request) {
  try {
    const user = await requireSiteUser(request);
    const { DB } = commerceEnv();
    const orders = await DB.prepare(
      "SELECT order_number, items_json, payment_method, payment_status, order_status, total_paise, created_at, updated_at FROM orders WHERE customer_email = ? ORDER BY created_at DESC LIMIT 50",
    ).bind(user.email).all<{
      order_number: string; items_json: string; payment_method: string;
      payment_status: string; order_status: string; total_paise: number;
      created_at: string; updated_at: string;
    }>();
    const result = await Promise.all((orders.results ?? []).map(async (order) => {
      const history = await DB.prepare(
        "SELECT event_type, from_value, to_value, note, created_at FROM order_history WHERE order_number = ? ORDER BY created_at ASC, id ASC",
      ).bind(order.order_number).all<{
        event_type: string; from_value: string | null; to_value: string;
        note: string | null; created_at: string;
      }>();
      return {
        orderNumber: order.order_number,
        items: JSON.parse(order.items_json),
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        total: order.total_paise / 100,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        history: history.results ?? [],
      };
    }));
    return Response.json({ orders: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSiteUser(request);
    const payload = (await request.json()) as CheckoutPayload;
    const idempotencyKey = (payload.idempotencyKey ?? request.headers.get("Idempotency-Key") ?? "").trim();
    if (idempotencyKey && !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey))
      throw new HttpError(400, "Invalid checkout idempotency key.");
    const { DB } = commerceEnv();
    await ensureCatalogSeeded(DB);
    if (idempotencyKey) {
      const existing = await DB.prepare(
        "SELECT o.order_number, o.total_paise, o.order_status, o.payment_status, o.payment_method, p.provider_order_id, p.amount_paise, p.currency FROM orders o LEFT JOIN razorpay_payments p ON p.order_number = o.order_number WHERE o.customer_email = ? AND o.idempotency_key = ? LIMIT 1",
      )
        .bind(user.email, idempotencyKey)
        .first<{
          order_number: string;
          total_paise: number;
          order_status: string;
          payment_status: string;
          payment_method: string;
          provider_order_id: string | null;
          amount_paise: number | null;
          currency: string | null;
      }>();
      if (existing) {
        if (existing.order_status === "CONFIRMED") await deliverOrderConfirmation(existing.order_number);
        return Response.json({
          orderNumber: existing.order_number,
          total: existing.total_paise / 100,
          status: existing.order_status,
          paymentStatus: existing.payment_status,
          instructions: existing.payment_method === "UPI" ? {
            orderNumber: existing.order_number,
            amount: existing.total_paise / 100,
            merchantName: MERCHANT_NAME,
            merchantUpiId: MERCHANT_UPI_ID,
            paymentUri: upiPaymentUri(existing.order_number, existing.total_paise),
            paymentStatus: existing.payment_status,
            orderStatus: existing.order_status,
          } : null,
          razorpay: existing.provider_order_id ? {
            keyId: razorpayEnv().RAZORPAY_KEY_ID,
            providerOrderId: existing.provider_order_id,
            amountPaise: existing.amount_paise,
            currency: existing.currency,
            merchantName: "Nexora",
            description: `Nexora Order ${existing.order_number}`,
          } : null,
          idempotentReplay: true,
        });
      }
    }
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
    const selectedItems = [];
    for (const { productId, variantSku, quantity } of quantities.values()) {
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
        await DB.prepare(
          "INSERT OR IGNORE INTO product_inventory (variant_sku, available_quantity, reserved_quantity, reorder_level, updated_at) VALUES (?, ?, 0, 2, ?)",
        ).bind(configuration.sku, configuration.stockQuantity, new Date().toISOString()).run();
        const inventory = await DB.prepare(
          "SELECT available_quantity, reserved_quantity FROM product_inventory WHERE variant_sku = ?",
        ).bind(configuration.sku).first<{ available_quantity: number; reserved_quantity: number }>();
        if (!inventory || inventory.available_quantity - inventory.reserved_quantity < quantity)
          throw new HttpError(409, `${configuration.variantName} does not have enough stock for this checkout.`);
        selectedItems.push({
          productId,
          variantSku: configuration.sku,
          variantName: configuration.variantName,
          name: product.name,
          imageUrl: configuration.imageUrl,
          unitPrice: configuration.price,
          quantity,
          lineTotal: configuration.price * quantity,
        });
    }
    const subtotalPaise = Math.round(
      selectedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100,
    );
    const shippingPaise = subtotalPaise >= 500000 ? 0 : 9900;
    const totalPaise = subtotalPaise + shippingPaise;
    const orderNumber = `NX-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const paymentMethod = ["COD", "RAZORPAY", "STRIPE", "PAYPAL"].includes(
      payload.paymentMethod ?? "",
    )
      ? payload.paymentMethod!
      : "UPI";
    const now = new Date().toISOString();
    const providerOrder =
      paymentMethod === "RAZORPAY"
        ? await createRazorpayOrder(orderNumber, totalPaise)
        : null;
    const origin = new URL(request.url).origin;
    const hostedCheckout = paymentMethod === "STRIPE"
      ? await createStripeCheckout(orderNumber, totalPaise, user.email, origin)
      : paymentMethod === "PAYPAL"
        ? await createPayPalCheckout(orderNumber, totalPaise, origin)
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
        "INSERT INTO orders (order_number, customer_email, customer_name, delivery_json, items_json, payment_method, payment_status, order_status, idempotency_key, subtotal_paise, shipping_paise, total_paise, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            : hostedCheckout
              ? "PAYMENT_PENDING"
            : "COD_PENDING",
        paymentMethod === "COD" ? "CONFIRMED" : "PLACED",
        idempotencyKey || null,
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
        paymentMethod === "COD" ? "CONFIRMED" : "PLACED",
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
    if (hostedCheckout)
      statements.push(
        DB.prepare(
          "INSERT INTO gateway_payments (order_number, gateway, provider_order_id, amount_paise, currency, status, customer_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'INR', 'PENDING', ?, ?, ?)",
        ).bind(orderNumber, paymentMethod, hostedCheckout.providerOrderId, totalPaise, user.email, now, now),
      );
    for (const item of selectedItems)
      statements.push(
        DB.prepare(
          "INSERT INTO order_inventory_reservations (order_number, product_id, variant_sku, quantity, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'RESERVED', ?, ?)",
        ).bind(orderNumber, item.productId, item.variantSku, item.quantity, now, now),
        DB.prepare(
          "UPDATE product_inventory SET reserved_quantity = reserved_quantity + ?, updated_at = ? WHERE variant_sku = ? AND available_quantity - reserved_quantity >= ?",
        ).bind(item.quantity, now, item.variantSku, item.quantity),
      );
    if (paymentMethod === "COD")
      statements.push(...inventorySettlementStatements(DB, orderNumber, "RESERVED", "CONSUMED", now));
    try {
      await DB.batch(statements);
    } catch (error) {
      if (error instanceof Error && error.message.includes("INSUFFICIENT_STOCK"))
        throw new HttpError(409, "Stock changed during checkout. Review your bag and try again.");
      throw error;
    }
    if (paymentMethod === "COD") await deliverOrderConfirmation(orderNumber);
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
        status: paymentMethod === "COD" ? "CONFIRMED" : "PLACED",
        paymentStatus:
          paymentMethod === "UPI"
            ? "PENDING"
            : paymentMethod === "RAZORPAY"
              ? "PAYMENT_PENDING"
              : hostedCheckout
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
        hostedCheckout: hostedCheckout ? { gateway: paymentMethod, ...hostedCheckout } : null,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
