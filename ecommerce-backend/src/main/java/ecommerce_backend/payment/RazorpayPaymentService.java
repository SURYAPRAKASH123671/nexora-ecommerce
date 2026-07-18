package ecommerce_backend.payment;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.common.NotFoundException;
import ecommerce_backend.order.CustomerOrder;
import ecommerce_backend.order.OrderHistoryEntry;
import ecommerce_backend.order.OrderHistoryRepository;
import ecommerce_backend.order.OrderService;
import ecommerce_backend.order.OrderStatus;
import ecommerce_backend.order.PaymentStatus;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RazorpayPaymentService {
	private final RazorpayApiClient apiClient;
	private final RazorpayPaymentAttemptRepository attemptRepository;
	private final OrderHistoryRepository historyRepository;
	private final OrderService orderService;
	private final ObjectMapper objectMapper;
	private final String webhookSecret;

	public RazorpayPaymentService(RazorpayApiClient apiClient,
			RazorpayPaymentAttemptRepository attemptRepository,
			OrderHistoryRepository historyRepository,
			OrderService orderService, ObjectMapper objectMapper,
			@Value("${app.razorpay.webhook-secret:}") String webhookSecret) {
		this.apiClient = apiClient;
		this.attemptRepository = attemptRepository;
		this.historyRepository = historyRepository;
		this.orderService = orderService;
		this.objectMapper = objectMapper;
		this.webhookSecret = webhookSecret.trim();
	}

	@Transactional
	public RazorpayCheckoutResponse createProviderOrder(UserPrincipal principal, String orderNumber) {
		CustomerOrder order = orderService.getOwnedOrder(principal, orderNumber);
		if (!"RAZORPAY".equals(order.getPaymentMethod()))
			throw new IllegalStateException("This order was not created for Razorpay checkout.");
		if (PaymentStatus.PAID.name().equals(order.getPaymentStatus()))
			throw new IllegalStateException("This order is already paid.");
		var existing = attemptRepository.findTopByOrderOrderByCreatedAtDesc(order);
		if (existing.isPresent() && existing.get().getStatus() == RazorpayPaymentStatus.CREATED)
			return response(order, existing.get());
		if (PaymentStatus.FAILED.name().equals(order.getPaymentStatus()))
			order.transitionPaymentTo(PaymentStatus.PENDING);

		long amountPaise = order.getTotal().movePointRight(2).setScale(0, RoundingMode.UNNECESSARY).longValueExact();
		JsonNode provider = apiClient.createOrder(amountPaise, order.getOrderNumber(), order.getOrderNumber());
		String providerOrderId = requiredText(provider, "id");
		if (provider.path("amount").asLong(-1) != amountPaise || !"INR".equals(provider.path("currency").asText()))
			throw new PaymentGatewayException("Razorpay returned inconsistent order details.");
		RazorpayPaymentAttempt attempt = attemptRepository.save(
				new RazorpayPaymentAttempt(order, providerOrderId, amountPaise, "INR"));
		historyRepository.save(new OrderHistoryEntry(order, "PAYMENT_ATTEMPT", "NONE", "CREATED",
				principal.getUsername(), "Razorpay order " + providerOrderId));
		return response(order, attempt);
	}

	@Transactional
	public RazorpayVerificationResponse verify(UserPrincipal principal, String orderNumber,
			VerifyRazorpayPaymentRequest request) {
		CustomerOrder order = orderService.getOwnedOrder(principal, orderNumber);
		RazorpayPaymentAttempt attempt = attemptRepository.findByProviderOrderId(request.razorpayOrderId())
				.orElseThrow(() -> new NotFoundException("Payment attempt not found."));
		if (!attempt.getOrder().getId().equals(order.getId()))
			throw new IllegalStateException("Payment attempt does not belong to this order.");
		if (!RazorpaySignatureVerifier.verifyPayment(attempt.getProviderOrderId(), request.razorpayPaymentId(),
				request.razorpaySignature(), apiClient.keySecret()))
			throw new IllegalStateException("Payment signature verification failed.");
		JsonNode payment = apiClient.fetchPayment(request.razorpayPaymentId());
		validateCapturedPayment(attempt, payment);
		markCaptured(attempt, request.razorpayPaymentId(), "razorpay-callback");
		return new RazorpayVerificationResponse(order.getOrderNumber(), order.getStatus().name(),
				order.getPaymentStatus(), request.razorpayPaymentId());
	}

	@Transactional
	public void cancel(UserPrincipal principal, String orderNumber, String providerOrderId) {
		CustomerOrder order = orderService.getOwnedOrder(principal, orderNumber);
		RazorpayPaymentAttempt attempt = attemptRepository.findByProviderOrderId(providerOrderId)
				.orElseThrow(() -> new NotFoundException("Payment attempt not found."));
		if (!attempt.getOrder().getId().equals(order.getId())) throw new IllegalStateException("Payment attempt mismatch.");
		attempt.cancelled();
		historyRepository.save(new OrderHistoryEntry(order, "PAYMENT_ATTEMPT", "CREATED", "CANCELLED",
				principal.getUsername(), "Customer closed checkout"));
	}

	@Transactional
	public void webhook(byte[] payload, String signature) {
		if (webhookSecret.isBlank()) throw new PaymentGatewayException("Razorpay webhook is not configured.");
		if (!RazorpaySignatureVerifier.verifyWebhook(payload, signature, webhookSecret))
			throw new IllegalStateException("Invalid Razorpay webhook signature.");
		try {
			JsonNode root = objectMapper.readTree(payload);
			String event = requiredText(root, "event");
			JsonNode payment = root.path("payload").path("payment").path("entity");
			String providerOrderId = payment.path("order_id").asText();
			if (providerOrderId.isBlank()) return;
			RazorpayPaymentAttempt attempt = attemptRepository.findByProviderOrderId(providerOrderId).orElse(null);
			if (attempt == null) return;
			String paymentId = payment.path("id").asText(null);
			if ("payment.captured".equals(event) || "order.paid".equals(event)) {
				validateCapturedPayment(attempt, payment);
				markCaptured(attempt, paymentId, "razorpay-webhook");
			}
			else if ("payment.failed".equals(event)) {
				markFailed(attempt, paymentId, payment.path("error_code").asText(null),
						payment.path("error_description").asText(null));
			}
		}
		catch (tools.jackson.core.JacksonException exception) {
			throw new IllegalStateException("Malformed Razorpay webhook payload.", exception);
		}
	}

	private void validateCapturedPayment(RazorpayPaymentAttempt attempt, JsonNode payment) {
		if (!attempt.getProviderOrderId().equals(payment.path("order_id").asText())
				|| attempt.getAmountPaise() != payment.path("amount").asLong(-1)
				|| !attempt.getCurrency().equals(payment.path("currency").asText().toUpperCase(Locale.ROOT))
				|| !"captured".equals(payment.path("status").asText()))
			throw new IllegalStateException("Captured payment details do not match the Nexora order.");
	}

	private void markCaptured(RazorpayPaymentAttempt attempt, String paymentId, String actor) {
		CustomerOrder order = attempt.getOrder();
		if (attempt.getStatus() == RazorpayPaymentStatus.CAPTURED) return;
		attempt.captured(paymentId);
		String previousPayment = order.getPaymentStatus();
		if (!PaymentStatus.PAID.name().equals(previousPayment)) order.transitionPaymentTo(PaymentStatus.PAID);
		if (order.getStatus() == OrderStatus.PLACED) order.transitionTo(OrderStatus.CONFIRMED);
		historyRepository.save(new OrderHistoryEntry(order, "PAYMENT_STATUS", previousPayment,
				order.getPaymentStatus(), actor, "Verified captured Razorpay payment " + paymentId));
	}

	private void markFailed(RazorpayPaymentAttempt attempt, String paymentId, String code, String description) {
		if (attempt.getStatus() == RazorpayPaymentStatus.CAPTURED) return;
		attempt.failed(paymentId, code, description);
		CustomerOrder order = attempt.getOrder();
		String previous = order.getPaymentStatus();
		if (PaymentStatus.PENDING.name().equals(previous)) order.transitionPaymentTo(PaymentStatus.FAILED);
		historyRepository.save(new OrderHistoryEntry(order, "PAYMENT_STATUS", previous,
				order.getPaymentStatus(), "razorpay-webhook", description));
	}

	private RazorpayCheckoutResponse response(CustomerOrder order, RazorpayPaymentAttempt attempt) {
		return new RazorpayCheckoutResponse(apiClient.keyId(), attempt.getProviderOrderId(), order.getOrderNumber(),
				attempt.getAmountPaise(), attempt.getCurrency(), order.getDeliveryFullName(),
				order.getDeliveryEmail(), order.getDeliveryPhone());
	}

	private String requiredText(JsonNode node, String field) {
		String value = node.path(field).asText();
		if (value.isBlank()) throw new PaymentGatewayException("Razorpay response is missing " + field + ".");
		return value;
	}
}
