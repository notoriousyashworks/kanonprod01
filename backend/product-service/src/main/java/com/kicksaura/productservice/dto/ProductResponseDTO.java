package com.kicksaura.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDTO {

    private String id;
    private String name;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String originalName;
    private String searchName;
    private String brand;
    private String searchBrand;
    private String searchText;
    private String category;
    private String description;
    private Double basePrice;
    private Double discountedPrice;
    private List<String> imageUrls;
    private List<String> videoUrls;
    private boolean isVisible;
    private boolean isSaleVisible;
    private boolean isNewArrival;
    private boolean isTrending;
    private boolean isVideoVisible;
    private boolean withOgBox;
    private boolean isInStockFlag;
    private boolean limitedStock;
    private LocalDateTime createdAt;
    
    private List<VariantDTO> variants;
}
