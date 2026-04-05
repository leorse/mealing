package com.mealing.preparedmeal;

import com.mealing.config.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prepared-meals")
@RequiredArgsConstructor
public class PreparedMealController {

    private final PreparedMealService service;
    private final UserContext userContext;

    @GetMapping
    public ResponseEntity<List<PreparedMeal>> getAll() {
        return ResponseEntity.ok(service.getAll(userContext.getUserId()));
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<PreparedMeal>> getFavorites() {
        return ResponseEntity.ok(service.getFavorites(userContext.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PreparedMeal> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id, userContext.getUserId()));
    }

    @PostMapping
    public ResponseEntity<PreparedMeal> create(@RequestBody PreparedMeal meal) {
        return ResponseEntity.ok(service.create(meal, userContext.getUserId()));
    }

    @PostMapping("/from-barcode/{ean}")
    public ResponseEntity<PreparedMeal> createFromBarcode(@PathVariable String ean) {
        return ResponseEntity.ok(service.createFromBarcode(ean, userContext.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PreparedMeal> update(@PathVariable UUID id, @RequestBody PreparedMeal meal) {
        return ResponseEntity.ok(service.update(id, meal, userContext.getUserId()));
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<PreparedMeal> toggleFavorite(@PathVariable UUID id) {
        return ResponseEntity.ok(service.toggleFavorite(id, userContext.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id, userContext.getUserId());
        return ResponseEntity.noContent().build();
    }
}
