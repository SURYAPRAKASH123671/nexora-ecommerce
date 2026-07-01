package ecommerce_backend.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
		@NotBlank(message = "Product name is required")
		@Size(max = 160, message = "Product name must be 160 characters or fewer")
		String name,

		@Size(max = 1000, message = "Description must be 1000 characters or fewer")
		String description,

		@NotNull(message = "Price is required")
		@DecimalMin(value = "0.01", message = "Price must be greater than 0")
		BigDecimal price,

		@NotNull(message = "Stock quantity is required")
		@Min(value = 0, message = "Stock quantity cannot be negative")
		Integer stockQuantity,

		@Size(max = 500, message = "Image URL must be 500 characters or fewer")
		String imageUrl,

		@NotNull(message = "Category ID is required")
		Long categoryId
) {
}
