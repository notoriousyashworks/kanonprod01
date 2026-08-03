package com.kicksaura.cartservice.service;

import com.kicksaura.cartservice.dto.AddToCartRequestDTO;
import com.kicksaura.cartservice.dto.CartItemResponseDTO;
import com.kicksaura.cartservice.dto.CartResponseDTO;
import com.kicksaura.cartservice.dto.UpdateCartRequestDTO;
import com.kicksaura.cartservice.entity.CartItem;
import com.kicksaura.cartservice.exception.CartItemNotFoundException;
import com.kicksaura.cartservice.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;

    // ─── Add to Cart ────────────────────────────────────────────────────────────

    /**
     * Adds a product to the user's cart.
     * <ul>
     *   <li>If the product already exists in the cart, the new quantity is
     *       <em>added</em> to the existing quantity (not replaced).</li>
     *   <li>If the resulting quantity is &lt;= 0, the item is removed instead.</li>
     * </ul>
     */
    @Transactional
    public CartItemResponseDTO addToCart(String userId, AddToCartRequestDTO request) {
        log.debug("addToCart: userId={}, productId={}, qty={}", userId, request.getProductId(), request.getQuantity());

        Optional<CartItem> existing = cartItemRepository.findByUserIdAndProductId(userId, request.getProductId());

        if (existing.isPresent()) {
            // Product already in cart – increase quantity
            CartItem cartItem = existing.get();
            int newQuantity = cartItem.getQuantity() + request.getQuantity();

            if (newQuantity <= 0) {
                cartItemRepository.delete(cartItem);
                log.debug("addToCart: resulting quantity <= 0, item removed");
                // Return a tombstone-style response; callers should treat this as removal
                return mapToResponseDTO(cartItem);
            }

            cartItem.setQuantity(newQuantity);
            return mapToResponseDTO(cartItemRepository.save(cartItem));
        }

        // New cart entry
        CartItem newItem = CartItem.builder()
                .userId(userId)
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .build();

        return mapToResponseDTO(cartItemRepository.save(newItem));
    }

    // ─── Update Cart ─────────────────────────────────────────────────────────────

    /**
     * Updates the quantity of an existing cart item.
     * <ul>
     *   <li>Sets the quantity to the provided value (not a delta).</li>
     *   <li>If quantity becomes &lt;= 0, the item is deleted automatically.</li>
     * </ul>
     *
     * @throws CartItemNotFoundException if the item is not in the user's cart
     */
    @Transactional
    public CartItemResponseDTO updateCartItem(String userId, UpdateCartRequestDTO request) {
        log.debug("updateCartItem: userId={}, productId={}, qty={}", userId, request.getProductId(), request.getQuantity());

        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(userId, request.getProductId())
                .orElseThrow(() -> new CartItemNotFoundException(
                        "Product " + request.getProductId() + " is not in your cart."));

        if (request.getQuantity() <= 0) {
            cartItemRepository.delete(cartItem);
            log.debug("updateCartItem: quantity <= 0, item removed");
            return mapToResponseDTO(cartItem);
        }

        cartItem.setQuantity(request.getQuantity());
        return mapToResponseDTO(cartItemRepository.save(cartItem));
    }

    // ─── Remove Item ─────────────────────────────────────────────────────────────

    /**
     * Removes a specific product from the user's cart.
     *
     * @throws CartItemNotFoundException if the item is not found
     */
    @Transactional
    public void removeFromCart(String userId, String productId) {
        log.debug("removeFromCart: userId={}, productId={}", userId, productId);

        if (!cartItemRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new CartItemNotFoundException(
                    "Product " + productId + " is not in your cart.");
        }

        cartItemRepository.deleteByUserIdAndProductId(userId, productId);
    }

    // ─── Get Cart ─────────────────────────────────────────────────────────────

    /**
     * Returns all items currently in the user's cart.
     */
    @Transactional(readOnly = true)
    public CartResponseDTO getCart(String userId) {
        log.debug("getCart: userId={}", userId);

        List<CartItemResponseDTO> items = cartItemRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());

        return CartResponseDTO.builder()
                .userId(userId)
                .totalItems(items.size())
                .items(items)
                .build();
    }

    // ─── Clear Cart ──────────────────────────────────────────────────────────────

    /**
     * Removes all items from the user's cart.
     */
    @Transactional
    public void clearCart(String userId) {
        log.debug("clearCart: userId={}", userId);
        cartItemRepository.deleteAllByUserId(userId);
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────────

    private CartItemResponseDTO mapToResponseDTO(CartItem cartItem) {
        return CartItemResponseDTO.builder()
                .id(cartItem.getId())
                .userId(cartItem.getUserId())
                .productId(cartItem.getProductId())
                .quantity(cartItem.getQuantity())
                .createdAt(cartItem.getCreatedAt())
                .updatedAt(cartItem.getUpdatedAt())
                .build();
    }
}
