package com.kicksaura.productservice.dto;

import jakarta.validation.constraints.NotBlank;
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
public class VariantDTO {

    private String id;

    @NotBlank(message = "Size is required")
    private String size;

    @NotNull(message = "Stock quantity is required")
    private Integer stockQuantity;

    @NotBlank(message = "SKU is required")
    private String sku;
}
