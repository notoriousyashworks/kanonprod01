package com.kicksaura.productservice.repository;

import com.kicksaura.productservice.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    List<Product> findByIsVisibleTrue();
    List<Product> findByIsVisibleTrueOrderByCreatedAtDesc();
    List<Product> findByIsNewArrivalTrueAndIsVisibleTrueOrderByCreatedAtDesc();
    List<Product> findByIsTrendingTrueAndIsVisibleTrueOrderByCreatedAtDesc();

    @Query("SELECT p FROM Product p WHERE p.isVisible = true AND " +
           "(LOWER(p.searchName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.searchBrand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.searchText) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProductsByQuery(@Param("query") String query);

    List<Product> findByCategoryIgnoreCaseAndIsVisibleTrue(String category);
}
