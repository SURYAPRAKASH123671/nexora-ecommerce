package ecommerce_backend.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
		@NotBlank @Size(max = 80)
		@Pattern(regexp = "(?i)COD|CARD|UPI|RAZORPAY", message = "paymentMethod must be COD, CARD, UPI, or RAZORPAY")
		String paymentMethod,
		@Size(max = 80) String paymentStatus,
		@NotNull @Valid OrderAddress deliveryAddress,
		@NotEmpty @Valid List<CreateOrderItemRequest> items,
		@DecimalMin("0.00") BigDecimal subtotal,
		@DecimalMin("0.00") BigDecimal gst,
		@DecimalMin("0.00") BigDecimal shipping,
		@DecimalMin("0.00") BigDecimal total
) {
}
