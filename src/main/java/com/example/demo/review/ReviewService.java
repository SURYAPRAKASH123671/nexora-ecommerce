package com.example.demo.review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    // ADD REVIEW
    public Review addReview(
            Review review
    ) {

        return reviewRepository.save(review);
    }

    // GET ALL REVIEWS
    public List<Review> getAllReviews() {

        return reviewRepository.findAll();
    }

    // GET REVIEWS BY PRODUCT NAME
    public List<Review> getReviewsByProduct(
            String productName
    ) {

        return reviewRepository
                .findByProductName(productName);
    }
}