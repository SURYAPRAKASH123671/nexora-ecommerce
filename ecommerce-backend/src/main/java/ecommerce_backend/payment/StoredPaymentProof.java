package ecommerce_backend.payment;

public record StoredPaymentProof(
		String storageKey,
		String originalName,
		String contentType,
		long size,
		String sha256
) {
}
