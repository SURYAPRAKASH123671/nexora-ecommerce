package ecommerce_backend.order;

import ecommerce_backend.auth.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
	List<CustomerOrder> findByUserOrderByPlacedAtDesc(AppUser user);

	List<CustomerOrder> findAllByOrderByPlacedAtDesc();

	Optional<CustomerOrder> findByOrderNumberAndUser(String orderNumber, AppUser user);
}
