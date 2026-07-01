package ecommerce_backend.order;

import java.math.BigDecimal;

public record OrderItemResponse(
		Long id,
		Long productId,
		String productName,
		String brand,
		String variant,
		String imageUrl,
		Integer quantity,
		BigDecimal unitPrice,
		BigDecimal lineTotal
) {
	public static OrderItemResponse from(OrderItem item) {
		return new OrderItemResponse(
				item.getId(),
				item.getProductId(),
				item.getProductName(),
				item.getBrand(),
				item.getVariant(),
				item.getImageUrl(),
				item.getQuantity(),
				item.getUnitPrice(),
				item.getLineTotal()
		);
	}
}
