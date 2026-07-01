package ecommerce_backend.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordResetEmailBuilderTests {

	private final PasswordResetEmailBuilder builder = new PasswordResetEmailBuilder();

	@Test
	void buildsBrandedEscapedResetEmail() {
		String html = builder.build("<Surya>", "http://localhost:3000/reset-password?token=abc");

		assertTrue(html.contains("Nexora"));
		assertTrue(html.contains("Reset Password"));
		assertTrue(html.contains("&lt;Surya&gt;"));
		assertFalse(html.contains("<Surya>"));
	}
}
