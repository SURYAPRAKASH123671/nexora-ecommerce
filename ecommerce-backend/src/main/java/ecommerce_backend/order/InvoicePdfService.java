package ecommerce_backend.order;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {

	private static final DateTimeFormatter DATE_FORMAT =
			DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a").withZone(ZoneId.of("Asia/Kolkata"));

	public byte[] generate(CustomerOrder order) {
		List<String> lines = new ArrayList<>();
		lines.add("NEXORA INVOICE");
		lines.add("Order: " + order.getOrderNumber());
		lines.add("Date: " + DATE_FORMAT.format(order.getPlacedAt()));
		lines.add("Status: " + order.getStatus().name());
		lines.add("Payment: " + order.getPaymentMethod() + " - " + order.getPaymentStatus());
		lines.add("");
		lines.add("Bill To / Deliver To");
		lines.add(order.getDeliveryFullName());
		lines.add(order.getDeliveryPhone() + " | " + order.getDeliveryEmail());
		lines.add(order.getDeliveryLine1());
		if (order.getDeliveryLine2() != null && !order.getDeliveryLine2().isBlank()) {
			lines.add(order.getDeliveryLine2());
		}
		lines.add(order.getDeliveryCity() + ", " + order.getDeliveryState() + " - " + order.getDeliveryPincode());
		lines.add("");
		lines.add("Items");
		for (OrderItem item : order.getItems()) {
			String variant = item.getVariant() == null || item.getVariant().isBlank() ? "" : " (" + item.getVariant() + ")";
			lines.add(item.getProductName() + variant);
			lines.add("  Qty " + item.getQuantity() + " x " + money(item.getUnitPrice())
					+ " = " + money(item.getLineTotal()));
		}
		lines.add("");
		lines.add("Subtotal: " + money(order.getSubtotal()));
		lines.add("GST: " + money(order.getGst()));
		lines.add("Shipping: " + money(order.getShipping()));
		lines.add("Total: " + money(order.getTotal()));
		lines.add("");
		lines.add("Thank you for shopping with Nexora.");

		return simplePdf(lines);
	}

	private byte[] simplePdf(List<String> lines) {
		StringBuilder content = new StringBuilder();
		content.append("BT\n/F1 22 Tf\n50 790 Td\n(").append(escape(lines.get(0))).append(") Tj\n");
		content.append("/F1 10 Tf\n0 -28 Td\n");
		for (int i = 1; i < lines.size(); i++) {
			content.append("(").append(escape(lines.get(i))).append(") Tj\n0 -15 Td\n");
		}
		content.append("ET\n");

		byte[] streamBytes = content.toString().getBytes(StandardCharsets.US_ASCII);
		List<byte[]> objects = List.of(
				"<< /Type /Catalog /Pages 2 0 R >>".getBytes(StandardCharsets.US_ASCII),
				"<< /Type /Pages /Kids [3 0 R] /Count 1 >>".getBytes(StandardCharsets.US_ASCII),
				"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
						.getBytes(StandardCharsets.US_ASCII),
				"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>".getBytes(StandardCharsets.US_ASCII),
				("<< /Length " + streamBytes.length + " >>\nstream\n" + content + "endstream")
						.getBytes(StandardCharsets.US_ASCII)
		);

		ByteArrayOutputStream out = new ByteArrayOutputStream();
		List<Integer> offsets = new ArrayList<>();
		write(out, "%PDF-1.4\n");
		for (int i = 0; i < objects.size(); i++) {
			offsets.add(out.size());
			write(out, (i + 1) + " 0 obj\n");
			out.writeBytes(objects.get(i));
			write(out, "\nendobj\n");
		}
		int xrefStart = out.size();
		write(out, "xref\n0 " + (objects.size() + 1) + "\n");
		write(out, "0000000000 65535 f \n");
		for (Integer offset : offsets) {
			write(out, String.format("%010d 00000 n \n", offset));
		}
		write(out, "trailer\n<< /Size " + (objects.size() + 1) + " /Root 1 0 R >>\n");
		write(out, "startxref\n" + xrefStart + "\n%%EOF\n");
		return out.toByteArray();
	}

	private void write(ByteArrayOutputStream out, String value) {
		out.writeBytes(value.getBytes(StandardCharsets.US_ASCII));
	}

	private String escape(String value) {
		return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
				.replaceAll("[^\\x20-\\x7E]", "");
	}

	private String money(BigDecimal value) {
		return "INR " + value.toPlainString();
	}
}
