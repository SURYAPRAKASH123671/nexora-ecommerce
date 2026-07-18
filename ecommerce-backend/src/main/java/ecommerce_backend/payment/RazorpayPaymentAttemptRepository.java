package ecommerce_backend.payment;

import ecommerce_backend.order.CustomerOrder;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RazorpayPaymentAttemptRepository extends JpaRepository<RazorpayPaymentAttempt, Long> {
	Optional<RazorpayPaymentAttempt> findByProviderOrderId(String providerOrderId);
	Optional<RazorpayPaymentAttempt> findByProviderPaymentId(String providerPaymentId);
	Optional<RazorpayPaymentAttempt> findByProviderRefundId(String providerRefundId);
	Optional<RazorpayPaymentAttempt> findTopByOrderOrderByCreatedAtDesc(CustomerOrder order);
}
