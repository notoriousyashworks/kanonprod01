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
        CustomerReview review = CustomerReview.builder()
                .imageUrl(request.getImageUrl())
                .build();
        System.out.println("[STEP 5 - Service] Mapped CustomerReview entity imageUrl: " + review.getImageUrl());
        System.out.println("[STEP 6 - Entity] CustomerReview entity field imageUrl mapped to customer_reviews table column image_url. Value: " + review.getImageUrl());
        CustomerReview saved = reviewRepository.save(review);
        System.out.println("[STEP 7 - Repository] reviewRepository.save() completed for ID: " + saved.getId() + " with imageUrl: " + saved.getImageUrl());
        reviewRepository.flush();
        CustomerReview verifiedFromDb = reviewRepository.findById(saved.getId()).orElse(saved);
        System.out.println("[STEP 8 - PostgreSQL] Verified reading from DB right after save. customer_reviews table contains image_url: " + verifiedFromDb.getImageUrl());
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
