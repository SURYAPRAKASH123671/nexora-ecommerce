package ecommerce_backend.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EmailVerificationEmailBuilderTests {

	private final EmailVerificationEmailBuilder builder = new EmailVerificationEmailBuilder();

	@Test
	void buildsBrandedEscapedVerificationEmail() {
		String html = builder.build("<Surya>", "http://localhost:8080/api/auth/verify-email?token=abc");

		assertTrue(html.contains("Nexora"));
		assertTrue(html.contains("Verify Email"));
		assertTrue(html.contains("&lt;Surya&gt;"));
		assertFalse(html.contains("<Surya>"));
	}
}
