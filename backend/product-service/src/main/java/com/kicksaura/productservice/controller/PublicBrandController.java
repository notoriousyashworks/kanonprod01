package com.kicksaura.productservice.controller;

import com.kicksaura.productservice.dto.BrandDTO;
import com.kicksaura.productservice.service.BrandService;
import lombok.RequiredArgsConstructor;
import com.kicksaura.productservice.repository.SizeChartRepository;
import com.kicksaura.productservice.dto.SizeChartDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
public class PublicBrandController {

    private final BrandService brandService;
    private final SizeChartRepository sizeChartRepository;

    /**
     * Public endpoint — returns only active brands.
     * Used by the customer-facing storefront for the brand filter sidebar.
     */
    @GetMapping
    public ResponseEntity<List<BrandDTO>> getActiveBrands() {
        List<BrandDTO> all = brandService.getAllBrands();
        List<BrandDTO> active = all.stream()
                .filter(BrandDTO::isActive)
                .toList();
        return ResponseEntity.ok(active);
    }

    /**
     * Public endpoint to get size chart for a brand.
     */
    @GetMapping("/{brandName}/size-chart")
    public ResponseEntity<SizeChartDTO> getSizeChart(@PathVariable String brandName) {
        return sizeChartRepository.findByBrandNameIgnoreCase(brandName)
                .map(sc -> ResponseEntity.ok(SizeChartDTO.builder()
                        .brandName(sc.getBrand().getName())
                        .imageUrl(sc.getImageUrl())
                        .build()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
