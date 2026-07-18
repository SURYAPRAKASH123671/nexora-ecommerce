package ecommerce_backend.payment;

import ecommerce_backend.order.CustomerOrder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManualUpiPaymentRepository extends JpaRepository<ManualUpiPayment, Long> {
	Optional<ManualUpiPayment> findByOrder(CustomerOrder order);
	List<ManualUpiPayment> findAllByOrderBySubmittedAtDesc();
	List<ManualUpiPayment> findByReviewStatusOrderBySubmittedAtDesc(ManualUpiReviewStatus reviewStatus);
}
