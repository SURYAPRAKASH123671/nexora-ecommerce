package ecommerce_backend.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
	boolean existsByEmailIgnoreCase(String email);

	Optional<AppUser> findByEmailIgnoreCase(String email);

	Optional<AppUser> findByEmailVerificationToken(String token);

	Optional<AppUser> findByPasswordResetToken(String token);
}
