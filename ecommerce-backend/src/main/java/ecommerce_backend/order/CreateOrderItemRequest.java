package ecommerce_backend.order;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateOrderItemRequest(
		@NotNull Long productId,
		@Size(max = 180) String productName,
		@Size(max = 120) String brand,
		@Size(max = 120) String variant,
		@Size(max = 500) String imageUrl,
		@NotNull @Min(1) Integer quantity,
		@DecimalMin("0.01") BigDecimal unitPrice
) {
}
