package com.kicksaura.orderservice.controller;

import com.kicksaura.orderservice.dto.CheckoutRequestDTO;
import com.kicksaura.orderservice.dto.OrderResponseDTO;
import com.kicksaura.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponseDTO> checkout(@Valid @RequestBody CheckoutRequestDTO request) {
        return new ResponseEntity<>(orderService.createCheckoutSession(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> getOrder(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @PatchMapping("/admin/{id}/status")
    public ResponseEntity<OrderResponseDTO> updateStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, payload.get("status"), payload.get("adminStatus")));
    }

    @GetMapping("/public/pincode/{pin}")
    public ResponseEntity<?> lookupPin(@PathVariable String pin) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "https://api.postalpincode.in/pincode/" + pin;
            String result = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"error\":\"Failed to fetch PIN\"}");
        }
    }
}
