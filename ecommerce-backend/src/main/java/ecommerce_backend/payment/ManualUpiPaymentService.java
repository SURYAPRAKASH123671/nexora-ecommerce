package ecommerce_backend.payment;

import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.common.NotFoundException;
import ecommerce_backend.order.CustomerOrder;
import ecommerce_backend.order.CustomerOrderRepository;
import ecommerce_backend.order.OrderHistoryEntry;
import ecommerce_backend.order.OrderHistoryRepository;
import ecommerce_backend.order.OrderHistoryResponse;
import ecommerce_backend.order.OrderService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ManualUpiPaymentService {
	private final ManualUpiPaymentRepository paymentRepository;
	private final CustomerOrderRepository orderRepository;
	private final OrderHistoryRepository historyRepository;
	private final OrderService orderService;
	private final PaymentProofStorage proofStorage;
	private final String merchantUpiId;
	private final String merchantName;

	public ManualUpiPaymentService(ManualUpiPaymentRepository paymentRepository,
			CustomerOrderRepository orderRepository, OrderHistoryRepository historyRepository,
			OrderService orderService, PaymentProofStorage proofStorage,
			@Value("${app.upi.merchant-id:suryakannan32123@oksbi}") String merchantUpiId,
			@Value("${app.upi.merchant-name:Surya Prakash K S}") String merchantName) {
		this.paymentRepository = paymentRepository;
		this.orderRepository = orderRepository;
		this.historyRepository = historyRepository;
		this.orderService = orderService;
		this.proofStorage = proofStorage;
		this.merchantUpiId = merchantUpiId;
		this.merchantName = merchantName;
	}

	@Transactional(readOnly = true)
	public UpiPaymentInstructions instructions(UserPrincipal principal, String orderNumber) {
		CustomerOrder order = orderService.getOwnedOrder(principal, orderNumber);
		if (!"UPI".equals(order.getPaymentMethod())) {
			throw new IllegalStateException("UPI instructions are only available for UPI orders.");
		}
		return new UpiPaymentInstructions(orderNumber, order.getTotal(), merchantName, merchantUpiId,
				paymentUri(order), order.getPaymentStatus(), order.getStatus().name());
	}

	@Transactional
	public ManualUpiPaymentResponse submit(UserPrincipal principal, String orderNumber, MultipartFile screenshot,
			String payerReference) {
		CustomerOrder order = orderService.getOwnedOrder(principal, orderNumber);
		StoredPaymentProof proof = proofStorage.store(screenshot);
		ManualUpiPayment payment = paymentRepository.findByOrder(order)
				.map(existing -> {
					existing.resubmit(proof, payerReference);
					return existing;
				})
				.orElseGet(() -> new ManualUpiPayment(order, merchantUpiId, proof, payerReference));
		String previousPayment = order.getPaymentStatus();
		String previousOrder = order.getStatus().name();
		order.submitManualPaymentForVerification();
		ManualUpiPayment saved = paymentRepository.save(payment);
		historyRepository.save(new OrderHistoryEntry(order, "PAYMENT_STATUS", previousPayment,
				order.getPaymentStatus(), principal.getUsername(), "Manual UPI proof uploaded"));
		historyRepository.save(new OrderHistoryEntry(order, "ORDER_STATUS", previousOrder,
				order.getStatus().name(), principal.getUsername(), "Awaiting manual payment verification"));
		return ManualUpiPaymentResponse.from(saved);
	}

	@Transactional(readOnly = true)
	public List<ManualUpiPaymentResponse> all(ManualUpiReviewStatus status) {
		List<ManualUpiPayment> payments = status == null ? paymentRepository.findAllByOrderBySubmittedAtDesc()
				: paymentRepository.findByReviewStatusOrderBySubmittedAtDesc(status);
		return payments.stream().map(ManualUpiPaymentResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public PaymentProofContent proof(Long paymentId) {
		return proofStorage.read(getPayment(paymentId));
	}

	@Transactional
	public ManualUpiPaymentResponse review(Long paymentId, ReviewManualPaymentRequest request,
			UserPrincipal reviewer) {
		ManualUpiPayment payment = getPayment(paymentId);
		CustomerOrder order = payment.getOrder();
		String previousPayment = order.getPaymentStatus();
		String previousOrder = order.getStatus().name();
		if (request.decision() == ManualPaymentDecision.APPROVE) {
			payment.verify(reviewer.getUsername(), request.note());
			order.verifyManualPayment();
			orderService.sendVerifiedOrderConfirmation(order);
		}
		else {
			payment.reject(reviewer.getUsername(), request.note());
			order.rejectManualPayment();
		}
		historyRepository.save(new OrderHistoryEntry(order, "PAYMENT_STATUS", previousPayment,
				order.getPaymentStatus(), reviewer.getUsername(), request.note()));
		historyRepository.save(new OrderHistoryEntry(order, "ORDER_STATUS", previousOrder,
				order.getStatus().name(), reviewer.getUsername(), request.note()));
		return ManualUpiPaymentResponse.from(payment);
	}

	@Transactional(readOnly = true)
	public List<OrderHistoryResponse> history(String orderNumber) {
		CustomerOrder order = orderRepository.findByOrderNumber(orderNumber)
				.orElseThrow(() -> new NotFoundException("Order not found: " + orderNumber));
		return historyRepository.findByOrderOrderByCreatedAtAsc(order).stream()
				.map(OrderHistoryResponse::from).toList();
	}

	private ManualUpiPayment getPayment(Long paymentId) {
		return paymentRepository.findById(paymentId)
				.orElseThrow(() -> new NotFoundException("Manual UPI payment not found: " + paymentId));
	}

	private String paymentUri(CustomerOrder order) {
		return "upi://pay?pa=" + encode(merchantUpiId)
				+ "&pn=" + encode(merchantName)
				+ "&cu=INR&am=" + encode(order.getTotal().toPlainString())
				+ "&tn=" + encode("Nexora Order #" + order.getOrderNumber());
	}

	private String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
	}
}
