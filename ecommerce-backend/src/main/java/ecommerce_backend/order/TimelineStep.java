package ecommerce_backend.order;

import java.util.List;

public record TimelineStep(String status, String label, boolean completed, boolean current) {

	public static List<TimelineStep> forStatus(OrderStatus orderStatus) {
		if (orderStatus == OrderStatus.CANCELLED) {
			return List.of(
					new TimelineStep("PLACED", "Order placed", true, false),
					new TimelineStep("CANCELLED", "Order cancelled", true, true)
			);
		}
		if (orderStatus == OrderStatus.PAYMENT_VERIFICATION_PENDING
				|| orderStatus == OrderStatus.PAYMENT_REJECTED) {
			return List.of(
					new TimelineStep("PLACED", "Order reference created", true, false),
					new TimelineStep(orderStatus.name(), label(orderStatus), true, true),
					new TimelineStep("CONFIRMED", "Confirmed after verification", false, false)
			);
		}
		List<OrderStatus> statuses = List.of(
				OrderStatus.PLACED,
				OrderStatus.CONFIRMED,
				OrderStatus.PACKED,
				OrderStatus.SHIPPED,
				OrderStatus.OUT_FOR_DELIVERY,
				OrderStatus.DELIVERED
		);
		int currentIndex = statuses.indexOf(orderStatus);
		return statuses.stream()
				.map(status -> new TimelineStep(status.name(), label(status),
						statuses.indexOf(status) <= currentIndex, status == orderStatus))
				.toList();
	}

	private static String label(OrderStatus status) {
		return switch (status) {
			case PLACED -> "Order placed";
			case PAYMENT_VERIFICATION_PENDING -> "Payment pending verification";
			case PAYMENT_REJECTED -> "Payment proof rejected";
			case CONFIRMED -> "Confirmed";
			case PACKED -> "Packed";
			case SHIPPED -> "Shipped";
			case OUT_FOR_DELIVERY -> "Out for delivery";
			case DELIVERED -> "Delivered";
			case CANCELLED -> "Cancelled";
		};
	}
}
