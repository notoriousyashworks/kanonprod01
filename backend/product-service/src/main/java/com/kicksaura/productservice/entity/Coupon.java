package com.kicksaura.productservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    public enum DiscountType { PERCENTAGE, PER_PRODUCT }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "discount_percent", nullable = false)
    private Double discountPercent;

    @Column(name = "discount_amount")
    @org.hibernate.annotations.ColumnDefault("0")
    @Builder.Default
    private Double discountAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    @org.hibernate.annotations.ColumnDefault("'PERCENTAGE'")
    @Builder.Default
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Column(name = "min_order_value")
    private Double minOrderValue;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "show_on_checkout", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    @Builder.Default
    private boolean showOnCheckout = false;
}
