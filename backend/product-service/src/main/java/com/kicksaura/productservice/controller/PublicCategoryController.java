package com.kicksaura.productservice.controller;

import com.kicksaura.productservice.dto.CategoryDTO;
import com.kicksaura.productservice.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class PublicCategoryController {

    private final CategoryService categoryService;

    /**
     * Public endpoint — returns only active categories.
     * Used by the customer-facing storefront.
     */
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getActiveCategories() {
        List<CategoryDTO> all = categoryService.getAllCategories();
        List<CategoryDTO> active = all.stream()
                .filter(CategoryDTO::isActive)
                .toList();
        return ResponseEntity.ok(active);
    }
}
