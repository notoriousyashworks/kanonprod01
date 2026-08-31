package com.kicksaura.productservice.controller;

import com.kicksaura.productservice.service.ImageKitAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides ImageKit authentication parameters to the admin frontend.
 *
 * Route : GET /api/v1/admin/imagekit/auth
 * Auth  : Requires ROLE_ADMIN JWT (enforced by the API gateway AuthenticationFilter).
 *
 * The browser uses these parameters to upload files directly to ImageKit
 * without routing file bytes through this service.
 * The ImageKit private key is NEVER included in the response.
 */
@RestController
@RequestMapping("/api/v1/admin/imagekit")
@RequiredArgsConstructor
public class ImageKitAuthController {

    private final ImageKitAuthService imagekitAuthService;

    /**
     * Returns short-lived ImageKit upload credentials for the requesting admin.
     *
     * Response JSON:
     * {
     *   "token":       "uuid-nonce",
     *   "expire":      1234567890,
     *   "signature":   "hex-hmac-sha256",
     *   "publicKey":   "public_xxxx",
     *   "urlEndpoint": "https://ik.imagekit.io/your_id"
     * }
     */
    @GetMapping("/auth")
    public ResponseEntity<ImageKitAuthService.AuthParams> getAuthParams() {
        return ResponseEntity.ok(imagekitAuthService.generateAuthParams());
    }
}
