package ecommerce_backend.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequest(
		@NotBlank(message = "Label is required")
		@Size(max = 80, message = "Label must be 80 characters or fewer")
		String label,

		@NotBlank(message = "Full name is required")
		@Size(max = 120, message = "Full name must be 120 characters or fewer")
		String fullName,

		@NotBlank(message = "Phone is required")
		@Size(max = 20, message = "Phone must be 20 characters or fewer")
		String phone,

		@NotBlank(message = "Address line 1 is required")
		@Size(max = 220, message = "Address line 1 must be 220 characters or fewer")
		String line1,

		@Size(max = 220, message = "Address line 2 must be 220 characters or fewer")
		String line2,

		@NotBlank(message = "City is required")
		@Size(max = 90, message = "City must be 90 characters or fewer")
		String city,

		@NotBlank(message = "State is required")
		@Size(max = 90, message = "State must be 90 characters or fewer")
		String state,

		@NotBlank(message = "Pincode is required")
		@Pattern(regexp = "^[0-9]{5,6}$", message = "Pincode must be 5 or 6 digits")
		String pincode,

		boolean defaultAddress
) {
}
