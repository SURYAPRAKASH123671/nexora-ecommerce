package ecommerce_backend.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderHistoryRepository extends JpaRepository<OrderHistoryEntry, Long> {
	List<OrderHistoryEntry> findByOrderOrderByCreatedAtAsc(CustomerOrder order);
}
