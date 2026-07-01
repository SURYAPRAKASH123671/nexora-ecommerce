package ecommerce_backend.email;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record OrderConfirmationRequest(
		@NotBlank @Email String to,
		@NotBlank @Size(max = 100) String customerName,
		@NotBlank @Size(max = 40) String orderId,
		@NotBlank @Size(max = 80) String placedAt,
		@NotBlank @Size(max = 80) String paymentMethod,
		@NotBlank @Size(max = 80) String paymentStatus,
		@NotEmpty @Size(max = 50) List<@Valid Item> items,
		@NotNull @Valid Address deliveryAddress,
		@NotNull @DecimalMin("0.00") BigDecimal subtotal,
		@NotNull @DecimalMin("0.00") BigDecimal gst,
		@NotNull @DecimalMin("0.00") BigDecimal shipping,
		@NotNull @DecimalMin("0.00") BigDecimal total
) {

	public record Item(
			@NotBlank @Size(max = 160) String name,
			@Size(max = 80) String variant,
			@Size(max = 500) String imageUrl,
			@Min(1) int quantity,
			@NotNull @DecimalMin("0.00") BigDecimal unitPrice
	) {
	}

	public record Address(
			@NotBlank @Size(max = 100) String fullName,
			@NotBlank @Size(max = 20) String phone,
			@NotBlank @Size(max = 180) String line1,
			@Size(max = 180) String line2,
			@NotBlank @Size(max = 80) String city,
			@NotBlank @Size(max = 80) String state,
			@NotBlank @Size(max = 12) String pincode
	) {
	}
}
