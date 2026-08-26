package com.kicksaura.productservice.service;

import com.kicksaura.productservice.dto.CouponDTO;
import com.kicksaura.productservice.dto.CouponValidateResponse;
import com.kicksaura.productservice.entity.Coupon;
import com.kicksaura.productservice.exception.ResourceNotFoundException;
import com.kicksaura.productservice.repository.CouponRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    /** Backfill existing coupons that were created before discount_type/discount_amount columns existed. */
    @PostConstruct
    @Transactional
    public void backfillLegacyCoupons() {
        try {
            couponRepository.backfillNullDiscountTypes();
            couponRepository.backfillNullDiscountAmounts();
        } catch (Exception e) {
            // Columns may not exist yet on very first startup — ignore
        }
    }

    @Transactional(readOnly = true)
    public List<CouponDTO> getAllCoupons() {
        return couponRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CouponDTO createCoupon(CouponDTO request) {
        if (couponRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new IllegalArgumentException("Coupon with code '" + request.getCode() + "' already exists");
        }
        Coupon.DiscountType discountType = request.getDiscountType() != null
                ? request.getDiscountType()
                : Coupon.DiscountType.PERCENTAGE;

        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .discountType(discountType)
                .discountPercent(request.getDiscountPercent() != null ? request.getDiscountPercent() : 0.0)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : 0.0)
                .minOrderValue(request.getMinOrderValue())
                .expiryDate(request.getExpiryDate())
                .isActive(request.isActive())
                .build();
        return mapToDTO(couponRepository.save(coupon));
    }

    @Transactional
    public CouponDTO updateCoupon(String id, CouponDTO request) {
        Coupon coupon = couponRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        coupon.setCode(request.getCode().toUpperCase());
        if (request.getDiscountType() != null) {
            coupon.setDiscountType(request.getDiscountType());
        }
        coupon.setDiscountPercent(request.getDiscountPercent() != null ? request.getDiscountPercent() : 0.0);
        coupon.setDiscountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : 0.0);
        coupon.setMinOrderValue(request.getMinOrderValue());
        coupon.setExpiryDate(request.getExpiryDate());
        coupon.setActive(request.isActive());
        return mapToDTO(couponRepository.save(coupon));
    }

    @Transactional
    public void deleteCoupon(String id) {
        if (!couponRepository.existsById(UUID.fromString(id))) {
            throw new ResourceNotFoundException("Coupon not found with id: " + id);
        }
        couponRepository.deleteById(UUID.fromString(id));
    }

    // ── Public validate (called from checkout, no auth required) ────────────────
    @Transactional(readOnly = true)
    public CouponValidateResponse validateCoupon(String code) {
        String upperCode = code.trim().toUpperCase();
        return couponRepository.findByCodeIgnoreCase(upperCode)
                .map(c -> {
                    if (!c.isActive()) {
                        return CouponValidateResponse.builder()
                                .valid(false).message("Coupon is not active").build();
                    }
                    if (c.getExpiryDate() != null && c.getExpiryDate().isBefore(LocalDate.now())) {
                        return CouponValidateResponse.builder()
                                .valid(false).message("Coupon has expired").build();
                    }
                    // Default to PERCENTAGE if column was null (existing rows before migration)
                    Coupon.DiscountType type = c.getDiscountType() != null
                            ? c.getDiscountType()
                            : Coupon.DiscountType.PERCENTAGE;
                    return CouponValidateResponse.builder()
                            .valid(true)
                            .code(c.getCode())
                            .discountType(type)
                            .discountPercent(c.getDiscountPercent() != null ? c.getDiscountPercent() : 0.0)
                            .discountAmount(c.getDiscountAmount() != null ? c.getDiscountAmount() : 0.0)
                            .build();
                })
                .orElse(CouponValidateResponse.builder()
                        .valid(false).message("Coupon Not Applicable").build());
    }

    private CouponDTO mapToDTO(Coupon coupon) {
        return CouponDTO.builder()
                .id(coupon.getId().toString())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountPercent(coupon.getDiscountPercent())
                .discountAmount(coupon.getDiscountAmount())
                .minOrderValue(coupon.getMinOrderValue())
                .expiryDate(coupon.getExpiryDate())
                .isActive(coupon.isActive())
                .build();
    }
}
