package com.kicksaura.userservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// @Component // Removed to prevent N+1 delete on startup (RISK-10)
// @RequiredArgsConstructor
public class AddressLimitMigration {
    // Migration disabled.
}
