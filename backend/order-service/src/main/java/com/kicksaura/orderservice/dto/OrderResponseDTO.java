package com.kicksaura.orderservice.dto;

import com.kicksaura.orderservice.entity.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDTO {
    private String id;
    private String orderNumber;
    private String userId;
    private Double totalAmount;
    private String status;
    private String adminStatus;
    private String paymentMethod;
    private String trackingId;
    private String trackingLink;
    private Address shippingAddress;
    private String phoneNumber;
    private String firstName;
    private String lastName;
    private Double shippingFees;
    private Boolean liveVideoCall;
    private List<OrderItemResponseDTO> items;
    private LocalDateTime createdAt;
}
