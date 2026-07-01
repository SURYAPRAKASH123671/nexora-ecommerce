package ecommerce_backend.email;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
public class EmailController {

	private final EmailService emailService;

	public EmailController(EmailService emailService) {
		this.emailService = emailService;
	}

	@PostMapping("/send")
	public ResponseEntity<EmailResponse> sendEmail(@Valid @RequestBody EmailRequest request) {
		EmailResponse response = emailService.send(request);
		return ResponseEntity.accepted().body(response);
	}

	@PostMapping("/order-confirmation")
	public ResponseEntity<EmailResponse> sendOrderConfirmation(
			@Valid @RequestBody OrderConfirmationRequest request) {
		EmailResponse response = emailService.sendOrderConfirmation(request);
		return ResponseEntity.accepted().body(response);
	}
}
