package com.example.demo.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*")

public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // SAVE PAYMENT
    @PostMapping
    public Payment savePayment(
            @RequestBody Payment payment
    ) {

        return paymentService.savePayment(payment);
    }

    // GET ALL PAYMENTS
    @GetMapping
    public List<Payment> getAllPayments() {

        return paymentService.getAllPayments();
    }
}