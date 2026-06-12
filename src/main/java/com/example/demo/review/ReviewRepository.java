package com.example.demo.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    // GET REVIEWS BY PRODUCT NAME
    List<Review> findByProductName(
            String productName
    );
}