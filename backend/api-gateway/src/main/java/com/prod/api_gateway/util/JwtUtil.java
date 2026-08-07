package com.prod.api_gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtil {

    // This should match the secret used in user-service to generate the token
    @Value("${jwt.secret}")
    private String secret;

    public void validateToken(final String token) {
        Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token);
    }

    public Claims getClaims(final String token) {
        return Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token).getBody();
    }

    public String extractUserId(final String token) {
        Claims claims = getClaims(token);
        String userId = claims.get("uuid", String.class);
        if (userId == null) {
            userId = claims.get("userId", String.class);
        }
        if (userId == null) {
            userId = claims.getSubject();
        }
        return userId;
    }

    public String extractRole(final String token) {
        Claims claims = getClaims(token);
        return claims.get("role", String.class);
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
