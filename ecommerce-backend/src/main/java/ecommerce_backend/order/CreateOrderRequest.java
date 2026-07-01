package ecommerce_backend.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
		@NotBlank @Size(max = 80) String paymentMethod,
		@NotBlank @Size(max = 80) String paymentStatus,
		@NotNull @Valid OrderAddress deliveryAddress,
		@NotEmpty @Valid List<CreateOrderItemRequest> items,
		@NotNull @DecimalMin("0.00") BigDecimal subtotal,
		@NotNull @DecimalMin("0.00") BigDecimal gst,
		@NotNull @DecimalMin("0.00") BigDecimal shipping,
		@NotNull @DecimalMin("0.00") BigDecimal total
) {
}
