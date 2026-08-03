package com.kicksaura.productservice.service;

import com.kicksaura.productservice.dto.BrandDTO;
import com.kicksaura.productservice.entity.Brand;
import com.kicksaura.productservice.exception.ResourceNotFoundException;
import com.kicksaura.productservice.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;

    @Transactional(readOnly = true)
    public List<BrandDTO> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public BrandDTO createBrand(BrandDTO request) {
        if (brandRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException("Brand with name '" + request.getName() + "' already exists");
        }
        String slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");

        Brand brand = Brand.builder()
                .name(request.getName())
                .slug(slug)
                .isActive(request.isActive())
                .build();
        return mapToDTO(brandRepository.save(brand));
    }

    @Transactional
    public BrandDTO updateBrand(String id, BrandDTO request) {
        Brand brand = brandRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));
        String slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");

        brand.setName(request.getName());
        brand.setSlug(slug);
        brand.setActive(request.isActive());
        return mapToDTO(brandRepository.save(brand));
    }

    @Transactional
    public void deleteBrand(String id) {
        if (!brandRepository.existsById(UUID.fromString(id))) {
            throw new ResourceNotFoundException("Brand not found with id: " + id);
        }
        brandRepository.deleteById(UUID.fromString(id));
    }

    private BrandDTO mapToDTO(Brand brand) {
        return BrandDTO.builder()
                .id(brand.getId().toString())
                .name(brand.getName())
                .isActive(brand.isActive())
                .build();
    }
}
