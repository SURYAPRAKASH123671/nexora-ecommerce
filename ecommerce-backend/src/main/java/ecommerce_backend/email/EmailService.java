package ecommerce_backend.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

	private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);

	private final ObjectProvider<JavaMailSender> mailSenderProvider;
	private final OrderConfirmationEmailBuilder orderConfirmationEmailBuilder;
	private final boolean enabled;
	private final String fromAddress;

	public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider,
			OrderConfirmationEmailBuilder orderConfirmationEmailBuilder,
			@Value("${app.mail.enabled:false}") boolean enabled,
			@Value("${app.mail.from:no-reply@nexora.local}") String fromAddress) {
		this.mailSenderProvider = mailSenderProvider;
		this.orderConfirmationEmailBuilder = orderConfirmationEmailBuilder;
		this.enabled = enabled;
		this.fromAddress = fromAddress;
	}

	public EmailResponse sendOrderConfirmation(OrderConfirmationRequest order) {
		String subject = "Order confirmed: " + order.orderId() + " | Nexora";
		return send(new EmailRequest(order.to(), subject, orderConfirmationEmailBuilder.build(order), true));
	}

	public EmailResponse send(EmailRequest request) {
		if (!enabled) {
			LOGGER.info("Email service disabled; skipped '{}' email to {}.", request.subject(), request.to());
			return EmailResponse.skipped(request);
		}

		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		if (mailSender == null) {
			throw new EmailDeliveryException("SMTP is not configured. Set MAIL_HOST, MAIL_USERNAME, and MAIL_PASSWORD.");
		}

		try {
			if (request.html()) {
				sendHtml(mailSender, request);
			}
			else {
				sendPlainText(mailSender, request);
			}
			return EmailResponse.sent(request);
		}
		catch (MailException | MessagingException exception) {
			LOGGER.error("SMTP delivery failed for recipient {}: {}", request.to(), exception.getMessage(), exception);
			return EmailResponse.skipped(request);
		}
	}

	private void sendPlainText(JavaMailSender mailSender, EmailRequest request) {
		SimpleMailMessage mailMessage = new SimpleMailMessage();
		mailMessage.setFrom(fromAddress);
		mailMessage.setTo(request.to().trim());
		mailMessage.setSubject(request.subject().trim());
		mailMessage.setText(request.message());

		mailSender.send(mailMessage);
	}

	private void sendHtml(JavaMailSender mailSender, EmailRequest request) throws MessagingException {
		MimeMessage mimeMessage = mailSender.createMimeMessage();
		MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
		helper.setFrom(fromAddress);
		helper.setTo(request.to().trim());
		helper.setSubject(request.subject().trim());
		helper.setText(request.message(), true);

		mailSender.send(mimeMessage);
	}
}
