package ecommerce_backend.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class RazorpaySignatureVerifierTests {
	private static final String SECRET = "EnLs21M47BllR3X8PSFtjtbd";

	@Test
	void acceptsOfficialRazorpayPaymentSignatureExample() {
		assertThat(RazorpaySignatureVerifier.verifyPayment(
				"order_IEIaMR65cu6nz3",
				"pay_IH4NVgf4Dreq1l",
				"0d4e745a1838664ad6c9c9902212a32d627d68e917290b0ad5f08ff4561bc50f",
				SECRET)).isTrue();
	}

	@Test
	void rejectsTamperedPaymentAndMalformedSignatures() {
		assertThat(RazorpaySignatureVerifier.verifyPayment(
				"order_IEIaMR65cu6nz3", "pay_tampered",
				"0d4e745a1838664ad6c9c9902212a32d627d68e917290b0ad5f08ff4561bc50f",
				SECRET)).isFalse();
		assertThat(RazorpaySignatureVerifier.verifyPayment("order", "payment", "not-hex", SECRET)).isFalse();
	}

	@Test
	void webhookVerificationIsByteExact() {
		byte[] payload = "{\"event\":\"payment.captured\"}".getBytes(StandardCharsets.UTF_8);
		String signature = hmac(payload, "webhook-secret");
		assertThat(RazorpaySignatureVerifier.verifyWebhook(payload, signature, "webhook-secret")).isTrue();
		assertThat(RazorpaySignatureVerifier.verifyWebhook(
				"{\"event\":\"payment.failed\"}".getBytes(StandardCharsets.UTF_8), signature, "webhook-secret")).isFalse();
	}

	private String hmac(byte[] payload, String secret) {
		try {
			var mac = javax.crypto.Mac.getInstance("HmacSHA256");
			mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			return java.util.HexFormat.of().formatHex(mac.doFinal(payload));
		}
		catch (Exception exception) {
			throw new AssertionError(exception);
		}
	}
}
