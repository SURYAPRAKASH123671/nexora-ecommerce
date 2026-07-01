package ecommerce_backend.email;

import java.time.Instant;

public record EmailResponse(
		String status,
		String to,
		String subject,
		Instant sentAt
) {

	public static EmailResponse sent(EmailRequest request) {
		return new EmailResponse("SENT", request.to(), request.subject(), Instant.now());
	}

	public static EmailResponse skipped(EmailRequest request) {
		return new EmailResponse("SKIPPED", request.to(), request.subject(), Instant.now());
	}
}
