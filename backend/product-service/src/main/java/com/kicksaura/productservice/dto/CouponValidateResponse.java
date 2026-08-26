package com.kicksaura.productservice.dto;

import com.kicksaura.productservice.entity.Coupon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponValidateResponse {
    private boolean valid;
    private String code;
    private Coupon.DiscountType discountType;
    private Double discountPercent;
    private Double discountAmount;
    private String message;
}
