package ecommerce_backend.order;

public enum OrderStatus {
	PLACED,
	PAYMENT_VERIFICATION_PENDING,
	PAYMENT_REJECTED,
	CONFIRMED,
	PACKED,
	SHIPPED,
	OUT_FOR_DELIVERY,
	DELIVERED,
	CANCELLED;

	public boolean isCustomerCancellable() {
		return this == PLACED || this == PAYMENT_VERIFICATION_PENDING || this == PAYMENT_REJECTED
				|| this == CONFIRMED;
	}

	public boolean canTransitionTo(OrderStatus next) {
		return switch (this) {
			case PLACED -> next == PAYMENT_VERIFICATION_PENDING || next == CONFIRMED || next == CANCELLED;
			case PAYMENT_VERIFICATION_PENDING -> next == CONFIRMED || next == PAYMENT_REJECTED
					|| next == CANCELLED;
			case PAYMENT_REJECTED -> next == PAYMENT_VERIFICATION_PENDING || next == CANCELLED;
			case CONFIRMED -> next == PACKED || next == CANCELLED;
			case PACKED -> next == SHIPPED;
			case SHIPPED -> next == OUT_FOR_DELIVERY;
			case OUT_FOR_DELIVERY -> next == DELIVERED;
			case DELIVERED, CANCELLED -> false;
		};
	}
}
