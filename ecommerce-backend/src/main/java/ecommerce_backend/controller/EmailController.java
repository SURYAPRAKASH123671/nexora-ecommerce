package ecommerce_backend.controller;

import ecommerce_backend.dto.EmailRequest;
import ecommerce_backend.dto.EmailResponse;
import ecommerce_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<EmailResponse> sendEmail(
            @RequestBody EmailRequest request
    ) {

        log.info("Received email send request for recipient: {}", request.getToEmail());

        if (!StringUtils.hasText(request.getToEmail())) {

            log.warn("Email send rejected: missing toEmail");

            return ResponseEntity
                    .badRequest()
                    .body(new EmailResponse(
                            false,
                            "Recipient email (toEmail) is required"
                    ));
        }

        if (!StringUtils.hasText(request.getSubject())) {

            log.warn("Email send rejected: missing subject");

            return ResponseEntity
                    .badRequest()
                    .body(new EmailResponse(
                            false,
                            "Email subject is required"
                    ));
        }

        if (!StringUtils.hasText(request.getBody())) {

            log.warn("Email send rejected: missing body");

            return ResponseEntity
                    .badRequest()
                    .body(new EmailResponse(
                            false,
                            "Email body is required"
                    ));
        }

        try {

            emailService.sendEmail(
                    request.getToEmail(),
                    request.getSubject(),
                    request.getBody(),
                    request.isHtml()
            );

            return ResponseEntity.ok(
                    new EmailResponse(
                            true,
                            "Email sent successfully"
                    )
            );

        } catch (IllegalStateException exception) {

            log.error("Email configuration error: {}", exception.getMessage());

            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new EmailResponse(
                            false,
                            exception.getMessage()
                    ));

        } catch (Exception exception) {

            log.error("Email send failed: {}", exception.getMessage(), exception);

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new EmailResponse(
                            false,
                            "Failed to send email: " + exception.getMessage()
                    ));
        }
    }
}
