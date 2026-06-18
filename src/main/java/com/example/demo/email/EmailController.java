package com.example.demo.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/email")
@CrossOrigin(origins = "*")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<EmailResponse> sendEmail(
            @RequestBody EmailRequest request
    ) {

        if (request.getToEmail() == null
                || request.getToEmail().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(new EmailResponse(
                            false,
                            "Recipient email (toEmail) is required"
                    ));
        }

        if (request.getSubject() == null
                || request.getSubject().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(new EmailResponse(
                            false,
                            "Email subject is required"
                    ));
        }

        if (request.getBody() == null
                || request.getBody().isBlank()) {

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
                    request.getBody()
            );

            return ResponseEntity.ok(
                    new EmailResponse(
                            true,
                            "Email sent successfully"
                    )
            );

        } catch (Exception exception) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new EmailResponse(
                            false,
                            "Failed to send email: "
                                    + exception.getMessage()
                    ));
        }
    }
}
