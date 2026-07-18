package ecommerce_backend.payment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class RazorpaySignatureVerifier {
	private RazorpaySignatureVerifier() {}

	public static boolean verifyPayment(String providerOrderId, String paymentId, String suppliedSignature,
			String secret) {
		return verify(providerOrderId + "|" + paymentId, suppliedSignature, secret);
	}

	public static boolean verifyWebhook(byte[] payload, String suppliedSignature, String secret) {
		return verify(payload, suppliedSignature, secret);
	}

	private static boolean verify(String payload, String suppliedSignature, String secret) {
		return verify(payload.getBytes(StandardCharsets.UTF_8), suppliedSignature, secret);
	}

	private static boolean verify(byte[] payload, String suppliedSignature, String secret) {
		if (suppliedSignature == null || !suppliedSignature.matches("[0-9a-fA-F]{64}") || secret == null) return false;
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			byte[] expected = mac.doFinal(payload);
			byte[] supplied = java.util.HexFormat.of().parseHex(suppliedSignature);
			return MessageDigest.isEqual(expected, supplied);
		}
		catch (NoSuchAlgorithmException | java.security.InvalidKeyException exception) {
			throw new IllegalStateException("HMAC-SHA256 is unavailable.", exception);
		}
	}
}
