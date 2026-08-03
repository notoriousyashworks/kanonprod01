package com.kicksaura.cartservice.util;

import com.kicksaura.cartservice.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Utility to resolve the authenticated user's ID from the request.
 *
 * <p>The API Gateway validates the JWT and propagates the user's String via the
 * {@code X-User-Id} header before forwarding the request to this service.
 * This class reads that header so individual controllers/services never need
 * to touch the raw JWT.
 */
@Component
public class UserContextUtil {

    private static final String USER_ID_HEADER = "X-User-Id";

    /**
     * Extracts the authenticated user's String from the {@code X-User-Id} header.
     *
     * @param request the incoming HTTP request
     * @return the authenticated user's String
     * @throws UnauthorizedException if the header is absent or contains an invalid String
     */
    public String resolveUserId(HttpServletRequest request) {
        String userIdHeader = request.getHeader(USER_ID_HEADER);

        if (userIdHeader == null || userIdHeader.isBlank()) {
            throw new UnauthorizedException("Missing authentication token. Please log in.");
        }

        try {
            return userIdHeader;
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedException("Invalid user identity in token.");
        }
    }
}
