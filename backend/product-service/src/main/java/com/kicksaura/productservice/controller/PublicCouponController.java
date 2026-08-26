package com.kicksaura.productservice.controller;

import com.kicksaura.productservice.dto.CouponValidateResponse;
import com.kicksaura.productservice.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class PublicCouponController {

    private final CouponService couponService;

    /**
     * POST /api/v1/coupons/validate
     * Public endpoint — no auth required.
     * Body: { "code": "GRAB100" }
     */
    @PostMapping("/validate")
    public ResponseEntity<CouponValidateResponse> validate(@RequestBody Map<String, String> body) {
        String code = body.getOrDefault("code", "").trim();
        if (code.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(CouponValidateResponse.builder()
                            .valid(false).message("Please enter a coupon code").build());
        }
        return ResponseEntity.ok(couponService.validateCoupon(code));
    }
    @GetMapping
    public ResponseEntity<java.util.List<com.kicksaura.productservice.dto.CouponDTO>> getVisibleCoupons() {
        return ResponseEntity.ok(couponService.getVisibleCoupons());
    }
}
