package com.kicksaura.userservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AddressLimitMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("""
            DO $$
            BEGIN
                IF to_regclass('prod.user_addresses_v2') IS NOT NULL THEN
                    DELETE FROM prod.user_addresses_v2 address_row
                    USING (
                        SELECT ctid,
                               ROW_NUMBER() OVER (
                                   PARTITION BY user_uuid
                                   ORDER BY address_order ASC NULLS LAST, ctid
                               ) AS row_number
                        FROM prod.user_addresses_v2
                    ) ranked
                    WHERE address_row.ctid = ranked.ctid
                      AND ranked.row_number > 3;
                END IF;
            END $$;
            """);
    }
}
