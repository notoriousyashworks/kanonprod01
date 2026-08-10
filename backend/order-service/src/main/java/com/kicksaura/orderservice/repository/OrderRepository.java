package com.kicksaura.orderservice.repository;

import com.kicksaura.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByStatus(String status);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Order> findAllByUserIdOrderByCreatedAtDesc(String userId);

    @Query("SELECT COUNT(DISTINCT o.userId) FROM Order o")
    long countDistinctCustomers();

    @Query("SELECT COUNT(o) FROM Order o WHERE UPPER(o.status) IN ('ORDER_PLACED', 'PENDING')")
    long countPendingOrders();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE UPPER(o.status) NOT IN ('CANCELLED', 'RETURNED')")
    double sumTotalRevenue();
}
