package ecommerce_backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
		@NotBlank(message = "Reset token is required")
		String token,

		@NotBlank(message = "Password is required")
		@Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
		@Pattern(
				regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
				message = "Password must include at least one letter and one number"
		)
		String password
) {
}
