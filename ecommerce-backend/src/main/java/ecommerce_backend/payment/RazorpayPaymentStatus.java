package ecommerce_backend.payment;

public enum RazorpayPaymentStatus {
	CREATED,
	CAPTURED,
	REFUND_PENDING,
	REFUNDED,
	REFUND_FAILED,
	FAILED,
	CANCELLED
}
