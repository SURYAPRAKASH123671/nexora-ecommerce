package ecommerce_backend.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
		@NotBlank(message = "Current password is required")
		String currentPassword,

		@NotBlank(message = "New password is required")
		@Size(min = 8, max = 72, message = "New password must be between 8 and 72 characters")
		@Pattern(
				regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
				message = "New password must include at least one letter and one number"
		)
		String newPassword
) {
}
