package ecommerce_backend.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
		@NotBlank(message = "Category name is required")
		@Size(max = 120, message = "Category name must be 120 characters or fewer")
		String name,

		@Size(max = 500, message = "Description must be 500 characters or fewer")
		String description
) {
}
