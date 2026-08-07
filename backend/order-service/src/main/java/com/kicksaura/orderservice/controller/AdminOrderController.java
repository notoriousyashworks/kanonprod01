package com.kicksaura.orderservice.controller;

import com.kicksaura.orderservice.dto.AdminOrderUpdateRequest;
import com.kicksaura.orderservice.dto.OrderResponseDTO;
import com.kicksaura.orderservice.dto.OrderStatsDTO;
import com.kicksaura.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<Page<OrderResponseDTO>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(orderService.getAllOrders(page, size));
    }

    @GetMapping("/stats")
    public ResponseEntity<OrderStatsDTO> getOrderStats() {
        return ResponseEntity.ok(orderService.getOrderStats());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponseDTO> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, payload.get("status"), payload.get("adminStatus")));
    }

    @PutMapping("/{id}/full-update")
    public ResponseEntity<OrderResponseDTO> updateOrderAdmin(
            @PathVariable String id,
            @RequestBody AdminOrderUpdateRequest request) {
        return ResponseEntity.ok(orderService.updateOrderAdmin(id, request));
    }
}
