package com.kicksaura.userservice.controller;

import com.kicksaura.userservice.dto.GuestCheckoutRequest;
import com.kicksaura.userservice.entity.User;
import com.kicksaura.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @PostMapping("/guest-checkout")
    public ResponseEntity<User> guestCheckout(@Valid @RequestBody GuestCheckoutRequest request) {
        User user = userService.getOrCreateGuestUser(request);
        return ResponseEntity.ok(user);
    }

}
