package com.kicksaura.productservice.repository;

import com.kicksaura.productservice.entity.Product;
import com.kicksaura.productservice.entity.ProductVariant;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public class ProductSpecification {

    public static Specification<Product> isVisible() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("isVisible"));
    }

    public static Specification<Product> hasCategoryIn(List<String> categories) {
        return (root, query, criteriaBuilder) -> {
            if (categories == null || categories.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get("category").in(categories);
        };
    }

    public static Specification<Product> hasBrandIn(List<String> brands) {
        return (root, query, criteriaBuilder) -> {
            if (brands == null || brands.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get("brand").in(brands);
        };
    }

    public static Specification<Product> hasPriceBetween(Double minPrice, Double maxPrice) {
        return (root, query, criteriaBuilder) -> {
            if (minPrice == null && maxPrice == null) {
                return criteriaBuilder.conjunction();
            }

            double min = minPrice != null ? minPrice : 0.0;
            double max = maxPrice != null ? maxPrice : Double.MAX_VALUE;

            // We want to check if (discountedPrice != null ? discountedPrice : basePrice) is between min and max
            return criteriaBuilder.between(
                    criteriaBuilder.coalesce(root.get("discountedPrice"), root.get("basePrice")),
                    min,
                    max
            );
        };
    }

    public static Specification<Product> hasSizeIn(List<String> sizes) {
        return (root, query, criteriaBuilder) -> {
            if (sizes == null || sizes.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            
            // To avoid duplicates when joining
            query.distinct(true);

            Join<Product, ProductVariant> variantsJoin = root.join("variants", JoinType.INNER);
            return variantsJoin.get("size").in(sizes);
        };
    }
}
