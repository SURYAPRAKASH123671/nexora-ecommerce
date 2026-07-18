package ecommerce_backend.order;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ecommerce_backend.auth.AppUser;
import ecommerce_backend.auth.AppUserRepository;
import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.category.Category;
import ecommerce_backend.email.EmailResponse;
import ecommerce_backend.email.EmailService;
import ecommerce_backend.product.Product;
import ecommerce_backend.product.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class OrderServiceCheckoutTests {

	private CustomerOrderRepository orderRepository;
	private OrderHistoryRepository historyRepository;
	private ProductRepository productRepository;
	private AppUserRepository userRepository;
	private EmailService emailService;
	private OrderService orderService;
	private AppUser user;
	private UserPrincipal principal;

	@BeforeEach
	void setUp() {
		orderRepository = mock(CustomerOrderRepository.class);
		historyRepository = mock(OrderHistoryRepository.class);
		productRepository = mock(ProductRepository.class);
		userRepository = mock(AppUserRepository.class);
		emailService = mock(EmailService.class);
		orderService = new OrderService(orderRepository, historyRepository, emailService, userRepository, productRepository,
				new BigDecimal("0.18"), new BigDecimal("500.00"), new BigDecimal("99.00"));
		user = new AppUser("Surya", "surya@example.com", "hash");
		ReflectionTestUtils.setField(user, "id", 10L);
		user.markEmailVerified();
		principal = new UserPrincipal(user);
		when(userRepository.findById(10L)).thenReturn(java.util.Optional.of(user));
		when(emailService.sendOrderConfirmation(any())).thenReturn(
				new EmailResponse("SKIPPED", "surya@example.com", "confirmation", Instant.now()));
		when(orderRepository.save(any())).thenAnswer(invocation -> {
			CustomerOrder order = invocation.getArgument(0);
			ReflectionTestUtils.invokeMethod(order, "onCreate");
			return order;
		});
	}

	@Test
	void calculatesAuthoritativeTotalsAndIgnoresClientPrices() {
		Product product = product(1L, "Keyboard", "100.00", 5);
		when(productRepository.findAllForUpdate(Set.of(1L))).thenReturn(List.of(product));

		CreateOrderRequest request = request(1L, 2, new BigDecimal("1.00"), new BigDecimal("1.00"));
		OrderResponse response = orderService.createOrder(principal, request);

		assertEquals(new BigDecimal("200.00"), response.subtotal());
		assertEquals(new BigDecimal("36.00"), response.gst());
		assertEquals(new BigDecimal("99.00"), response.shipping());
		assertEquals(new BigDecimal("335.00"), response.total());
		assertEquals("COD_PENDING", response.paymentStatus());
		assertEquals(new BigDecimal("100.00"), response.items().get(0).unitPrice());
		assertEquals(3, product.getStockQuantity());
	}

	@Test
	void rejectsCheckoutWhenStockIsInsufficient() {
		Product product = product(1L, "Keyboard", "100.00", 1);
		when(productRepository.findAllForUpdate(Set.of(1L))).thenReturn(List.of(product));

		assertThrows(IllegalStateException.class,
				() -> orderService.createOrder(principal,
						request(1L, 2, new BigDecimal("100.00"), new BigDecimal("200.00"))));
		verify(orderRepository, never()).save(any());
	}

	private Product product(Long id, String name, String price, int stock) {
		Category category = new Category("Electronics", "Devices");
		ReflectionTestUtils.setField(category, "id", 5L);
		Product product = new Product(name, "Description", new BigDecimal(price), stock, "image", category);
		ReflectionTestUtils.setField(product, "id", id);
		return product;
	}

	private CreateOrderRequest request(Long productId, int quantity, BigDecimal clientUnitPrice,
			BigDecimal clientTotal) {
		return new CreateOrderRequest(
				"COD",
				"PAID",
				new OrderAddress("Surya", "surya@example.com", "9150357320", "Main Road", null,
						"Chennai", "Tamil Nadu", "600001"),
				List.of(new CreateOrderItemRequest(productId, "Tampered name", "Tampered brand", null,
						"tampered-image", quantity, clientUnitPrice)),
				clientTotal,
				BigDecimal.ZERO,
				BigDecimal.ZERO,
				clientTotal
		);
	}
}
