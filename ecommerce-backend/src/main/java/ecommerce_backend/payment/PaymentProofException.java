package ecommerce_backend.payment;

public class PaymentProofException extends RuntimeException {
	public PaymentProofException(String message) {
		super(message);
	}

	public PaymentProofException(String message, Throwable cause) {
		super(message, cause);
	}
}
