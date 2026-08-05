package com.kicksaura.orderservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemRequestDTO {

    @NotNull(message = "Product ID is required")
    private String productId;

    private String variantId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private Boolean liveVideoCall;
}
