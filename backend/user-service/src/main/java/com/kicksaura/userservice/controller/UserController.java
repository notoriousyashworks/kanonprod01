package com.kicksaura.userservice.controller;

import com.kicksaura.userservice.dto.UpdateProfileRequest;
import com.kicksaura.userservice.entity.Address;
import com.kicksaura.userservice.entity.User;
import com.kicksaura.userservice.exception.ResourceNotFoundException;
import com.kicksaura.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody UpdateProfileRequest req) {

        User user = userRepository.findByUuid(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (req.getFirstName() != null && !req.getFirstName().isBlank()) {
            user.setFirstName(req.getFirstName().trim());
        }
        if (req.getLastName() != null) {
            user.setLastName(req.getLastName().trim());
        }
        if (req.getAddresses() != null) {
            user.getAddresses().clear();
            req.getAddresses().forEach(addr -> {
                if (addr.getUuid() == null || addr.getUuid().trim().isEmpty()) {
                    addr.setUuid(java.util.UUID.randomUUID().toString());
                }
            });
            user.getAddresses().addAll(req.getAddresses());
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "uuid",        user.getUuid(),
                "firstName",   user.getFirstName(),
                "lastName",    user.getLastName(),
                "phoneNumber", user.getPhoneNumber(),
                "addresses",   user.getAddresses()
        ));
    }

    @PostMapping("/address")
    public ResponseEntity<User> addAddress(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Address address) {

        User user = userRepository.findByUuid(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean exists = user.getAddresses().stream().anyMatch(a ->
                a.getPinCode() != null && a.getPinCode().equals(address.getPinCode()) &&
                a.getHouseNumberOrAddress() != null && a.getHouseNumberOrAddress().equals(address.getHouseNumberOrAddress())
        );

        if (!exists) {
            user.getAddresses().add(address);
            userRepository.save(user);
        }

        return ResponseEntity.ok(user);
    }
}
