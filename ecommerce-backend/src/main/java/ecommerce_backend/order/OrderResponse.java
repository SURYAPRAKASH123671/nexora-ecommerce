package ecommerce_backend.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
		String orderNumber,
		String status,
		String paymentMethod,
		String paymentStatus,
		OrderAddress deliveryAddress,
		BigDecimal subtotal,
		BigDecimal gst,
		BigDecimal shipping,
		BigDecimal total,
		Instant placedAt,
		Instant cancelledAt,
		List<OrderItemResponse> items,
		List<TimelineStep> timeline,
		String confirmationEmailStatus
) {
	public static OrderResponse from(CustomerOrder order) {
		return from(order, null);
	}

	public static OrderResponse from(CustomerOrder order, String confirmationEmailStatus) {
		OrderAddress address = new OrderAddress(
				order.getDeliveryFullName(),
				order.getDeliveryEmail(),
				order.getDeliveryPhone(),
				order.getDeliveryLine1(),
				order.getDeliveryLine2(),
				order.getDeliveryCity(),
				order.getDeliveryState(),
				order.getDeliveryPincode()
		);
		return new OrderResponse(
				order.getOrderNumber(),
				order.getStatus().name(),
				order.getPaymentMethod(),
				order.getPaymentStatus(),
				address,
				order.getSubtotal(),
				order.getGst(),
				order.getShipping(),
				order.getTotal(),
				order.getPlacedAt(),
				order.getCancelledAt(),
				order.getItems().stream().map(OrderItemResponse::from).toList(),
				TimelineStep.forStatus(order.getStatus()),
				confirmationEmailStatus
		);
	}
}
