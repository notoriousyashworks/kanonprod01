package com.kicksaura.userservice.controller;

import com.kicksaura.userservice.dto.AuthResponse;
import com.kicksaura.userservice.dto.OtpLoginRequest;
import com.kicksaura.userservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.security.cookie.secure}")
    private boolean cookieSecure;

    @Value("${msg91.widget-id}")
    private String widgetId;

    @Value("${msg91.widget-token}")
    private String widgetToken;

    /**
     * Public endpoint — returns MSG91 widget config for the frontend SDK init.
     * Safe to expose: widget credentials are frontend-facing by design.
     * GET /api/v1/users/auth/widget-config
     */
    @GetMapping("/widget-config")
    public ResponseEntity<Map<String, String>> getWidgetConfig() {
        return ResponseEntity.ok(Map.of(
                "widgetId", widgetId,
                "widgetToken", widgetToken
        ));
    }

    /**
     * Public endpoint. Receives the MSG91 access token from the frontend,
     * verifies it server-side with MSG91, finds or creates the user,
     * and returns an application JWT.
     *
     * POST /api/v1/users/auth/login
     * Body: { "accessToken": "<MSG91_ACCESS_TOKEN>" }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginWithOtp(@RequestBody OtpLoginRequest request) {
        AuthResponse response = authService.loginWithOtpToken(request.getAccessToken());

        ResponseCookie cookie = ResponseCookie.from("kicksaura_auth_token", response.getToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    /**
     * Clear the auth cookie on logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = ResponseCookie.from("kicksaura_auth_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0) // Expire immediately
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }
}
