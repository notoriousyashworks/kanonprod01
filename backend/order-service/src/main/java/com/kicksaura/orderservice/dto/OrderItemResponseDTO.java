package com.kicksaura.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponseDTO {
    private String id;
    private String productId;
    private String variantId;
    private Integer quantity;
    private Double purchasePrice;
    private String status;
    private Boolean liveVideoCall;
}
