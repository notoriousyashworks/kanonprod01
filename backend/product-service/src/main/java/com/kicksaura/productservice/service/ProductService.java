package com.kicksaura.productservice.service;

import com.kicksaura.productservice.dto.ProductRequestDTO;
import com.kicksaura.productservice.dto.ProductResponseDTO;
import com.kicksaura.productservice.dto.VariantDTO;
import com.kicksaura.productservice.entity.Product;
import com.kicksaura.productservice.entity.ProductVariant;
import com.kicksaura.productservice.exception.ResourceNotFoundException;
import com.kicksaura.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kicksaura.productservice.repository.ProductSpecification;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    // ----- Public Methods -----

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> filterProducts(String query, List<String> categories, List<String> brands, Double minPrice, Double maxPrice, List<String> sizes, int page, int size) {
        Specification<Product> spec = Specification.where(ProductSpecification.isVisible())
                .and(ProductSpecification.hasSearchQuery(query))
                .and(ProductSpecification.hasCategoryIn(categories))
                .and(ProductSpecification.hasBrandIn(brands))
                .and(ProductSpecification.hasPriceBetween(minPrice, maxPrice))
                .and(ProductSpecification.hasSizeIn(sizes));

        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findAll(spec, pageable).map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getAllVisibleProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByIsVisibleTrueOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getNewArrivals(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByIsNewArrivalTrueAndIsVisibleTrueOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getTrendingProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByIsTrendingTrueAndIsVisibleTrueOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public ProductResponseDTO getVisibleProductById(String id) {
        Product product = productRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (!product.isVisible()) {
            throw new ResourceNotFoundException("Product is currently not visible.");
        }

        return mapToResponseDTO(product);
    }

    // ----- Admin Methods -----

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getAllProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findAll(pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public ProductResponseDTO getProductById(String id) {
        Product product = productRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponseDTO(product);
    }


    @Transactional
    public ProductResponseDTO createProduct(ProductRequestDTO request) {
        Product product = Product.builder()
                .name(request.getName())
                .searchName(request.getSearchName())
                .brand(request.getBrand())
                .searchBrand(request.getSearchBrand())
                .searchText(request.getSearchText())
                .category(request.getCategory())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .discountedPrice(request.getDiscountedPrice())
                .imageUrls(request.getImageUrls() != null ? new ArrayList<>(request.getImageUrls()) : new ArrayList<>())
                .videoUrls(request.getVideoUrls() != null ? new ArrayList<>(request.getVideoUrls()) : new ArrayList<>())
                .isVisible(request.isVisible())
                .isSaleVisible(request.isSaleVisible())
                .isNewArrival(request.isNewArrival())
                .isTrending(request.isTrending())
                .isVideoVisible(request.isVideoVisible())
                .withOgBox(request.isWithOgBox())
                .isInStockFlag(request.isInStockFlag())
                .isLimitedStock(request.getLimitedStock())
                .build();

        if (request.getVariants() != null) {
            for (VariantDTO variantDTO : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .size(variantDTO.getSize())
                        .stockQuantity(variantDTO.getStockQuantity())
                        .sku(variantDTO.getSku())
                        .build();
                product.addVariant(variant);
            }
        }

        System.out.println("[STEP 5 - Service] Mapped Product entity imageUrls: " + product.getImageUrls());
        System.out.println("[STEP 6 - Entity] Product entity field imageUrls mapped to @ElementCollection product_images table with @Column(name=\"image_url\"). Value: " + product.getImageUrls());
        Product savedProduct = productRepository.save(product);
        System.out.println("[STEP 7 - Repository] productRepository.save() completed for ID: " + savedProduct.getId() + " with imageUrls: " + savedProduct.getImageUrls());
        productRepository.flush();
        Product verifiedFromDb = productRepository.findById(savedProduct.getId()).orElse(savedProduct);
        System.out.println("[STEP 8 - PostgreSQL] Verified reading from DB right after save. product_images table contains imageUrls: " + verifiedFromDb.getImageUrls());
        return mapToResponseDTO(savedProduct);
    }

    @Transactional
    public ProductResponseDTO updateProduct(String id, ProductRequestDTO request) {
        Product product = productRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setName(request.getName());
        product.setSearchName(request.getSearchName());
        product.setBrand(request.getBrand());
        product.setSearchBrand(request.getSearchBrand());
        product.setSearchText(request.getSearchText());
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setDiscountedPrice(request.getDiscountedPrice());
        product.setImageUrls(request.getImageUrls() != null ? new ArrayList<>(request.getImageUrls()) : new ArrayList<>());
        product.setVideoUrls(request.getVideoUrls() != null ? new ArrayList<>(request.getVideoUrls()) : new ArrayList<>());
        product.setVisible(request.isVisible());
        product.setSaleVisible(request.isSaleVisible());
        product.setNewArrival(request.isNewArrival());
        product.setTrending(request.isTrending());
        product.setVideoVisible(request.isVideoVisible());
        product.setWithOgBox(request.isWithOgBox());
        product.setInStockFlag(request.isInStockFlag());
        product.setLimitedStock(request.getLimitedStock());

        // Merge strategy: match by SKU to preserve existing UUIDs.
        // This prevents breaking order_items.variant_id references on every product update.
        if (request.getVariants() != null) {
            // Map of SKU -> existing variant (from DB)
            java.util.Map<String, ProductVariant> existingBySku = product.getVariants().stream()
                    .collect(java.util.stream.Collectors.toMap(ProductVariant::getSku, v -> v));

            // Map of SKU -> incoming variant (from request)
            java.util.Map<String, VariantDTO> incomingBySku = request.getVariants().stream()
                    .collect(java.util.stream.Collectors.toMap(VariantDTO::getSku, v -> v));

            // Step 1: Remove variants whose SKU is no longer in the incoming list
            product.getVariants().removeIf(existing -> !incomingBySku.containsKey(existing.getSku()));

            // Step 2: Update existing variants in-place, or add new ones
            for (VariantDTO incomingDTO : request.getVariants()) {
                if (existingBySku.containsKey(incomingDTO.getSku())) {
                    // UPDATE in-place
                    ProductVariant existing = existingBySku.get(incomingDTO.getSku());
                    existing.setSize(incomingDTO.getSize());
                    existing.setStockQuantity(incomingDTO.getStockQuantity());
                } else {
                    // INSERT new variant
                    ProductVariant newVariant = ProductVariant.builder()
                            .size(incomingDTO.getSize())
                            .stockQuantity(incomingDTO.getStockQuantity())
                            .sku(incomingDTO.getSku())
                            .build();
                    product.addVariant(newVariant);
                }
            }
        } else {
            product.getVariants().clear();
        }

        System.out.println("[STEP 5 - Service] Mapped Product entity imageUrls on update: " + product.getImageUrls());
        System.out.println("[STEP 6 - Entity] Product entity field imageUrls mapped to @ElementCollection product_images table with @Column(name=\"image_url\"). Value: " + product.getImageUrls());
        Product updatedProduct = productRepository.save(product);
        System.out.println("[STEP 7 - Repository] productRepository.save() completed for ID: " + updatedProduct.getId() + " with imageUrls: " + updatedProduct.getImageUrls());
        productRepository.flush();
        Product verifiedFromDb = productRepository.findById(updatedProduct.getId()).orElse(updatedProduct);
        System.out.println("[STEP 8 - PostgreSQL] Verified reading from DB right after update. product_images table contains imageUrls: " + verifiedFromDb.getImageUrls());
        return mapToResponseDTO(updatedProduct);
    }

    @Transactional
    public void deleteProduct(String id) {
        if (!productRepository.existsById(UUID.fromString(id))) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(UUID.fromString(id));
    }

    @Transactional
    public ProductResponseDTO updateVisibility(String id, boolean isVisible) {
        Product product = productRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        product.setVisible(isVisible);
        Product savedProduct = productRepository.save(product);
        return mapToResponseDTO(savedProduct);
    }

    @Transactional
    public void deductStock(String productId, String variantId, Integer quantity) {
        Product product = productRepository.findById(UUID.fromString(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        ProductVariant variant = product.getVariants().stream()
                .filter(v -> v.getId().toString().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));

        if (variant.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for variant");
        }

        variant.setStockQuantity(variant.getStockQuantity() - quantity);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> searchProducts(String query, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return getAllVisibleProducts(page, size);
        }
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.searchProductsByQuery(query.trim(), pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getProductsByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByCategoryIgnoreCaseAndIsVisibleTrue(category, pageable)
                .map(this::mapToResponseDTO);
    }

    // ----- Helper Mappers -----

    private ProductResponseDTO mapToResponseDTO(Product product) {
        List<VariantDTO> variantDTOs = product.getVariants().stream().map(v ->
                VariantDTO.builder()
                        .id(v.getId().toString())
                        .size(v.getSize())
                        .stockQuantity(v.getStockQuantity())
                        .sku(v.getSku())
                        .build()
        ).collect(Collectors.toList());

        return ProductResponseDTO.builder()
                .id(product.getId().toString())
                .name(product.getName())
                .searchName(product.getSearchName())
                .brand(product.getBrand())
                .searchBrand(product.getSearchBrand())
                .searchText(product.getSearchText())
                .category(product.getCategory())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .discountedPrice(product.getDiscountedPrice())
                .imageUrls(product.getImageUrls())
                .videoUrls(product.getVideoUrls())
                .isVisible(product.isVisible())
                .isSaleVisible(product.isSaleVisible())
                .isNewArrival(product.isNewArrival())
                .isTrending(product.isTrending())
                .isVideoVisible(product.isVideoVisible())
                .withOgBox(product.isWithOgBox())
                .isInStockFlag(product.isInStockFlag())
                .limitedStock(product.isLimitedStock())
                .createdAt(product.getCreatedAt())
                .variants(variantDTOs)
                .build();
    }
}
