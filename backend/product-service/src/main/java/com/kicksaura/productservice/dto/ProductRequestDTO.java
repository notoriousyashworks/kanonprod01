package com.kicksaura.productservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequestDTO {

    @NotBlank(message = "Product name is required")
    private String name;

    private String searchName;

    @NotBlank(message = "Brand is required")
    private String brand;

    private String searchBrand;

    private String searchText;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;

    @NotNull(message = "Base price is required")
    private Double basePrice;

    private Double discountedPrice;

    private List<String> imageUrls;

    private List<String> videoUrls;

    @Builder.Default
    private boolean isVisible = true;

    private boolean isSaleVisible;
    private boolean isNewArrival;
    private boolean isTrending;

    private boolean isVideoVisible;
    private boolean withOgBox;
    @Builder.Default
    private boolean isInStockFlag = true;
    private boolean isLimitedStock;

    @Valid
    private List<VariantDTO> variants;
}
