package ecommerce_backend.order;

import ecommerce_backend.auth.AppUser;
import ecommerce_backend.auth.AppUserRepository;
import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.common.NotFoundException;
import ecommerce_backend.email.EmailDeliveryException;
import ecommerce_backend.email.EmailResponse;
import ecommerce_backend.email.EmailService;
import ecommerce_backend.email.OrderConfirmationRequest;
import ecommerce_backend.product.Product;
import ecommerce_backend.product.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

	private static final DateTimeFormatter EMAIL_DATE_FORMAT =
			DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a").withZone(ZoneId.of("Asia/Kolkata"));

	private final CustomerOrderRepository orderRepository;
	private final OrderHistoryRepository historyRepository;
	private final EmailService emailService;
	private final AppUserRepository userRepository;
	private final ProductRepository productRepository;
	private final BigDecimal gstRate;
	private final BigDecimal freeShippingThreshold;
	private final BigDecimal shippingFee;

	public OrderService(CustomerOrderRepository orderRepository, OrderHistoryRepository historyRepository,
			EmailService emailService,
			AppUserRepository userRepository, ProductRepository productRepository,
			@Value("${app.checkout.gst-rate:0.18}") BigDecimal gstRate,
			@Value("${app.checkout.free-shipping-threshold:500.00}") BigDecimal freeShippingThreshold,
			@Value("${app.checkout.shipping-fee:99.00}") BigDecimal shippingFee) {
		this.orderRepository = orderRepository;
		this.historyRepository = historyRepository;
		this.emailService = emailService;
		this.userRepository = userRepository;
		this.productRepository = productRepository;
		this.gstRate = gstRate;
		this.freeShippingThreshold = freeShippingThreshold;
		this.shippingFee = shippingFee;
	}

	@Transactional
	public OrderResponse createOrder(UserPrincipal principal, CreateOrderRequest request) {
		AppUser user = currentUser(principal);
		Map<Long, Integer> requestedQuantities = aggregateQuantities(request.items());
		Map<Long, Product> products = productRepository.findAllForUpdate(requestedQuantities.keySet()).stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));
		if (products.size() != requestedQuantities.size()) {
			throw new NotFoundException("One or more products are unavailable.");
		}

		requestedQuantities.forEach((productId, quantity) -> products.get(productId).reserveStock(quantity));
		BigDecimal subtotal = requestedQuantities.entrySet().stream()
				.map(entry -> products.get(entry.getKey()).getPrice().multiply(BigDecimal.valueOf(entry.getValue())))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal gst = subtotal.multiply(gstRate).setScale(2, RoundingMode.HALF_UP);
		BigDecimal shipping = subtotal.compareTo(freeShippingThreshold) >= 0 ? BigDecimal.ZERO : shippingFee;
		BigDecimal total = subtotal.add(gst).add(shipping).setScale(2, RoundingMode.HALF_UP);

		String orderNumber = "NX-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
		String paymentMethod = request.paymentMethod().trim().toUpperCase();
		CustomerOrder order = new CustomerOrder(
				orderNumber,
				user,
				paymentMethod,
				paymentMethod.equals("COD") ? PaymentStatus.COD_PENDING.name() : PaymentStatus.PENDING.name(),
				cleanAddress(request.deliveryAddress()),
				money(subtotal),
				money(gst),
				money(shipping),
				money(total)
		);
		requestedQuantities.forEach((productId, quantity) -> {
			Product product = products.get(productId);
			CreateOrderItemRequest requestedItem = request.items().stream()
					.filter(item -> item.productId().equals(productId))
					.findFirst()
					.orElseThrow();
			order.addItem(new OrderItem(
					product.getId(),
					product.getName(),
					null,
					blankToNull(requestedItem.variant()),
					blankToNull(product.getImageUrl()),
					quantity,
					money(product.getPrice())
			));
		});
		CustomerOrder savedOrder = orderRepository.save(order);
		historyRepository.save(new OrderHistoryEntry(savedOrder, "ORDER_STATUS", "NEW",
				savedOrder.getStatus().name(), principal.getUsername(), "Order created"));
		String confirmationEmailStatus = paymentMethod.equals("UPI")
				? "DEFERRED_UNTIL_PAYMENT_VERIFICATION"
				: sendConfirmation(savedOrder);
		return OrderResponse.from(savedOrder, confirmationEmailStatus);
	}

	@Transactional(readOnly = true)
	public List<OrderResponse> myOrders(UserPrincipal principal) {
		return orderRepository.findByUserOrderByPlacedAtDesc(currentUser(principal)).stream()
				.map(OrderResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public CustomerOrder getOwnedOrder(UserPrincipal principal, String orderNumber) {
		return orderRepository.findByOrderNumberAndUser(orderNumber, currentUser(principal))
				.orElseThrow(() -> new NotFoundException("Order not found: " + orderNumber));
	}

	@Transactional(readOnly = true)
	public OrderResponse orderDetails(UserPrincipal principal, String orderNumber) {
		return OrderResponse.from(getOwnedOrder(principal, orderNumber));
	}

	@Transactional
	public OrderResponse cancelOrder(UserPrincipal principal, String orderNumber) {
		CustomerOrder order = getOwnedOrder(principal, orderNumber);
		if (!order.getStatus().isCustomerCancellable() && order.getStatus() != OrderStatus.CANCELLED) {
			throw new IllegalStateException("Orders can only be cancelled before packing.");
		}
		if (order.getStatus() != OrderStatus.CANCELLED) {
			String previous = order.getStatus().name();
			restoreInventory(order);
			order.cancel();
			historyRepository.save(new OrderHistoryEntry(order, "ORDER_STATUS", previous,
					order.getStatus().name(), principal.getUsername(), "Cancelled by customer"));
		}
		return OrderResponse.from(order);
	}

	@Transactional(readOnly = true)
	public List<OrderResponse> allOrders() {
		return orderRepository.findAllByOrderByPlacedAtDesc().stream().map(OrderResponse::from).toList();
	}

	@Transactional
	public OrderResponse updateStatus(String orderNumber, OrderStatus nextStatus, String actor) {
		CustomerOrder order = orderRepository.findByOrderNumber(orderNumber)
				.orElseThrow(() -> new NotFoundException("Order not found: " + orderNumber));
		if (nextStatus == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED) {
			restoreInventory(order);
		}
		String previous = order.getStatus().name();
		order.transitionTo(nextStatus);
		if (!previous.equals(order.getStatus().name())) {
			historyRepository.save(new OrderHistoryEntry(order, "ORDER_STATUS", previous,
					order.getStatus().name(), actor, "Updated by administrator"));
		}
		return OrderResponse.from(order);
	}

	@Transactional
	public OrderResponse updatePaymentStatus(String orderNumber, PaymentStatus nextStatus, String actor) {
		CustomerOrder order = orderRepository.findByOrderNumber(orderNumber)
				.orElseThrow(() -> new NotFoundException("Order not found: " + orderNumber));
		if ("UPI".equals(order.getPaymentMethod())
				&& (nextStatus == PaymentStatus.AUTHORIZED || nextStatus == PaymentStatus.PAID
						|| nextStatus == PaymentStatus.VERIFIED)) {
			throw new IllegalStateException(
					"Manual UPI payments must be approved through the protected proof review endpoint.");
		}
		String previous = order.getPaymentStatus();
		order.transitionPaymentTo(nextStatus);
		if (!previous.equals(order.getPaymentStatus())) {
			historyRepository.save(new OrderHistoryEntry(order, "PAYMENT_STATUS", previous,
					order.getPaymentStatus(), actor, "Updated by administrator"));
		}
		return OrderResponse.from(order);
	}

	private String sendConfirmation(CustomerOrder order) {
		try {
			EmailResponse response = emailService.sendOrderConfirmation(new OrderConfirmationRequest(
					order.getDeliveryEmail(),
					order.getDeliveryFullName(),
					order.getOrderNumber(),
					EMAIL_DATE_FORMAT.format(order.getPlacedAt()),
					order.getPaymentMethod(),
					order.getPaymentStatus(),
					order.getItems().stream()
							.map(item -> new OrderConfirmationRequest.Item(
									item.getProductName(),
									item.getVariant() == null ? "" : item.getVariant(),
									item.getImageUrl() == null ? "" : item.getImageUrl(),
									item.getQuantity(),
									item.getUnitPrice()))
							.toList(),
					new OrderConfirmationRequest.Address(
							order.getDeliveryFullName(),
							order.getDeliveryPhone(),
							order.getDeliveryLine1(),
							order.getDeliveryLine2() == null ? "" : order.getDeliveryLine2(),
							order.getDeliveryCity(),
							order.getDeliveryState(),
							order.getDeliveryPincode()),
					order.getSubtotal(),
					order.getGst(),
					order.getShipping(),
					order.getTotal()
			));
			return response.status();
		}
		catch (EmailDeliveryException exception) {
			// The order must remain placed even if SMTP is temporarily unavailable.
			return "FAILED";
		}
	}

	public String sendVerifiedOrderConfirmation(CustomerOrder order) {
		if (!PaymentStatus.VERIFIED.name().equals(order.getPaymentStatus())) {
			throw new IllegalStateException("A UPI confirmation email requires verified payment.");
		}
		return sendConfirmation(order);
	}

	private OrderAddress cleanAddress(OrderAddress address) {
		return new OrderAddress(
				address.fullName().trim(),
				address.email().trim(),
				address.phone().trim(),
				address.line1().trim(),
				blankToNull(address.line2()),
				address.city().trim(),
				address.state().trim(),
				address.pincode().trim()
		);
	}

	private BigDecimal money(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}

	private Map<Long, Integer> aggregateQuantities(List<CreateOrderItemRequest> items) {
		Map<Long, Integer> quantities = new LinkedHashMap<>();
		items.forEach(item -> quantities.merge(item.productId(), item.quantity(), Integer::sum));
		return quantities;
	}

	private void restoreInventory(CustomerOrder order) {
		Map<Long, Integer> quantities = order.getItems().stream()
				.filter(item -> item.getProductId() != null)
				.collect(Collectors.toMap(OrderItem::getProductId, OrderItem::getQuantity, Integer::sum));
		Map<Long, Product> products = productRepository.findAllForUpdate(quantities.keySet()).stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));
		quantities.forEach((productId, quantity) -> {
			Product product = products.get(productId);
			if (product != null) {
				product.restoreStock(quantity);
			}
		});
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private AppUser currentUser(UserPrincipal principal) {
		return userRepository.findById(principal.getUser().getId())
				.orElseThrow(() -> new NotFoundException("User not found."));
	}
}
