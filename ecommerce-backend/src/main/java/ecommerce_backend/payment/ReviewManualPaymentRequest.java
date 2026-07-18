package ecommerce_backend.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewManualPaymentRequest(
		@NotNull ManualPaymentDecision decision,
		@Size(max = 500) String note
) {
}
