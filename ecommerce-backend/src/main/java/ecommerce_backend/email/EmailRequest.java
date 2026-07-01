package ecommerce_backend.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailRequest(
		@NotBlank(message = "Recipient email is required")
		@Email(message = "Recipient email must be valid")
		String to,

		@NotBlank(message = "Subject is required")
		@Size(max = 160, message = "Subject must be 160 characters or fewer")
		String subject,

		@NotBlank(message = "Message is required")
		@Size(max = 10000, message = "Message must be 10000 characters or fewer")
		String message,

		boolean html
) {
}
