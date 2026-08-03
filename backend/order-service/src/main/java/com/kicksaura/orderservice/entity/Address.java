package com.kicksaura.orderservice.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    private String houseNumberOrAddress;
    private String landmark;
    private String city;
    private String state;
    private String pinCode;
}
