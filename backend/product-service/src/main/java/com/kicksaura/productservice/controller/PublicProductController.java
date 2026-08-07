package com.kicksaura.productservice.controller;

import com.kicksaura.productservice.dto.ProductResponseDTO;
import com.kicksaura.productservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class PublicProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> getAllVisibleProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        return ResponseEntity.ok(productService.getAllVisibleProducts(page, size));
    }

    @GetMapping("/new-arrivals")
    public ResponseEntity<Page<ProductResponseDTO>> getNewArrivals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        return ResponseEntity.ok(productService.getNewArrivals(page, size));
    }

    @GetMapping("/trending")
    public ResponseEntity<Page<ProductResponseDTO>> getTrendingProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        return ResponseEntity.ok(productService.getTrendingProducts(page, size));
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<ProductResponseDTO>> filterProducts(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "categories", required = false) List<String> categories,
            @RequestParam(value = "brands", required = false) List<String> brands,
            @RequestParam(value = "minPrice", required = false) Double minPrice,
            @RequestParam(value = "maxPrice", required = false) Double maxPrice,
            @RequestParam(value = "sizes", required = false) List<String> sizes,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        return ResponseEntity.ok(productService.filterProducts(query, categories, brands, minPrice, maxPrice, sizes, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable String id) {
        return ResponseEntity.ok(productService.getVisibleProductById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ProductResponseDTO>> searchProducts(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        return ResponseEntity.ok(productService.searchProducts(query, page, size));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Page<ProductResponseDTO>> getProductsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        return ResponseEntity.ok(productService.getProductsByCategory(category, page, size));
    }
}
