package ecommerce_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendEmail(
            String toEmail,
            String subject,
            String body,
            boolean html
    ) {

        if (!StringUtils.hasText(fromEmail)) {
            throw new IllegalStateException(
                    "Mail is not configured. Set MAIL_USERNAME and MAIL_PASSWORD."
            );
        }

        log.info("Sending email to {} with subject '{}'", toEmail, subject);

        try {

            if (html) {
                sendHtmlEmail(toEmail, subject, body);
            } else {
                sendPlainTextEmail(toEmail, subject, body);
            }

            log.info("Email sent successfully to {}", toEmail);

        } catch (MessagingException exception) {

            log.error(
                    "Failed to send HTML email to {}: {}",
                    toEmail,
                    exception.getMessage(),
                    exception
            );

            throw new MailSendException(
                    "Failed to send HTML email",
                    exception
            );

        } catch (MailException exception) {

            log.error(
                    "Failed to send email to {}: {}",
                    toEmail,
                    exception.getMessage(),
                    exception
            );

            throw exception;
        }
    }

    private void sendPlainTextEmail(
            String toEmail,
            String subject,
            String body
    ) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    private void sendHtmlEmail(
            String toEmail,
            String subject,
            String body
    ) throws MessagingException {

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body, true);

        mailSender.send(mimeMessage);
    }
}
