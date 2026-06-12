package com.example.demo.payment;

import jakarta.persistence.*;

@Entity
@Table(name = "payments")

public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String customerName;

    private String productName;

    private double amount;

    private String paymentMethod;

    private String paymentStatus;

    // GET ID
    public Long getId() {
        return id;
    }

    // SET ID
    public void setId(Long id) {
        this.id = id;
    }

    // GET CUSTOMER NAME
    public String getCustomerName() {
        return customerName;
    }

    // SET CUSTOMER NAME
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    // GET PRODUCT NAME
    public String getProductName() {
        return productName;
    }

    // SET PRODUCT NAME
    public void setProductName(String productName) {
        this.productName = productName;
    }

    // GET AMOUNT
    public double getAmount() {
        return amount;
    }

    // SET AMOUNT
    public void setAmount(double amount) {
        this.amount = amount;
    }

    // GET PAYMENT METHOD
    public String getPaymentMethod() {
        return paymentMethod;
    }

    // SET PAYMENT METHOD
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    // GET PAYMENT STATUS
    public String getPaymentStatus() {
        return paymentStatus;
    }

    // SET PAYMENT STATUS
    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
}