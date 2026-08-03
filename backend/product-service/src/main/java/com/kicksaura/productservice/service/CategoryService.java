package com.kicksaura.productservice.service;

import com.kicksaura.productservice.dto.CategoryDTO;
import com.kicksaura.productservice.entity.Category;
import com.kicksaura.productservice.exception.ResourceNotFoundException;
import com.kicksaura.productservice.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException("Category with name '" + request.getName() + "' already exists");
        }
        String slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .imageUrl(request.getImageUrl())
                .isActive(request.isActive())
                .build();
        System.out.println("[STEP 5 - Service] Mapped Category entity imageUrl: " + category.getImageUrl());
        System.out.println("[STEP 6 - Entity] Category entity field imageUrl mapped to categories table column image_url. Value: " + category.getImageUrl());
        Category saved = categoryRepository.save(category);
        System.out.println("[STEP 7 - Repository] categoryRepository.save() completed for ID: " + saved.getId() + " with imageUrl: " + saved.getImageUrl());
        categoryRepository.flush();
        Category verifiedFromDb = categoryRepository.findById(saved.getId()).orElse(saved);
        System.out.println("[STEP 8 - PostgreSQL] Verified reading from DB right after save. categories table contains image_url: " + verifiedFromDb.getImageUrl());
        return mapToDTO(saved);
    }

    @Transactional
    public CategoryDTO updateCategory(String id, CategoryDTO request) {
        Category category = categoryRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        String slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");

        category.setName(request.getName());
        category.setSlug(slug);
        category.setImageUrl(request.getImageUrl());
        category.setActive(request.isActive());
        System.out.println("[STEP 5 - Service] Mapped Category entity imageUrl on update: " + category.getImageUrl());
        System.out.println("[STEP 6 - Entity] Category entity field imageUrl mapped to categories table column image_url. Value: " + category.getImageUrl());
        Category updated = categoryRepository.save(category);
        System.out.println("[STEP 7 - Repository] categoryRepository.save() completed for ID: " + updated.getId() + " with imageUrl: " + updated.getImageUrl());
        categoryRepository.flush();
        Category verifiedFromDb = categoryRepository.findById(updated.getId()).orElse(updated);
        System.out.println("[STEP 8 - PostgreSQL] Verified reading from DB right after update. categories table contains image_url: " + verifiedFromDb.getImageUrl());
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCategory(String id) {
        if (!categoryRepository.existsById(UUID.fromString(id))) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(UUID.fromString(id));
    }

    private CategoryDTO mapToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId().toString())
                .name(category.getName())
                .imageUrl(category.getImageUrl())
                .isActive(category.isActive())
                .build();
    }
}
