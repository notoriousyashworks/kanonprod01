package com.kicksaura.orderservice.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ProductDTO {
    private String id;
    private String name;
    private String brand;
    private String category;
    private Double basePrice;
    private Double discountedPrice;
    private boolean isVisible;
    private List<String> imageUrls;
    private List<VariantDTO> variants;

    @Data
    public static class VariantDTO {
        private String id;
        private String size;
        private Integer stockQuantity;
        private String sku;
    }
}
