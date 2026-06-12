package com.example.demo.cart;

import jakarta.persistence.*;

@Entity
@Table(name = "cart")

public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String productName;

    private double price;

    private int quantity;

    // GET ID
    public Long getId() {
        return id;
    }

    // SET ID
    public void setId(Long id) {
        this.id = id;
    }

    // GET PRODUCT NAME
    public String getProductName() {
        return productName;
    }

    // SET PRODUCT NAME
    public void setProductName(String productName) {
        this.productName = productName;
    }

    // GET PRICE
    public double getPrice() {
        return price;
    }

    // SET PRICE
    public void setPrice(double price) {
        this.price = price;
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