package com.kicksaura.productservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomerReviewSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.customer_reviews ALTER COLUMN product_id DROP NOT NULL");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.customer_reviews ALTER COLUMN user_id DROP NOT NULL");
    }
}
