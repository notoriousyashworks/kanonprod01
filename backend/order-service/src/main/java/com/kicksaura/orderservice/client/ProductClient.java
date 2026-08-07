package com.kicksaura.orderservice.client;

import com.kicksaura.orderservice.dto.ProductDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "product-service", url = "${product-service.url:http://product-service:8082}")
public interface ProductClient {

    @GetMapping("/api/v1/admin/products/{productId}")
    ProductDTO getProductById(@PathVariable("productId") String productId);
}
