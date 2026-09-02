package com.kicksaura.productservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "bunny.storage")
public class BunnyStorageConfig {
    private String zone;
    private String apiKey;
    private String host;
    private String cdnBaseUrl;
}
