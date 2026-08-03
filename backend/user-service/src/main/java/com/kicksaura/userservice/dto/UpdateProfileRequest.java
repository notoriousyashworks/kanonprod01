package com.kicksaura.userservice.dto;

import lombok.Data;

import com.kicksaura.userservice.entity.Address;
import java.util.List;

@Data
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private List<Address> addresses;
}
