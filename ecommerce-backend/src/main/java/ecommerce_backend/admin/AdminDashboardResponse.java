package ecommerce_backend.admin;

import ecommerce_backend.category.CategoryResponse;
import ecommerce_backend.order.OrderResponse;
import ecommerce_backend.product.ProductResponse;
import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
		Summary summary,
		List<ProductResponse> products,
		List<CategoryResponse> categories,
		List<OrderResponse> recentOrders,
		List<StatusCount> orderStatus
) {
	public record Summary(
			long totalProducts,
			long activeProducts,
			long lowStockProducts,
			long totalCategories,
			long totalCustomers,
			long totalOrders,
			BigDecimal totalRevenue
	) {
	}

	public record StatusCount(String status, long count) {
	}
}
