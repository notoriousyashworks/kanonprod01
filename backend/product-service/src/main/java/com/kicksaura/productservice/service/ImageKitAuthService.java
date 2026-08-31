package com.kicksaura.productservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Generates server-side ImageKit authentication parameters for browser-direct uploads.
 *
 * Per ImageKit docs:
 *   signature = HMAC-SHA256( privateKey, token + expire )
 *   expire     = current Unix time (seconds) + validity window
 *   token      = random unique string (nonce)
 *
 * The private key NEVER leaves this service.
 */
@Service
public class ImageKitAuthService {

    /** Validity window for one auth token (30 minutes). */
    private static final long EXPIRE_SECONDS = 1800L;

    @Value("${imagekit.private-key}")
    private String privateKey;

    @Value("${imagekit.public-key}")
    private String publicKey;

    @Value("${imagekit.url-endpoint}")
    private String urlEndpoint;

    /**
     * Produces a fresh set of ImageKit authentication parameters.
     * These are safe to return to the authenticated admin browser.
     *
     * @return AuthParams record containing token, expire, signature, and publicKey
     */
    public AuthParams generateAuthParams() {
        String token  = UUID.randomUUID().toString();
        long   expire = (System.currentTimeMillis() / 1000L) + EXPIRE_SECONDS;
        String signature = sign(token, expire);
        return new AuthParams(token, expire, signature, publicKey, urlEndpoint);
    }

    /** HMAC-SHA256( privateKey, token + expire ) — returns lowercase hex. */
    private String sign(String token, long expire) {
        try {
            String message = token + expire;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    privateKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] raw = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to generate ImageKit signature", e);
        }
    }

    /**
     * Immutable record returned to the browser.
     * Contains only the data the client needs — private key is excluded.
     */
    public record AuthParams(
            String token,
            long   expire,
            String signature,
            String publicKey,
            String urlEndpoint
    ) {}
}
