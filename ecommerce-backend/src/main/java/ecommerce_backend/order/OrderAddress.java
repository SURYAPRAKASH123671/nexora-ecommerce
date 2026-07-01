package ecommerce_backend.order;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OrderAddress(
		@NotBlank @Size(max = 120) String fullName,
		@NotBlank @Email @Size(max = 180) String email,
		@NotBlank @Size(max = 20) String phone,
		@NotBlank @Size(max = 220) String line1,
		@Size(max = 220) String line2,
		@NotBlank @Size(max = 90) String city,
		@NotBlank @Size(max = 90) String state,
		@NotBlank @Pattern(regexp = "^[0-9]{5,6}$") String pincode
) {
}
