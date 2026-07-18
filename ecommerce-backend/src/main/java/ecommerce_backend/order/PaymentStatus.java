package ecommerce_backend.order;

import java.util.EnumSet;
import java.util.Set;

public enum PaymentStatus {
	PENDING,
	PENDING_VERIFICATION,
	VERIFIED,
	REJECTED,
	AUTHORIZED,
	PAID,
	FAILED,
	REFUNDED,
	COD_PENDING,
	COD_COLLECTED;

	public boolean canTransitionTo(PaymentStatus next) {
		Set<PaymentStatus> allowed = switch (this) {
			case PENDING -> EnumSet.of(PENDING_VERIFICATION, AUTHORIZED, PAID, FAILED);
			case PENDING_VERIFICATION -> EnumSet.of(VERIFIED, REJECTED);
			case REJECTED -> EnumSet.of(PENDING_VERIFICATION);
			case VERIFIED -> EnumSet.of(REFUNDED);
			case AUTHORIZED -> EnumSet.of(PAID, FAILED);
			case PAID -> EnumSet.of(REFUNDED);
			case COD_PENDING -> EnumSet.of(COD_COLLECTED);
			case FAILED -> EnumSet.of(PENDING);
			case REFUNDED, COD_COLLECTED -> EnumSet.noneOf(PaymentStatus.class);
		};
		return allowed.contains(next);
	}
}
