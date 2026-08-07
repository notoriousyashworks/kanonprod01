package com.kicksaura.productservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrigramIndexConfig {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void setupTrigramIndex() {
        log.info("Checking and setting up PostgreSQL Trigram Index for product searches...");
        try {
            // 1. Enable the extension (gives Postgres the trigram superpower)
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
            
            // 2. Create the index on all fields used in the search
            String createIndexSql = "CREATE INDEX IF NOT EXISTS idx_products_search_trgm " +
                                    "ON products USING GIN (" +
                                    "search_name gin_trgm_ops, " +
                                    "search_brand gin_trgm_ops, " +
                                    "search_text gin_trgm_ops, " +
                                    "category gin_trgm_ops);";
            
            jdbcTemplate.execute(createIndexSql);
            log.info("Trigram index is successfully configured and active.");
        } catch (Exception e) {
            log.warn("Failed to create trigram index automatically. This is normal if you are running tests in H2 database instead of PostgreSQL. Error: {}", e.getMessage());
        }
    }
}
