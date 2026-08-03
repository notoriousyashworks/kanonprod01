package com.kicksaura.cartservice.repository;

import com.kicksaura.cartservice.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, String> {

    /**
     * Find all cart items for a given user.
     */
    List<CartItem> findByUserId(String userId);

    /**
     * Find a specific cart item by userId and productId.
     */
    Optional<CartItem> findByUserIdAndProductId(String userId, String productId);

    /**
     * Delete a specific cart item by userId and productId.
     */
    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.userId = :userId AND c.productId = :productId")
    void deleteByUserIdAndProductId(@Param("userId") String userId, @Param("productId") String productId);

    /**
     * Delete all cart items for a given user (clear cart).
     */
    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.userId = :userId")
    void deleteAllByUserId(@Param("userId") String userId);

    /**
     * Check whether a cart item exists for a user and product.
     */
    boolean existsByUserIdAndProductId(String userId, String productId);
}
