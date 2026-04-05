package com.mealing.ingredient;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenFoodFactsClient {

    private final WebClient openFoodFactsWebClient;

    public List<IngredientEntity> search(String query, String username, String password) {
        try {
            OFFSearchResponse response = openFoodFactsWebClient.get()
                .uri(uriBuilder -> {
                    var uri = uriBuilder
                        .path("/search")
                        .queryParam("search_terms", query)
                        .queryParam("fields", "code,product_name,product_name_fr,product_name_en,brands,nutriments,nutriscore_grade")
                        .queryParam("page_size", "25")
                        .queryParam("json", "1")
                        .queryParam("lc", "fr")
                        .build();
                    boolean hasUser = username != null && !username.isBlank();
                    boolean hasPass = password != null && !password.isBlank();
                    log.info("[OFF] GET {} | user={} pass={}", uri,
                        hasUser ? username : "ABSENT",
                        hasPass ? "SET" : "ABSENT/VIDE");
                    return uri;
                })
                .headers(h -> addBasicAuth(h, username, password))
                .retrieve()
                .onStatus(HttpStatusCode::is5xxServerError, resp ->
                    resp.bodyToMono(String.class).map(body ->
                        new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "Open Food Facts indisponible (" + resp.statusCode().value() + "). Réessayez dans quelques instants.")))
                .onStatus(HttpStatusCode::is4xxClientError, resp ->
                    resp.bodyToMono(String.class).map(body ->
                        new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "Erreur lors de la requête Open Food Facts (" + resp.statusCode().value() + ").")))
                .bodyToMono(OFFSearchResponse.class)
                .block();

            if (response == null || response.getProducts() == null) return List.of();

            return response.getProducts().stream()
                .filter(p -> p.getBestName() != null)
                .map(this::mapToIngredient)
                .toList();
        } catch (ResponseStatusException e) {
            throw e; // propagée telle quelle vers le contrôleur
        } catch (Exception e) {
            log.warn("Erreur Open Food Facts search: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Impossible de contacter Open Food Facts : " + e.getMessage());
        }
    }

    // Surcharge sans credentials (appels internes)
    public List<IngredientEntity> search(String query) {
        return search(query, null, null);
    }

    public Optional<IngredientEntity> findByBarcode(String ean, String username, String password) {
        try {
            OFFProductWrapper response = openFoodFactsWebClient.get()
                .uri("/product/" + ean + ".json")
                .headers(h -> addBasicAuth(h, username, password))
                .retrieve()
                .onStatus(HttpStatusCode::is5xxServerError, resp ->
                    resp.bodyToMono(String.class).map(body ->
                        new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "Open Food Facts indisponible (" + resp.statusCode().value() + ").")))
                .bodyToMono(OFFProductWrapper.class)
                .block();

            if (response == null || response.getProduct() == null) return Optional.empty();
            return Optional.of(mapToIngredient(response.getProduct()));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Erreur Open Food Facts barcode {}: {}", ean, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Impossible de contacter Open Food Facts : " + e.getMessage());
        }
    }

    public Optional<IngredientEntity> findByBarcode(String ean) {
        return findByBarcode(ean, null, null);
    }

    private void addBasicAuth(HttpHeaders headers, String username, String password) {
        if (username != null && !username.isBlank() && password != null && !password.isBlank()) {
            String credentials = username + ":" + password;
            String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
            headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encoded);
        }
    }

    private IngredientEntity mapToIngredient(OFFProduct p) {
        Map<String, Object> n = p.getNutriments();
        return IngredientEntity.builder()
            .name(p.getBestName() != null ? p.getBestName() : "Inconnu")
            .brand(p.getBrands())
            .barcode(p.getCode())
            .offId(p.getCode())
            .calories100g(getBigDecimal(n, "energy-kcal_100g"))
            .proteins100g(getBigDecimal(n, "proteins_100g"))
            .carbs100g(getBigDecimal(n, "carbohydrates_100g"))
            .sugars100g(getBigDecimal(n, "sugars_100g"))
            .fat100g(getBigDecimal(n, "fat_100g"))
            .saturatedFat100g(getBigDecimal(n, "saturated-fat_100g"))
            .fiber100g(getBigDecimal(n, "fiber_100g"))
            .salt100g(getBigDecimal(n, "salt_100g"))
            .nutriScore(p.getNutriscoreGrade() != null ? p.getNutriscoreGrade().toUpperCase() : null)
            .isCustom(false)
            .build();
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key)) return BigDecimal.ZERO;
        try {
            return new BigDecimal(map.get(key).toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    static class OFFSearchResponse {
        private List<OFFProduct> products;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    static class OFFProductWrapper {
        private OFFProduct product;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    static class OFFProduct {
        private String code;
        @JsonProperty("product_name") private String productName;
        @JsonProperty("product_name_fr") private String productNameFr;
        @JsonProperty("product_name_en") private String productNameEn;
        private String brands;
        private Map<String, Object> nutriments;
        @JsonProperty("nutriscore_grade") private String nutriscoreGrade;

        public String getBestName() {
            if (productName != null && !productName.isBlank()) return productName;
            if (productNameFr != null && !productNameFr.isBlank()) return productNameFr;
            if (productNameEn != null && !productNameEn.isBlank()) return productNameEn;
            return null;
        }
    }
}
