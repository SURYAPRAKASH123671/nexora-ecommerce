package ecommerce_backend.payment;

public record RazorpayVerificationResponse(
		String orderNumber,
		String orderStatus,
		String paymentStatus,
		String providerPaymentId
) {}
