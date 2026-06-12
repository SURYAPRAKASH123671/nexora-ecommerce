package com.example.demo.product;

import jakarta.persistence.*;

@Entity
@Table(name = "products")

public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String name;

    private double price;

    private int stock;

    private String category;

    // GET ID
    public Long getId() {
        return id;
    }

    // SET ID
    public void setId(Long id) {
        this.id = id;
    }

    // GET NAME
    public String getName() {
        return name;
    }

    // SET NAME
    public void setName(String name) {
        this.name = name;
    }

    // GET PRICE
    public double getPrice() {
        return price;
    }

    // SET PRICE
    public void setPrice(double price) {
        this.price = price;
    }

    // GET STOCK
    public int getStock() {
        return stock;
    }

    // SET STOCK
    public void setStock(int stock) {
        this.stock = stock;
    }

    // GET CATEGORY
    public String getCategory() {
        return category;
    }

    // SET CATEGORY
    public void setCategory(String category) {
        this.category = category;
    }
}