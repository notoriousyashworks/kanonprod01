package com.kicksaura.productservice;

import com.kicksaura.productservice.entity.Product;
import com.kicksaura.productservice.entity.ProductVariant;
import com.kicksaura.productservice.repository.ProductRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("""
                DO $$
                DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (
                        SELECT conname
                        FROM pg_constraint c
                        JOIN pg_class t ON c.conrelid = t.oid
                        JOIN pg_namespace n ON t.relnamespace = n.oid
                        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
                        WHERE n.nspname = 'prod' AND t.relname = 'product_variants' AND c.contype = 'u' AND a.attname = 'sku'
                    ) LOOP
                        EXECUTE 'ALTER TABLE prod.product_variants DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE;';
                    END LOOP;
                END $$;
            """);
            log.info("DataSeeder: Successfully checked and dropped any unique constraints on product_variants.sku");
        } catch (Exception e) {
            log.warn("DataSeeder: Note while checking/dropping SKU unique constraint: {}", e.getMessage());
        }

        // Seed Size Charts for brands — one statement per execute() call
        log.info("DataSeeder: Seeding brands and size charts...");
        String[] seedSqls = {
            "INSERT INTO prod.brands (id, name, slug, is_active) SELECT gen_random_uuid(), 'Nike', 'nike', true WHERE NOT EXISTS (SELECT 1 FROM prod.brands WHERE name = 'Nike')",
            "INSERT INTO prod.brands (id, name, slug, is_active) SELECT gen_random_uuid(), 'Adidas', 'adidas', true WHERE NOT EXISTS (SELECT 1 FROM prod.brands WHERE name = 'Adidas')",
            "INSERT INTO prod.brands (id, name, slug, is_active) SELECT gen_random_uuid(), 'New Balance', 'new-balance', true WHERE NOT EXISTS (SELECT 1 FROM prod.brands WHERE name = 'New Balance')",
            "INSERT INTO prod.brands (id, name, slug, is_active) SELECT gen_random_uuid(), 'Crocs', 'crocs', true WHERE NOT EXISTS (SELECT 1 FROM prod.brands WHERE name = 'Crocs')",
            "INSERT INTO prod.brands (id, name, slug, is_active) SELECT gen_random_uuid(), 'On Cloud', 'on-cloud', true WHERE NOT EXISTS (SELECT 1 FROM prod.brands WHERE name = 'On Cloud')",
            "INSERT INTO prod.brands (id, name, slug, is_active) SELECT gen_random_uuid(), 'Onitsuka Tiger', 'onitsuka-tiger', true WHERE NOT EXISTS (SELECT 1 FROM prod.brands WHERE name = 'Onitsuka Tiger')",
            "INSERT INTO prod.size_charts (id, brand_id, image_url) SELECT gen_random_uuid(), b.id, 'https://res.cloudinary.com/mlqzybno/image/upload/v1785613136/q9lfxikjoofvfndbt677.png' FROM prod.brands b WHERE b.name ILIKE 'Nike' AND NOT EXISTS (SELECT 1 FROM prod.size_charts sc WHERE sc.brand_id = b.id)",
            "INSERT INTO prod.size_charts (id, brand_id, image_url) SELECT gen_random_uuid(), b.id, 'https://res.cloudinary.com/mlqzybno/image/upload/v1785613133/gcs2t93bitei3b71mmuh.png' FROM prod.brands b WHERE b.name ILIKE 'Adidas' AND NOT EXISTS (SELECT 1 FROM prod.size_charts sc WHERE sc.brand_id = b.id)",
            "INSERT INTO prod.size_charts (id, brand_id, image_url) SELECT gen_random_uuid(), b.id, 'https://res.cloudinary.com/mlqzybno/image/upload/v1785613135/nrqb34b95pezcdsls22m.png' FROM prod.brands b WHERE b.name ILIKE 'New Balance' AND NOT EXISTS (SELECT 1 FROM prod.size_charts sc WHERE sc.brand_id = b.id)",
            "INSERT INTO prod.size_charts (id, brand_id, image_url) SELECT gen_random_uuid(), b.id, 'https://res.cloudinary.com/mlqzybno/image/upload/v1785613134/jucb6bbnd296obvlp9ly.png' FROM prod.brands b WHERE b.name ILIKE 'Crocs' AND NOT EXISTS (SELECT 1 FROM prod.size_charts sc WHERE sc.brand_id = b.id)",
            "INSERT INTO prod.size_charts (id, brand_id, image_url) SELECT gen_random_uuid(), b.id, 'https://res.cloudinary.com/mlqzybno/image/upload/v1785613137/pj3bhrrw1tfw5w2hwagh.png' FROM prod.brands b WHERE b.name ILIKE 'On Cloud' AND NOT EXISTS (SELECT 1 FROM prod.size_charts sc WHERE sc.brand_id = b.id)",
            "INSERT INTO prod.size_charts (id, brand_id, image_url) SELECT gen_random_uuid(), b.id, 'https://res.cloudinary.com/mlqzybno/image/upload/v1785613138/egelsonpsgaazbqptkno.png' FROM prod.brands b WHERE b.name ILIKE 'Onitsuka Tiger' AND NOT EXISTS (SELECT 1 FROM prod.size_charts sc WHERE sc.brand_id = b.id)"
        };
        for (String sql : seedSqls) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                log.warn("DataSeeder: Skipping statement due to error: {}", e.getMessage());
            }
        }
        log.info("DataSeeder: Brands and size charts seeding complete.");

        log.info("DataSeeder: skipping seed — disabled.");
    }
}
