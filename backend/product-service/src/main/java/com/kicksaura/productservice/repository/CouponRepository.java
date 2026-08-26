package com.kicksaura.productservice.repository;

import com.kicksaura.productservice.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
    
    java.util.List<Coupon> findByIsActiveTrueAndShowOnCheckoutTrue();

    @Modifying
    @Query(value = "UPDATE coupons SET discount_type = 'PERCENTAGE' WHERE discount_type IS NULL", nativeQuery = true)
    void backfillNullDiscountTypes();

    @Modifying
    @Query(value = "UPDATE coupons SET discount_amount = 0 WHERE discount_amount IS NULL", nativeQuery = true)
    void backfillNullDiscountAmounts();
}
