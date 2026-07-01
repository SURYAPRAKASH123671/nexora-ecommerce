package ecommerce_backend.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
		@NotBlank(message = "Name is required")
		@Size(max = 120, message = "Name must be 120 characters or fewer")
		String name,

		@Size(max = 20, message = "Phone must be 20 characters or fewer")
		String phone,

		@Size(max = 500, message = "Profile picture URL must be 500 characters or fewer")
		@Pattern(regexp = "^$|https?://.+", message = "Profile picture must be a valid URL")
		String profilePictureUrl
) {
}
