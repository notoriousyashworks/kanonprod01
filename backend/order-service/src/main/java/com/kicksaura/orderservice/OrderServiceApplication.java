package com.kicksaura.orderservice;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.TimeZone;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class OrderServiceApplication {

	private static final Logger log = LoggerFactory.getLogger(OrderServiceApplication.class);

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
	}

	public static void main(String[] args) {
		SpringApplication.run(OrderServiceApplication.class, args);
	}

	@Bean
	CommandLineRunner fixForeignKeys(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				String constraintName = jdbcTemplate.queryForObject(
						"SELECT constraint_name FROM information_schema.key_column_usage " +
						"WHERE table_name = 'order_items' AND column_name = 'order_id' LIMIT 1", String.class);
				
				if (constraintName != null) {
					log.info("Found foreign key constraint on order_items: {}", constraintName);
					try {
						jdbcTemplate.execute("ALTER TABLE order_items DROP CONSTRAINT " + constraintName);
						jdbcTemplate.execute("ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE");
						log.info("Successfully updated order_items foreign key to ON DELETE CASCADE");
					} catch (Exception e) {
						log.warn("Could not update foreign key: {}", e.getMessage());
					}
				}
			} catch (Exception e) {
				log.warn("Could not find foreign key constraint for order_items: {}", e.getMessage());
			}
		};
	}
}
