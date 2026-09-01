package com.kicksaura.productservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "search_name")
    private String searchName;

    @Column(nullable = false)
    private String brand;

    @Column(name = "search_brand")
    private String searchBrand;

    @Column(name = "search_text", columnDefinition = "TEXT")
    private String searchText;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price", nullable = false)
    private Double basePrice;

    @Column(name = "discounted_price")
    private Double discountedPrice;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"), indexes = @Index(name = "idx_product_images_product_id", columnList = "product_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "product_videos", joinColumns = @JoinColumn(name = "product_id"), indexes = @Index(name = "idx_product_videos_product_id", columnList = "product_id"))
    @Column(name = "video_url")
    @Builder.Default
    private List<String> videoUrls = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private boolean isVisible = true;

    @Column(name = "is_sale_visible", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    @Builder.Default
    private boolean isSaleVisible = false;

    @Column(name = "is_new_arrival", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    @Builder.Default
    private boolean isNewArrival = false;

    @Column(name = "is_trending", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    @Builder.Default
    private boolean isTrending = false;

    @Column(name = "is_video_visible", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    @Builder.Default
    private boolean isVideoVisible = false;

    @Column(name = "with_og_box", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    @Builder.Default
    private boolean withOgBox = false;

    @Column(name = "is_in_stock_flag", nullable = false)
    @org.hibernate.annotations.ColumnDefault("true")
    @Builder.Default
    private boolean isInStockFlag = true;

    @Column(name = "is_limited_stock", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    @Builder.Default
    private boolean isLimitedStock = false;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ProductVariant> variants = new ArrayList<>();

    public void addVariant(ProductVariant variant) {
        variants.add(variant);
        variant.setProduct(this);
    }

    public void removeVariant(ProductVariant variant) {
        variants.remove(variant);
        variant.setProduct(null);
    }
}
