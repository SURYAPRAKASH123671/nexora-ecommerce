package ecommerce_backend.email;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class OrderConfirmationEmailBuilder {

	private static final Locale INDIA = new Locale("en", "IN");

	public String build(OrderConfirmationRequest order) {
		String orderId = escape(order.orderId());
		String customerName = escape(order.customerName());
		String itemRows = order.items().stream().map(this::buildItemRow).reduce("", String::concat);
		String address = buildAddress(order.deliveryAddress());

		return """
				<!doctype html>
				<html lang="en">
				<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
				<body style="margin:0;padding:0;background:#eef1f6;color:#111827;font-family:Arial,Helvetica,sans-serif;">
				<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Nexora order is confirmed. A premium delivery experience is now in motion.</div>
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#eef1f6;padding:30px 12px;">
				<tr><td align="center">
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #dde3ec;border-radius:0;box-shadow:0 24px 70px rgba(15,23,42,0.12);">
				<tr><td style="background:#070b14;padding:30px 36px 26px;color:#ffffff;border-bottom:4px solid #c9a84c;">
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0"><tr>
				<td>
				<div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1;font-weight:bold;color:#ffffff;letter-spacing:0;">Nexora</div>
				<div style="width:82px;height:4px;border-bottom:3px solid #f0b429;border-radius:0 0 999px 999px;margin-top:4px;"></div>
				</td>
				<td align="right" style="font-size:11px;color:#b9c3d2;text-transform:uppercase;letter-spacing:1.8px;">Order confirmation</td>
				</tr></table>
				</td></tr>
				<tr><td style="padding:36px 36px 18px;">
				<div style="display:inline-block;background:#ecfdf3;color:#047857;font-size:11px;font-weight:bold;padding:8px 12px;border:1px solid #bbf7d0;text-transform:uppercase;letter-spacing:1.1px;">Confirmed by Nexora</div>
				<h1 style="margin:20px 0 12px;font-size:30px;line-height:1.18;color:#0f172a;font-weight:700;">Your order is in motion, %s.</h1>
				<p style="margin:0;color:#526070;font-size:15px;line-height:1.7;">We have received your order and reserved your items. Our fulfillment team will prepare, quality-check, and dispatch it with care.</p>
				</td></tr>
				<tr><td style="padding:12px 36px 30px;">
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;">
				<tr>
				<td width="50%%" style="padding:18px 20px;border-right:1px solid #e2e8f0;"><div style="font-size:10px;color:#718096;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:7px;">Order number</div><strong style="font-size:15px;color:#0f172a;">%s</strong></td>
				<td width="50%%" style="padding:18px 20px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:7px;">Placed on</div><strong style="font-size:15px;color:#0f172a;">%s</strong></td>
				</tr></table>
				</td></tr>
				<tr><td style="padding:0 36px;">
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0"><tr>
				<td><h2 style="margin:0 0 14px;font-size:18px;color:#0f172a;font-weight:700;">Order summary</h2></td>
				<td align="right" style="font-size:12px;color:#64748b;">Premium dispatch queue</td>
				</tr></table>
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e2e8f0;">%s</table>
				</td></tr>
				<tr><td style="padding:22px 36px 30px;">
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
				%s
				<tr><td style="padding:15px 0 0;font-size:18px;font-weight:bold;border-top:1px solid #cbd5e1;color:#0f172a;">Order total</td><td align="right" style="padding:15px 0 0;font-size:22px;font-weight:bold;color:#9a741b;border-top:1px solid #cbd5e1;">%s</td></tr>
				</table>
				</td></tr>
				<tr><td style="padding:0 36px 34px;">
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0"><tr>
				<td valign="top" width="50%%" style="padding:20px;background:#fbfdff;border:1px solid #e2e8f0;">
				<div style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.3px;color:#718096;margin-bottom:10px;">Delivering to</div>
				<div style="font-size:14px;line-height:1.7;color:#334155;">%s</div>
				</td>
				<td width="14"></td>
				<td valign="top" width="50%%" style="padding:20px;background:#fbfdff;border:1px solid #e2e8f0;">
				<div style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.3px;color:#718096;margin-bottom:10px;">Payment</div>
				<div style="font-size:14px;font-weight:bold;color:#334155;">%s</div>
				<div style="font-size:13px;color:#718096;margin-top:6px;">%s</div>
				</td>
				</tr></table>
				</td></tr>
				<tr><td style="padding:0 36px 36px;">
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#0f172a;border:1px solid #1e293b;">
				<tr>
				<td style="padding:20px;color:#dbeafe;font-size:13px;line-height:1.7;">
				<strong style="color:#ffffff;">Nexora Signature Care</strong><br>
				Every shipment is packed with invoice details, delivery tracking, and support readiness.<br>
				<a href="tel:+919150357320" style="color:#f0b429;text-decoration:none;font-weight:bold;">Call Nexora: 9150357320</a>
				</td>
				<td align="right" style="padding:20px;color:#f0b429;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1.1px;">Priority support</td>
				</tr></table>
				</td></tr>
				<tr><td style="background:#070b14;padding:26px 36px;text-align:center;color:#93a4ba;font-size:12px;line-height:1.8;">
				Need help? Reply to this email or call <a href="tel:+919150357320" style="color:#f0b429;text-decoration:none;font-weight:bold;">9150357320</a>.<br>
				<span style="color:#ffffff;font-weight:bold;">Nexora</span> &nbsp;|&nbsp; Premium products, delivered with care.
				</td></tr>
				</table>
				</td></tr></table>
				</body></html>
				""".formatted(
				customerName,
				orderId,
				escape(order.placedAt()),
				itemRows,
				buildTotals(order),
				currency(order.total()),
				address,
				escape(order.paymentMethod()),
				escape(order.paymentStatus())
		);
	}

	private String buildItemRow(OrderConfirmationRequest.Item item) {
		String variant = item.variant() == null || item.variant().isBlank()
				? ""
				: "<div style=\"font-size:12px;color:#718096;margin-top:4px;\">" + escape(item.variant()) + "</div>";
		String image = buildItemImage(item);
		BigDecimal lineTotal = item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()));
		return "<tr>"
				+ "<td width=\"124\" valign=\"top\" style=\"padding:18px 16px 18px 0;border-bottom:1px solid #e2e8f0;\">"
				+ image
				+ "</td>"
				+ "<td valign=\"top\" style=\"padding:18px 0;border-bottom:1px solid #e2e8f0;\">"
				+ "<div style=\"font-size:15px;font-weight:bold;color:#0f172a;line-height:1.35;\">" + escape(item.name()) + "</div>"
				+ variant
				+ "<div style=\"font-size:12px;color:#718096;margin-top:7px;\">Quantity: " + item.quantity() + "</div>"
				+ "</td>"
				+ "<td align=\"right\" valign=\"top\" style=\"padding:18px 0 18px 14px;border-bottom:1px solid #e2e8f0;font-size:15px;font-weight:bold;color:#0f172a;white-space:nowrap;\">"
				+ currency(lineTotal)
				+ "</td></tr>";
	}

	private String buildItemImage(OrderConfirmationRequest.Item item) {
		if (item.imageUrl() == null || item.imageUrl().isBlank()) {
			return "<div style=\"width:112px;height:112px;background:#f1f5f9;border:1px solid #d6dee9;text-align:center;line-height:112px;color:#94a3b8;font-size:12px;font-weight:bold;\">Nexora</div>";
		}
		return "<img src=\"" + escape(item.imageUrl()) + "\" alt=\"" + escape(item.name())
				+ "\" width=\"112\" height=\"112\" style=\"display:block;width:112px;height:112px;object-fit:cover;border:1px solid #d6dee9;background:#f8fafc;\">";
	}

	private String buildTotals(OrderConfirmationRequest order) {
		return totalRow("Subtotal", currency(order.subtotal()))
				+ totalRow("GST", currency(order.gst()))
				+ totalRow("Shipping", order.shipping().signum() == 0 ? "Free" : currency(order.shipping()));
	}

	private String totalRow(String label, String value) {
		return "<tr><td style=\"padding:6px 0;color:#596579;font-size:14px;\">" + label
				+ "</td><td align=\"right\" style=\"padding:6px 0;color:#334155;font-size:14px;font-weight:600;\">" + value + "</td></tr>";
	}

	private String buildAddress(OrderConfirmationRequest.Address address) {
		String line2 = address.line2() == null || address.line2().isBlank() ? "" : escape(address.line2()) + "<br>";
		return "<strong>" + escape(address.fullName()) + "</strong><br>"
				+ escape(address.line1()) + "<br>" + line2
				+ escape(address.city()) + ", " + escape(address.state()) + " - " + escape(address.pincode())
				+ "<br>" + escape(address.phone());
	}

	private String currency(BigDecimal amount) {
		NumberFormat formatter = NumberFormat.getCurrencyInstance(INDIA);
		formatter.setMinimumFractionDigits(0);
		formatter.setMaximumFractionDigits(2);
		return formatter.format(amount);
	}

	private String escape(String value) {
		return HtmlUtils.htmlEscape(value == null ? "" : value);
	}
}
