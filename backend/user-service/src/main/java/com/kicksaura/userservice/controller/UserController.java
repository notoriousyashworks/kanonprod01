package com.kicksaura.userservice.controller;

import com.kicksaura.userservice.dto.UpdateProfileRequest;
import com.kicksaura.userservice.entity.Address;
import com.kicksaura.userservice.entity.User;
import com.kicksaura.userservice.exception.ResourceNotFoundException;
import com.kicksaura.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/profile")
@RequiredArgsConstructor
public class UserController {

    private static final int MAX_SAVED_ADDRESSES = 3;
    private static final String ADDRESS_LIMIT_MESSAGE =
            "Max address limit reached. Delete one address first to add a new address.";

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
            if (req.getAddresses().size() > MAX_SAVED_ADDRESSES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ADDRESS_LIMIT_MESSAGE);
            }
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

        trimSavedAddresses(user);

        boolean exists = user.getAddresses().stream().anyMatch(a ->
                a.getPinCode() != null && a.getPinCode().equals(address.getPinCode()) &&
                a.getHouseNumberOrAddress() != null && a.getHouseNumberOrAddress().equals(address.getHouseNumberOrAddress())
        );

        if (!exists) {
            if (user.getAddresses().size() >= MAX_SAVED_ADDRESSES) {
                userRepository.save(user);
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        ADDRESS_LIMIT_MESSAGE
                );
            }
            user.getAddresses().add(address);
            userRepository.save(user);
        }

        return ResponseEntity.ok(user);
    }

    private void trimSavedAddresses(User user) {
        if (user.getAddresses().size() > MAX_SAVED_ADDRESSES) {
            user.getAddresses().subList(MAX_SAVED_ADDRESSES, user.getAddresses().size()).clear();
        }
    }
}
