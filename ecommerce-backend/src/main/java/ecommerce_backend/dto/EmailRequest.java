package ecommerce_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class EmailRequest {

    @JsonAlias("to")
    private String toEmail;

    private String subject;

    @JsonAlias("message")
    private String body;

    private boolean html;
}
