package ecommerce_backend.order;

import static org.junit.jupiter.api.Assertions.assertTrue;

import ecommerce_backend.auth.AppUser;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class InvoicePdfServiceTests {

	private final InvoicePdfService invoicePdfService = new InvoicePdfService();

	@Test
	void generatesPdfInvoiceBytes() {
		AppUser user = new AppUser("Surya Kannan", "surya@example.com", "hash");
		CustomerOrder order = new CustomerOrder(
				"NXTEST123",
				user,
				"Cash on Delivery",
				"Pay on delivery",
				new OrderAddress("Surya Kannan", "surya@example.com", "9876543210",
						"Line 1", "", "Chennai", "Tamil Nadu", "600001"),
				new BigDecimal("1000.00"),
				new BigDecimal("180.00"),
				new BigDecimal("0.00"),
				new BigDecimal("1180.00")
		);
		order.onCreate();
		order.addItem(new OrderItem(1L, "Rolex Submariner", "Rolex",
				"Size: 42 mm", "", 1, new BigDecimal("1000.00")));

		byte[] pdf = invoicePdfService.generate(order);
		String header = new String(pdf, 0, 8, StandardCharsets.US_ASCII);

		assertTrue(header.startsWith("%PDF-1.4"));
		assertTrue(new String(pdf, StandardCharsets.US_ASCII).contains("NXTEST123"));
	}
}
