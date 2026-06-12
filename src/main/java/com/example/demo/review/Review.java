package com.example.demo.review;

import jakarta.persistence.*;

@Entity
@Table(name = "reviews")

public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String productName;

    private String customerName;

    private int rating;

    private String comment;

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

    // GET CUSTOMER NAME
    public String getCustomerName() {
        return customerName;
    }

    // SET CUSTOMER NAME
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    // GET RATING
    public int getRating() {
        return rating;
    }

    // SET RATING
    public void setRating(int rating) {
        this.rating = rating;
    }

    // GET COMMENT
    public String getComment() {
        return comment;
    }

    // SET COMMENT
    public void setComment(String comment) {
        this.comment = comment;
    }
}