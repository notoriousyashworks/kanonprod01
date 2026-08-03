package com.kicksaura.productservice.service;

import com.kicksaura.productservice.dto.CouponDTO;
import com.kicksaura.productservice.entity.Coupon;
import com.kicksaura.productservice.exception.ResourceNotFoundException;
import com.kicksaura.productservice.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

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
        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .discountPercent(request.getDiscountPercent())
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
        coupon.setDiscountPercent(request.getDiscountPercent());
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

    private CouponDTO mapToDTO(Coupon coupon) {
        return CouponDTO.builder()
                .id(coupon.getId().toString())
                .code(coupon.getCode())
                .discountPercent(coupon.getDiscountPercent())
                .minOrderValue(coupon.getMinOrderValue())
                .expiryDate(coupon.getExpiryDate())
                .isActive(coupon.isActive())
                .build();
    }
}
