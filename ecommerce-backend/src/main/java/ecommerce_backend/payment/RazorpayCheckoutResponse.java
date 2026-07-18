package ecommerce_backend.payment;

public record RazorpayCheckoutResponse(
		String keyId,
		String providerOrderId,
		String nexoraOrderNumber,
		long amount,
		String currency,
		String customerName,
		String customerEmail,
		String customerPhone
) {}
