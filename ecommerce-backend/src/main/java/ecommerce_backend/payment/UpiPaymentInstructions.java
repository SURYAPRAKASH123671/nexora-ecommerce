package ecommerce_backend.payment;

import java.math.BigDecimal;

public record UpiPaymentInstructions(
		String orderNumber,
		BigDecimal amount,
		String merchantName,
		String merchantUpiId,
		String paymentUri,
		String paymentStatus,
		String orderStatus
) {
}
