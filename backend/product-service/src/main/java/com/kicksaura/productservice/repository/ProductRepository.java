package com.kicksaura.productservice.repository;

import com.kicksaura.productservice.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Page<Product> findByIsVisibleTrue(Pageable pageable);
    Page<Product> findByIsVisibleTrueOrderByCreatedAtDesc(Pageable pageable);
    Page<Product> findByIsNewArrivalTrueAndIsVisibleTrueOrderByCreatedAtDesc(Pageable pageable);
    Page<Product> findByIsTrendingTrueAndIsVisibleTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isVisible = true AND " +
           "(LOWER(p.searchName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.searchBrand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.searchText) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchProductsByQuery(@Param("query") String query, Pageable pageable);

    Page<Product> findByCategoryIgnoreCaseAndIsVisibleTrue(String category, Pageable pageable);
}
