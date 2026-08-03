package com.kicksaura.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminOrderUpdateRequest {
    private String paymentMethod;
    private String trackingId;
    private String trackingLink;
    private Double shippingFees;
    private String phoneNumber;
    private List<ItemUpdateDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemUpdateDTO {
        private String id;
        private String status;
        private Integer quantity;
        private String variantId;
    }
}
