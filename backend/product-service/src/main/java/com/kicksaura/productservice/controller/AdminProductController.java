package com.kicksaura.productservice.controller;

import com.kicksaura.productservice.dto.ProductRequestDTO;
import com.kicksaura.productservice.dto.ProductResponseDTO;
import com.kicksaura.productservice.dto.SourceLookupRequestDTO;
import com.kicksaura.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        return ResponseEntity.ok(productService.getAllProducts(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductResponseDTO> createProduct(@Valid @RequestBody ProductRequestDTO request) {
        System.out.println("[STEP 3 - Controller] AdminProductController received createProduct request.");
        System.out.println("[STEP 4 - DTO] ProductRequestDTO imageUrls: " + request.getImageUrls());
        return new ResponseEntity<>(productService.createProduct(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable String id,
            @Valid @RequestBody ProductRequestDTO request) {
        System.out.println("[STEP 3 - Controller] AdminProductController received updateProduct request for id: " + id);
        System.out.println("[STEP 4 - DTO] ProductRequestDTO imageUrls: " + request.getImageUrls());
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<ProductResponseDTO> updateVisibility(@PathVariable String id,
            @RequestBody Map<String, Boolean> payload) {
        if (!payload.containsKey("isVisible")) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(productService.updateVisibility(id, payload.get("isVisible")));
    }

    @PatchMapping("/{id}/variants/{variantId}/deduct-stock")
    public ResponseEntity<Void> deductStock(@PathVariable String id, @PathVariable String variantId,
            @RequestParam Integer quantity) {
        productService.deductStock(id, variantId, quantity);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/batch-lookup")
    public ResponseEntity<List<String>> lookupSourceIds(@RequestBody SourceLookupRequestDTO request) {
        if (request.getSourceSite() == null || request.getSourceProductIds() == null || request.getSourceProductIds().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(productService.findExistingSourceProductIds(request.getSourceSite(), request.getSourceProductIds()));
    }
}
