package com.kicksaura.cartservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

/**
 * Feign client stub for the Product Service.
 *
 * <p>Currently used only to validate that a product exists before adding it
 * to the cart. Extend this interface to fetch richer product data (name, price,
 * images) when building an aggregated cart view in the future.
 */
@FeignClient(name = "product-service")
public interface ProductClient {

    /**
     * Check product existence by fetching it from the Product Service.
     * Returns a lightweight map – the cart service only needs to confirm
     * the product is available; it does not store any product fields.
     *
     * @param productId the product String to look up
     * @return a generic response object (existence check only)
     */
    @GetMapping("/api/v1/products/{productId}")
    Object getProductById(@PathVariable("productId") String productId);
}
