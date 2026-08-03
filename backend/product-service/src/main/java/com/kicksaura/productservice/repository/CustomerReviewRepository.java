package com.kicksaura.productservice.repository;

import com.kicksaura.productservice.entity.CustomerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface CustomerReviewRepository extends JpaRepository<CustomerReview, UUID> {
    List<CustomerReview> findAllByOrderByCreatedAtDesc();
}
