package com.example.demo.order;

import jakarta.persistence.*;

@Entity
@Table(name = "orders")

public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String customerName;

    private String productName;

    private double totalPrice;

    private int quantity;

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

    // GET TOTAL PRICE
    public double getTotalPrice() {
        return totalPrice;
    }

    // SET TOTAL PRICE
    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    // GET QUANTITY
    public int getQuantity() {
        return quantity;
    }

    // SET QUANTITY
    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}