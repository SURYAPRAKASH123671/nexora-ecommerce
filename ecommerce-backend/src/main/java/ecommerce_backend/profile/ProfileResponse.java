package ecommerce_backend.profile;

import ecommerce_backend.auth.AppUser;
import java.time.Instant;
import java.util.List;

public record ProfileResponse(
		Long id,
		String name,
		String email,
		String phone,
		String profilePictureUrl,
		String role,
		boolean emailVerified,
		Instant createdAt,
		List<AddressResponse> addresses
) {
	public static ProfileResponse from(AppUser user, List<SavedAddress> addresses) {
		return new ProfileResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getPhone(),
				user.getProfilePictureUrl(),
				user.getRole().name(),
				user.isEmailVerified(),
				user.getCreatedAt(),
				addresses.stream().map(AddressResponse::from).toList()
		);
	}
}
