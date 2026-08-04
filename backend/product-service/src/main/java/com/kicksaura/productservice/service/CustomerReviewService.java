package com.kicksaura.productservice.service;

import com.kicksaura.productservice.dto.CustomerReviewDto;
import com.kicksaura.productservice.entity.CustomerReview;
import com.kicksaura.productservice.repository.CustomerReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerReviewService {

    private final CustomerReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<CustomerReviewDto> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerReviewDto createReview(CustomerReviewDto request) {
        if (request.getImageUrl() == null || request.getImageUrl().isBlank()) {
            throw new IllegalArgumentException("Please upload a review image before saving.");
        }

        CustomerReview review = CustomerReview.builder()
                .imageUrl(request.getImageUrl().trim())
                .productId("homepage-review")
                .userId("admin-upload")
                .build();
        CustomerReview saved = reviewRepository.save(review);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteReview(String id) {
        if (reviewRepository.existsById(UUID.fromString(id))) {
            reviewRepository.deleteById(UUID.fromString(id));
        } else {
            throw new RuntimeException("Review not found");
        }
    }

    private CustomerReviewDto mapToDto(CustomerReview review) {
        return CustomerReviewDto.builder()
                .id(review.getId().toString())
                .imageUrl(review.getImageUrl())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
