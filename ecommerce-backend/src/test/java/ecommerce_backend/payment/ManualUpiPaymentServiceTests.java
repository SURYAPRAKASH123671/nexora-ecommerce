package ecommerce_backend.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import ecommerce_backend.auth.AppUser;
import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.order.CustomerOrder;
import ecommerce_backend.order.CustomerOrderRepository;
import ecommerce_backend.order.OrderAddress;
import ecommerce_backend.order.OrderHistoryRepository;
import ecommerce_backend.order.OrderService;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import java.util.Optional;

class ManualUpiPaymentServiceTests {
	@Test
	void generatesEncodedUpiIntentWithAuthoritativeOrderAmount() {
		ManualUpiPaymentRepository payments = mock(ManualUpiPaymentRepository.class);
		CustomerOrderRepository orders = mock(CustomerOrderRepository.class);
		OrderHistoryRepository history = mock(OrderHistoryRepository.class);
		OrderService orderService = mock(OrderService.class);
		PaymentProofStorage storage = mock(PaymentProofStorage.class);
		ManualUpiPaymentService service = new ManualUpiPaymentService(payments, orders, history, orderService,
				storage, "suryakannan32123@oksbi", "Surya Prakash K S");
		AppUser user = new AppUser("Customer", "customer@example.com", "hash");
		UserPrincipal principal = new UserPrincipal(user);
		CustomerOrder order = upiOrder(user);
		when(orderService.getOwnedOrder(principal, "NX-TEST123")).thenReturn(order);

		UpiPaymentInstructions instructions = service.instructions(principal, "NX-TEST123");

		assertThat(instructions.amount()).isEqualByComparingTo("1180.00");
		assertThat(instructions.paymentUri()).isEqualTo(
				"upi://pay?pa=suryakannan32123%40oksbi&pn=Surya%20Prakash%20K%20S&cu=INR&am=1180.00&tn=Nexora%20Order%20%23NX-TEST123");
	}

	@Test
	void proofSubmissionStaysPendingUntilAnAdminApprovesIt() {
		ManualUpiPaymentRepository payments = mock(ManualUpiPaymentRepository.class);
		CustomerOrderRepository orders = mock(CustomerOrderRepository.class);
		OrderHistoryRepository history = mock(OrderHistoryRepository.class);
		OrderService orderService = mock(OrderService.class);
		PaymentProofStorage storage = mock(PaymentProofStorage.class);
		ManualUpiPaymentService service = new ManualUpiPaymentService(payments, orders, history, orderService,
				storage, "suryakannan32123@oksbi", "Surya Prakash K S");
		AppUser customer = new AppUser("Customer", "customer@example.com", "hash");
		UserPrincipal customerPrincipal = new UserPrincipal(customer);
		CustomerOrder order = upiOrder(customer);
		when(orderService.getOwnedOrder(customerPrincipal, "NX-TEST123")).thenReturn(order);
		when(storage.store(any())).thenReturn(new StoredPaymentProof("proof.png", "proof.png",
				"image/png", 100, "a".repeat(64)));
		when(payments.findByOrder(order)).thenReturn(Optional.empty());
		when(payments.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		ManualUpiPaymentResponse submitted = service.submit(customerPrincipal, "NX-TEST123",
				new MockMultipartFile("screenshot", "proof.png", "image/png", new byte[] {1}), "123456789012");

		assertThat(submitted.reviewStatus()).isEqualTo("PENDING_VERIFICATION");
		assertThat(order.getPaymentStatus()).isEqualTo("PENDING_VERIFICATION");
		assertThat(order.getStatus().name()).isEqualTo("PAYMENT_VERIFICATION_PENDING");

		ManualUpiPayment payment = new ManualUpiPayment(order, "suryakannan32123@oksbi",
				new StoredPaymentProof("proof.png", "proof.png", "image/png", 100, "a".repeat(64)),
				"123456789012");
		when(payments.findById(1L)).thenReturn(Optional.of(payment));
		AppUser admin = new AppUser("Admin", "admin@example.com", "hash");
		admin.promoteToAdmin();

		service.review(1L, new ReviewManualPaymentRequest(ManualPaymentDecision.APPROVE,
				"Amount and recipient verified"), new UserPrincipal(admin));

		assertThat(order.getPaymentStatus()).isEqualTo("VERIFIED");
		assertThat(order.getStatus().name()).isEqualTo("CONFIRMED");
	}

	private CustomerOrder upiOrder(AppUser user) {
		return new CustomerOrder("NX-TEST123", user, "UPI", "PENDING",
				new OrderAddress("Customer", "customer@example.com", "9876543210", "Road", null,
						"Chennai", "Tamil Nadu", "600001"),
				new BigDecimal("1000.00"), new BigDecimal("180.00"), BigDecimal.ZERO,
				new BigDecimal("1180.00"));
	}
}
