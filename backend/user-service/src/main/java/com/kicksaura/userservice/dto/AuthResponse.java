package com.kicksaura.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.kicksaura.userservice.entity.Address;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String uuid;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String role;
    private List<Address> addresses;
}
