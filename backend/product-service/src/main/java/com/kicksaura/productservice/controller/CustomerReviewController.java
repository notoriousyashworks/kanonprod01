package com.kicksaura.productservice.controller;

import com.kicksaura.productservice.dto.CustomerReviewDto;
import com.kicksaura.productservice.service.CustomerReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class CustomerReviewController {

    private final CustomerReviewService reviewService;

    // Public endpoint to get all reviews
    @GetMapping
    public ResponseEntity<List<CustomerReviewDto>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    // Admin endpoint to create a review (we'll just use the same base path for simplicity)
    @PostMapping
    public ResponseEntity<CustomerReviewDto> createReview(@RequestBody CustomerReviewDto request) {
        System.out.println("[STEP 3 - Controller] CustomerReviewController received createReview request.");
        System.out.println("[STEP 4 - DTO] CustomerReviewDto imageUrl: " + request.getImageUrl());
        return new ResponseEntity<>(reviewService.createReview(request), HttpStatus.CREATED);
    }

    // Admin endpoint to delete a review
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable String id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
