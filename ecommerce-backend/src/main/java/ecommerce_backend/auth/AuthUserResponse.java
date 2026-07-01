package ecommerce_backend.auth;

import java.time.Instant;

public record AuthUserResponse(
		Long id,
		String name,
		String email,
		String role,
		boolean emailVerified,
		Instant createdAt
) {
	public static AuthUserResponse from(AppUser user) {
		return new AuthUserResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getRole().name(),
				user.isEmailVerified(),
				user.getCreatedAt()
		);
	}
}
