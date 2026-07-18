package ecommerce_backend.order;

import java.time.Instant;

public record OrderHistoryResponse(
		String eventType,
		String fromValue,
		String toValue,
		String actor,
		String note,
		Instant createdAt
) {
	public static OrderHistoryResponse from(OrderHistoryEntry entry) {
		return new OrderHistoryResponse(entry.getEventType(), entry.getFromValue(), entry.getToValue(),
				entry.getActor(), entry.getNote(), entry.getCreatedAt());
	}
}
