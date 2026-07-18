package ecommerce_backend.admin;

import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.order.OrderHistoryResponse;
import ecommerce_backend.payment.ManualUpiPaymentResponse;
import ecommerce_backend.payment.ManualUpiPaymentService;
import ecommerce_backend.payment.ManualUpiReviewStatus;
import ecommerce_backend.payment.PaymentProofContent;
import ecommerce_backend.payment.ReviewManualPaymentRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/payments/upi")
public class AdminManualUpiPaymentController {
	private final ManualUpiPaymentService paymentService;

	public AdminManualUpiPaymentController(ManualUpiPaymentService paymentService) {
		this.paymentService = paymentService;
	}

	@GetMapping
	public List<ManualUpiPaymentResponse> payments(
			@RequestParam(value = "status", required = false) ManualUpiReviewStatus status) {
		return paymentService.all(status);
	}

	@GetMapping("/{paymentId}/proof")
	public ResponseEntity<ByteArrayResource> proof(@PathVariable Long paymentId) {
		PaymentProofContent proof = paymentService.proof(paymentId);
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(proof.contentType()))
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
						.filename(proof.originalName()).build().toString())
				.contentLength(proof.bytes().length)
				.header("X-Content-Type-Options", "nosniff")
				.body(new ByteArrayResource(proof.bytes()));
	}

	@PatchMapping("/{paymentId}/review")
	public ManualUpiPaymentResponse review(@PathVariable Long paymentId,
			@Valid @RequestBody ReviewManualPaymentRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return paymentService.review(paymentId, request, principal);
	}

	@GetMapping("/orders/{orderNumber}/history")
	public List<OrderHistoryResponse> history(@PathVariable String orderNumber) {
		return paymentService.history(orderNumber);
	}
}
