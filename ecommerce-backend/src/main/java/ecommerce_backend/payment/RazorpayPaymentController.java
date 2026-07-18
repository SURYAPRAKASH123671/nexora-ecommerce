package ecommerce_backend.payment;

import ecommerce_backend.auth.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RazorpayPaymentController {
	private final RazorpayPaymentService service;

	public RazorpayPaymentController(RazorpayPaymentService service) { this.service = service; }

	@PostMapping("/orders/{orderNumber}/payments/razorpay/order")
	public RazorpayCheckoutResponse createOrder(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String orderNumber) {
		return service.createProviderOrder(principal, orderNumber);
	}

	@PostMapping("/orders/{orderNumber}/payments/razorpay/verify")
	public RazorpayVerificationResponse verify(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String orderNumber, @Valid @RequestBody VerifyRazorpayPaymentRequest request) {
		return service.verify(principal, orderNumber, request);
	}

	@PostMapping("/orders/{orderNumber}/payments/razorpay/cancel")
	public ResponseEntity<Void> cancel(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String orderNumber, @Valid @RequestBody CancelRequest request) {
		service.cancel(principal, orderNumber, request.razorpayOrderId());
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/payments/razorpay/webhook")
	public ResponseEntity<Void> webhook(@RequestBody byte[] payload,
			@RequestHeader("X-Razorpay-Signature") String signature) {
		service.webhook(payload, signature);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/admin/orders/{orderNumber}/payments/razorpay/refund")
	public RazorpayRefundResponse refund(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String orderNumber) {
		return service.refund(orderNumber, principal.getUsername());
	}

	public record CancelRequest(@NotBlank String razorpayOrderId) {}
}
