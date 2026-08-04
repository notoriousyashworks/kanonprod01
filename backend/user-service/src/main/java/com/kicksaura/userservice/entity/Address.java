package com.kicksaura.userservice.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Builder.Default
    private String uuid = UUID.randomUUID().toString();

    private String firstName;

    private String lastName;

    private String houseNumberOrAddress;
    
    private String landmark;
    
    private String city;
    
    private String state;
    
    private String pinCode;

}
