package ecommerce_backend.profile;

import ecommerce_backend.auth.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedAddressRepository extends JpaRepository<SavedAddress, Long> {
	List<SavedAddress> findByUserOrderByDefaultAddressDescCreatedAtDesc(AppUser user);

	Optional<SavedAddress> findByIdAndUser(Long id, AppUser user);
}
