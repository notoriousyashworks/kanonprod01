package com.kicksaura.cartservice.controller;

import com.kicksaura.cartservice.dto.AddToCartRequestDTO;
import com.kicksaura.cartservice.dto.CartItemResponseDTO;
import com.kicksaura.cartservice.dto.CartResponseDTO;
import com.kicksaura.cartservice.dto.UpdateCartRequestDTO;
import com.kicksaura.cartservice.service.CartService;
import com.kicksaura.cartservice.util.UserContextUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller exposing cart operations for the authenticated user.
 *
 * <p>The user's identity is resolved from the {@code X-User-Id} header which
 * is injected by the API Gateway after validating the JWT – it is never taken
 * from the request body.
 */
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserContextUtil userContextUtil;

    /**
     * POST /api/v1/cart/add
     * <p>
     * Adds a product to the authenticated user's cart.
     * If the product already exists, its quantity is increased.
     */
    @PostMapping("/add")
    public ResponseEntity<CartItemResponseDTO> addToCart(
            @Valid @RequestBody AddToCartRequestDTO request,
            HttpServletRequest httpRequest) {

        String userId = userContextUtil.resolveUserId(httpRequest);
        CartItemResponseDTO response = cartService.addToCart(userId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/cart/update
     * <p>
     * Sets the quantity of a cart item to the given value.
     * If quantity is 0 or less, the item is automatically removed.
     */
    @PutMapping("/update")
    public ResponseEntity<CartItemResponseDTO> updateCart(
            @Valid @RequestBody UpdateCartRequestDTO request,
            HttpServletRequest httpRequest) {

        String userId = userContextUtil.resolveUserId(httpRequest);
        CartItemResponseDTO response = cartService.updateCartItem(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/cart/{productId}
     * <p>
     * Removes a specific product from the user's cart.
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromCart(
            @PathVariable String productId,
            HttpServletRequest httpRequest) {

        String userId = userContextUtil.resolveUserId(httpRequest);
        cartService.removeFromCart(userId, productId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/cart
     * <p>
     * Returns the authenticated user's full cart.
     */
    @GetMapping
    public ResponseEntity<CartResponseDTO> getCart(HttpServletRequest httpRequest) {
        String userId = userContextUtil.resolveUserId(httpRequest);
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    /**
     * DELETE /api/v1/cart/clear
     * <p>
     * Removes all items from the authenticated user's cart.
     */
    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(HttpServletRequest httpRequest) {
        String userId = userContextUtil.resolveUserId(httpRequest);
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
