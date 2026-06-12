package com.example.demo.payment;

import com.example.demo.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private EmailService emailService;

    // SAVE PAYMENT
    public Payment savePayment(Payment payment) {

        Payment savedPayment =
                paymentRepository.save(payment);

        // SEND EMAIL
        emailService.sendEmail(

                "suryakannan32123@gmail.com",

                "Payment Successful",

                "Your payment for "
                        + payment.getProductName()
                        + " was successful 😈🔥"
        );

        return savedPayment;
    }

    // GET ALL PAYMENTS
    public List<Payment> getAllPayments() {

        return paymentRepository.findAll();
    }
}