package com.kicksaura.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Flat DTO sent to user-service /api/v1/internal/users/guest-checkout.
 * Must match com.kicksaura.userservice.dto.GuestCheckoutRequest exactly.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestCheckoutDTO {

    private String phoneNumber;
    private String firstName;
    private String lastName;
    private String houseNumberOrAddress;
    private String landmark;
    private String city;
    private String state;
    private String pinCode;
}
