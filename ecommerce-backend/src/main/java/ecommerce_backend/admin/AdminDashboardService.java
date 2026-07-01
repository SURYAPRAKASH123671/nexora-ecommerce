package ecommerce_backend.admin;

import ecommerce_backend.auth.AppUserRepository;
import ecommerce_backend.category.CategoryRepository;
import ecommerce_backend.category.CategoryResponse;
import ecommerce_backend.order.CustomerOrder;
import ecommerce_backend.order.CustomerOrderRepository;
import ecommerce_backend.order.OrderResponse;
import ecommerce_backend.order.OrderStatus;
import ecommerce_backend.product.Product;
import ecommerce_backend.product.ProductRepository;
import ecommerce_backend.product.ProductResponse;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDashboardService {

	private static final int LOW_STOCK_THRESHOLD = 5;

	private final ProductRepository productRepository;
	private final CategoryRepository categoryRepository;
	private final CustomerOrderRepository orderRepository;
	private final AppUserRepository userRepository;

	public AdminDashboardService(ProductRepository productRepository,
			CategoryRepository categoryRepository,
			CustomerOrderRepository orderRepository,
			AppUserRepository userRepository) {
		this.productRepository = productRepository;
		this.categoryRepository = categoryRepository;
		this.orderRepository = orderRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public AdminDashboardResponse dashboard() {
		List<Product> products = productRepository.findAll();
		List<CustomerOrder> orders = orderRepository.findAllByOrderByPlacedAtDesc();
		BigDecimal revenue = orders.stream()
				.filter(order -> order.getStatus() != OrderStatus.CANCELLED)
				.map(CustomerOrder::getTotal)
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		AdminDashboardResponse.Summary summary = new AdminDashboardResponse.Summary(
				products.size(),
				products.stream().filter(Product::isActive).count(),
				products.stream().filter(product -> product.getStockQuantity() <= LOW_STOCK_THRESHOLD).count(),
				categoryRepository.count(),
				userRepository.count(),
				orders.size(),
				revenue
		);

		List<AdminDashboardResponse.StatusCount> statusCounts = Arrays.stream(OrderStatus.values())
				.map(status -> new AdminDashboardResponse.StatusCount(
						status.name(),
						orders.stream().filter(order -> order.getStatus() == status).count()))
				.toList();

		return new AdminDashboardResponse(
				summary,
				products.stream().map(ProductResponse::from).toList(),
				categoryRepository.findAll().stream().map(CategoryResponse::from).toList(),
				orders.stream().limit(10).map(OrderResponse::from).toList(),
				statusCounts
		);
	}
}
