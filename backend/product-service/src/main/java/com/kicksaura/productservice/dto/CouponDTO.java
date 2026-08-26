package com.kicksaura.productservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kicksaura.productservice.entity.Coupon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponDTO {

    private String id;
    private String code;
    private Coupon.DiscountType discountType;
    private Double discountPercent;
    private Double discountAmount;
    private Double minOrderValue;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    @JsonProperty("active")
    private boolean isActive;

    private boolean showOnCheckout;
}
