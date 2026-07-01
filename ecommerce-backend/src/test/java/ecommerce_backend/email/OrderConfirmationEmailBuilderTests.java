package ecommerce_backend.email;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class OrderConfirmationEmailBuilderTests {

	private final OrderConfirmationEmailBuilder builder = new OrderConfirmationEmailBuilder();

	@Test
	void buildsBrandedReceiptAndEscapesCustomerContent() {
		OrderConfirmationRequest request = new OrderConfirmationRequest(
				"customer@example.com",
				"Surya <script>alert(1)</script>",
				"NX12345",
				"29 Jun 2026, 6:30 pm",
				"UPI",
				"Paid",
				List.of(new OrderConfirmationRequest.Item(
						"Premium Watch", "Color: Black", "https://cdn.example.com/watch.jpg?name=<bad>",
						2, new BigDecimal("4999"))),
				new OrderConfirmationRequest.Address(
						"Surya Kannan", "9876543210", "12 Market Road", "Near Metro",
						"Chennai", "Tamil Nadu", "600001"),
				new BigDecimal("9998"),
				new BigDecimal("1800"),
				BigDecimal.ZERO,
				new BigDecimal("11798"));

		String html = builder.build(request);

		assertTrue(html.contains("Nexora"));
		assertTrue(html.contains("NX12345"));
		assertTrue(html.contains("Premium Watch"));
		assertTrue(html.contains("https://cdn.example.com/watch.jpg?name=&lt;bad&gt;"));
		assertTrue(html.contains("width=\"112\" height=\"112\""));
		assertTrue(html.contains("Confirmed by Nexora"));
		assertTrue(html.contains("Nexora Signature Care"));
		assertTrue(html.contains("tel:+919150357320"));
		assertTrue(html.contains("9150357320"));
		assertTrue(html.contains("Surya &lt;script&gt;alert(1)&lt;/script&gt;"));
		assertFalse(html.contains("<script>alert(1)</script>"));
	}
}
