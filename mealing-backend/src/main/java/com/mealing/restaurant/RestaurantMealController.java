package com.mealing.restaurant;

import com.mealing.config.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class RestaurantMealController {

    private final RestaurantMealService service;
    private final UserContext userContext;

    @GetMapping("/api/restaurant-meals")
    public ResponseEntity<List<RestaurantMeal>> getAll() {
        return ResponseEntity.ok(service.getAll(userContext.getUserId()));
    }

    @GetMapping("/api/restaurant-meals/{id}")
    public ResponseEntity<RestaurantMeal> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id, userContext.getUserId()));
    }

    @PostMapping("/api/restaurant-meals")
    public ResponseEntity<RestaurantMeal> create(@RequestBody RestaurantMeal meal) {
        return ResponseEntity.ok(service.create(meal, userContext.getUserId()));
    }

    @PutMapping("/api/restaurant-meals/{id}")
    public ResponseEntity<RestaurantMeal> update(@PathVariable UUID id, @RequestBody RestaurantMeal meal) {
        return ResponseEntity.ok(service.update(id, meal, userContext.getUserId()));
    }

    @DeleteMapping("/api/restaurant-meals/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id, userContext.getUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/restaurant-meals/{id}/ingredients")
    public ResponseEntity<RestaurantMealIngredient> addIngredient(
        @PathVariable UUID id,
        @RequestBody Map<String, Object> body
    ) {
        UUID ingredientId = UUID.fromString(body.get("ingredientId").toString());
        BigDecimal quantityG = new BigDecimal(body.get("quantityG").toString());
        String unitLabel = body.get("unitLabel") != null ? body.get("unitLabel").toString() : null;
        return ResponseEntity.ok(service.addIngredient(id, userContext.getUserId(), ingredientId, quantityG, unitLabel));
    }

    @DeleteMapping("/api/restaurant-meals/{id}/ingredients/{ingredientId}")
    public ResponseEntity<Void> removeIngredient(@PathVariable UUID id, @PathVariable UUID ingredientId) {
        service.removeIngredient(id, userContext.getUserId(), ingredientId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/dish-templates")
    public ResponseEntity<List<DishTemplate>> searchTemplates(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(service.searchTemplates(q, category));
    }
}
