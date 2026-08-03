package com.kicksaura.userservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.kicksaura.userservice.dto.AuthResponse;
import com.kicksaura.userservice.entity.User;
import com.kicksaura.userservice.exception.InvalidTokenException;
import com.kicksaura.userservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final WebClient webClient;

    @Value("${msg91.widget-id}")
    private String widgetId;

    @Value("${msg91.widget-token}")
    private String widgetToken;

    @Value("${msg91.authkey}")
    private String authKey;

    /**
     * Server-side verification of MSG91 access token, then user lookup/creation,
     * then application JWT issuance.
     */
    @Transactional
    public AuthResponse loginWithOtpToken(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new InvalidTokenException("Access token is required");
        }

        // --- Step 1: Server-side MSG91 access token verification ---
        String verifiedPhone;
        try {
            // MSG91 verification: POST with authkey header and access-token in body
            JsonNode response = webClient.post()
                    .uri("https://api.msg91.com/api/v5/widget/verifyAccessToken")
                    .header("authkey", authKey)
                    .header("content-type", "application/json")
                    .bodyValue(java.util.Map.of("access-token", accessToken))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) {
                throw new InvalidTokenException("No response from MSG91 verification service");
            }

            // Log the full response so we can debug any field mismatch
            log.info("MSG91 verifyAccessToken full response: {}", response);

            String responseType = response.path("type").asText("");
            if (!"success".equalsIgnoreCase(responseType)) {
                String msg = response.path("message").asText("MSG91 verification failed");
                log.warn("MSG91 token verification failed: type={}, message={}, fullResponse={}", responseType, msg, response);
                throw new InvalidTokenException("MSG91 Error: " + msg);
            }

            // Extract mobile — check multiple possible locations in the response
            verifiedPhone = response.path("message").asText("");          // some versions put mobile here
            if (verifiedPhone.isBlank() || !verifiedPhone.matches(".*\\d{5,}.*")) {
                verifiedPhone = response.path("data").path("mobile").asText("");   // standard: data.mobile
            }
            if (verifiedPhone.isBlank()) {
                verifiedPhone = response.path("data").path("email").asText("");    // email fallback
            }
            if (verifiedPhone.isBlank()) {
                verifiedPhone = response.path("mobile").asText("");               // top-level fallback
            }

            if (verifiedPhone.isBlank()) {
                log.warn("MSG91 success but could not extract phone/email. Full response: {}", response);
                throw new InvalidTokenException("Verified but could not determine phone. Response: " + response);
            }

        } catch (WebClientResponseException e) {
            String body = e.getResponseBodyAsString();
            log.warn("MSG91 HTTP error during verification: status={}, body={}", e.getStatusCode(), body);
            throw new InvalidTokenException("MSG91 Error: " + body);
        } catch (InvalidTokenException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during MSG91 verification", e);
            throw new InvalidTokenException("Auth Error: " + e.getMessage());
        }

        // --- Step 2: Normalize phone number ---
        // MSG91 returns "919876543210" (with country code). Store as 10-digit.
        String normalizedPhone = normalizePhone(verifiedPhone);

        // --- Step 3: Find or create user ---
        User user = userService.findOrCreateByPhone(normalizedPhone);

        // --- Step 4: Generate application JWT ---
        String jwt = jwtUtil.generateToken(user.getUuid(), user.getRole());

        return AuthResponse.builder()
                .token(jwt)
                .uuid(user.getUuid())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .addresses(user.getAddresses())
                .build();
    }

    /**
     * Normalizes the phone number returned by MSG91.
     * MSG91 returns "919876543210" — we strip "91" prefix to store as "9876543210".
     * Falls back gracefully if format is unexpected.
     */
    private String normalizePhone(String rawPhone) {
        if (rawPhone == null) return "";
        // Remove non-digits
        String digits = rawPhone.replaceAll("[^0-9]", "");
        // If 12 digits starting with 91, strip country code
        if (digits.length() == 12 && digits.startsWith("91")) {
            return digits.substring(2);
        }
        // If already 10 digits
        if (digits.length() == 10) {
            return digits;
        }
        return digits;
    }
}
