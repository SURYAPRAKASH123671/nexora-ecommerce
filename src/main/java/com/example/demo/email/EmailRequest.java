package com.example.demo.email;

import lombok.Data;

@Data
public class EmailRequest {

    private String toEmail;

    private String subject;

    private String body;
}
