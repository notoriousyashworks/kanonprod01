package com.kicksaura.orderservice.repository;

import com.kicksaura.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByStatus(String status);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findAllByUserIdOrderByCreatedAtDesc(String userId);

    @Query("SELECT COUNT(DISTINCT o.userId) FROM Order o")
    long countDistinctCustomers();
}
