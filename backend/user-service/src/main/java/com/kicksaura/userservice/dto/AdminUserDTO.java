package com.kicksaura.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserDTO {

    private String uuid;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}
