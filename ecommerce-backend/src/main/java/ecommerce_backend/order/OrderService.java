package ecommerce_backend.order;

import ecommerce_backend.auth.AppUser;
import ecommerce_backend.auth.AppUserRepository;
import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.common.NotFoundException;
import ecommerce_backend.email.EmailDeliveryException;
import ecommerce_backend.email.EmailResponse;
import ecommerce_backend.email.EmailService;
import ecommerce_backend.email.OrderConfirmationRequest;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

	private static final DateTimeFormatter EMAIL_DATE_FORMAT =
			DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a").withZone(ZoneId.of("Asia/Kolkata"));

	private final CustomerOrderRepository orderRepository;
	private final EmailService emailService;
	private final AppUserRepository userRepository;

	public OrderService(CustomerOrderRepository orderRepository, EmailService emailService,
			AppUserRepository userRepository) {
		this.orderRepository = orderRepository;
		this.emailService = emailService;
		this.userRepository = userRepository;
	}

	@Transactional
	public OrderResponse createOrder(UserPrincipal principal, CreateOrderRequest request) {
		AppUser user = currentUser(principal);
		String orderNumber = "NX" + Long.toString(System.currentTimeMillis(), 36).toUpperCase();
		CustomerOrder order = new CustomerOrder(
				orderNumber,
				user,
				request.paymentMethod().trim(),
				request.paymentStatus().trim(),
				cleanAddress(request.deliveryAddress()),
				money(request.subtotal()),
				money(request.gst()),
				money(request.shipping()),
				money(request.total())
		);
		request.items().forEach(item -> order.addItem(new OrderItem(
				item.productId(),
				item.productName().trim(),
				blankToNull(item.brand()),
				blankToNull(item.variant()),
				blankToNull(item.imageUrl()),
				item.quantity(),
				money(item.unitPrice())
		)));
		CustomerOrder savedOrder = orderRepository.save(order);
		String confirmationEmailStatus = sendConfirmation(savedOrder);
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
		if (order.getStatus() == OrderStatus.DELIVERED) {
			throw new IllegalStateException("Delivered orders cannot be cancelled.");
		}
		if (order.getStatus() != OrderStatus.CANCELLED) {
			order.cancel();
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
		return value.setScale(2, java.math.RoundingMode.HALF_UP);
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private AppUser currentUser(UserPrincipal principal) {
		return userRepository.findById(principal.getUser().getId())
				.orElseThrow(() -> new NotFoundException("User not found."));
	}
}
