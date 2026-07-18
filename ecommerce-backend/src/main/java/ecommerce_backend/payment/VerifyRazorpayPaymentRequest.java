package ecommerce_backend.payment;

import jakarta.validation.constraints.NotBlank;

public record VerifyRazorpayPaymentRequest(
		@NotBlank String razorpayOrderId,
		@NotBlank String razorpayPaymentId,
		@NotBlank String razorpaySignature
) {}
