package ecommerce_backend.payment;

import java.math.BigDecimal;
import java.time.Instant;

public record ManualUpiPaymentResponse(
		Long id,
		String orderNumber,
		String customerName,
		String customerEmail,
		BigDecimal amount,
		String merchantUpiId,
		String payerReference,
		String reviewStatus,
		String proofContentType,
		long proofSize,
		String proofSha256,
		String proofUrl,
		Instant submittedAt,
		Instant reviewedAt,
		String reviewedBy,
		String reviewerNote,
		String orderStatus
) {
	public static ManualUpiPaymentResponse from(ManualUpiPayment payment) {
		return new ManualUpiPaymentResponse(
				payment.getId(), payment.getOrder().getOrderNumber(), payment.getOrder().getDeliveryFullName(),
				payment.getOrder().getDeliveryEmail(), payment.getAmount(), payment.getMerchantUpiId(),
				payment.getPayerReference(), payment.getReviewStatus().name(), payment.getProofContentType(),
				payment.getProofSize(), payment.getProofSha256(),
				"/api/admin/payments/upi/" + payment.getId() + "/proof", payment.getSubmittedAt(),
				payment.getReviewedAt(), payment.getReviewedBy(), payment.getReviewerNote(),
				payment.getOrder().getStatus().name());
	}
}
