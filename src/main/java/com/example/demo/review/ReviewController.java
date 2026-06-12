package com.example.demo.review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")

public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // ADD REVIEW
    @PostMapping
    public Review addReview(
            @RequestBody Review review
    ) {

        return reviewService.addReview(review);
    }

    // GET ALL REVIEWS
    @GetMapping
    public List<Review> getAllReviews() {

        return reviewService.getAllReviews();
    }

    // GET REVIEWS BY PRODUCT
    @GetMapping("/{productName}")
    public List<Review> getReviewsByProduct(
            @PathVariable String productName
    ) {

        return reviewService
                .getReviewsByProduct(productName);
    }
}