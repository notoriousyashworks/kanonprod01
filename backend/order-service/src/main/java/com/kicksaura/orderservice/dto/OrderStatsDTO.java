package com.kicksaura.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatsDTO {
    private long totalOrders;
    private long pendingOrders;
    private double totalRevenue;
    private long totalCustomers;
}
