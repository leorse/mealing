package com.mealing.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${mealing.open-food-facts.base-url}")
    private String offBaseUrl;

    @Value("${mealing.open-food-facts.timeout}")
    private int timeout;

    @Bean
    public WebClient openFoodFactsWebClient() {
        return WebClient.builder()
            .baseUrl(offBaseUrl)
            .defaultHeader("User-Agent", "Mealing/1.0 (contact@mealing.app)")
            .build();
    }
}
