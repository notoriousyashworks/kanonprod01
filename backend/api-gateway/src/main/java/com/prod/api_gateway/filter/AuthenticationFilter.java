package com.prod.api_gateway.filter;

import com.prod.api_gateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = null;
        
        // Try to get token from cookie first
        if (exchange.getRequest().getCookies().containsKey("kicksaura_auth_token")) {
            authHeader = exchange.getRequest().getCookies().getFirst("kicksaura_auth_token").getValue();
        }
        
        // Fallback to Authorization header
        if (authHeader == null && exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authHeader = authHeader.substring(7);
            } else {
                authHeader = null;
            }
        }

        if (isSecured(exchange)) {
            if (authHeader == null) {
                return onError(exchange, "Missing or invalid authorization header", HttpStatus.UNAUTHORIZED);
            }
            try {
                jwtUtil.validateToken(authHeader);
                
                if (isAdminRoute(exchange)) {
                    String role = jwtUtil.extractRole(authHeader);
                    if (role == null || !role.equals("ROLE_ADMIN")) {
                        System.out.println("Access denied: User is not an admin");
                        return onError(exchange, "Forbidden: Admin access required", HttpStatus.FORBIDDEN);
                    }
                }
            } catch (Exception e) {
                System.out.println("Invalid access...!");
                return onError(exchange, "Unauthorized access to application", HttpStatus.UNAUTHORIZED);
            }
        }

        if (authHeader != null) {
            try {
                String userId = jwtUtil.extractUserId(authHeader);
                if (userId != null) {
                    exchange = exchange.mutate()
                            .request(exchange.getRequest().mutate()
                                    .headers(headers -> headers.set("X-User-Id", userId))
                                    .build())
                            .build();
                }
            } catch (Exception e) {
                if (isSecured(exchange)) {
                    return onError(exchange, "Unauthorized access to application", HttpStatus.UNAUTHORIZED);
                }
            }
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1; // Execute early in the gateway filter chain
    }

    private boolean isSecured(ServerWebExchange exchange) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/v1/cart")) {
            return true;
        }
        if (path.startsWith("/api/v1/admin")) {
            return true;
        }
        if (path.startsWith("/api/v1/orders/user/")) {
            return true;
        }
        if (path.startsWith("/api/v1/reviews") && exchange.getRequest().getMethod() != null && !exchange.getRequest().getMethod().name().equals("GET")) {
            return true;
        }
        if (path.startsWith("/api/users") || path.startsWith("/api/v1/users")) {
            return !(path.startsWith("/api/auth/") || 
                     path.startsWith("/api/users/send-otp") || 
                     path.startsWith("/api/users/verify-otp") || 
                     path.startsWith("/api/v1/users/send-otp") || 
                     path.startsWith("/api/v1/users/verify-otp") ||
                     path.startsWith("/api/v1/users/auth/") ||
                     path.startsWith("/api/v1/internal/users/"));
        }
        return false;
    }

    private boolean isAdminRoute(ServerWebExchange exchange) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/v1/admin")) {
            return true;
        }
        if (path.startsWith("/api/v1/reviews") && exchange.getRequest().getMethod() != null && !exchange.getRequest().getMethod().name().equals("GET")) {
            return true;
        }
        return false;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        exchange.getResponse().setStatusCode(httpStatus);
        return exchange.getResponse().setComplete();
    }
}
