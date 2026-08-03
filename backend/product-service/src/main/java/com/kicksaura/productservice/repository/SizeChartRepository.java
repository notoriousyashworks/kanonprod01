package com.kicksaura.productservice.repository;

import com.kicksaura.productservice.entity.SizeChart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SizeChartRepository extends JpaRepository<SizeChart, UUID> {
    Optional<SizeChart> findByBrandNameIgnoreCase(String brandName);
}
