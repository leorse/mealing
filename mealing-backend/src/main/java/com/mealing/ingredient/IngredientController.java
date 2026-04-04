package com.mealing.ingredient;

import com.mealing.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
public class IngredientController {

    private final IngredientService ingredientService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<IngredientEntity>> search(
        @RequestParam String q,
        @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(ingredientService.search(q, userId));
    }

    @GetMapping("/barcode/{ean}")
    public ResponseEntity<IngredientEntity> findByBarcode(
        @PathVariable String ean,
        @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = extractUserId(authHeader);
        return ingredientService.findByBarcode(ean, userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IngredientEntity> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ingredientService.getById(id));
    }

    @PostMapping
    public ResponseEntity<IngredientEntity> createCustom(
        @RequestBody IngredientEntity ingredient,
        @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(ingredientService.createCustom(ingredient, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IngredientEntity> update(
        @PathVariable UUID id,
        @RequestBody IngredientEntity ingredient,
        @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(ingredientService.update(id, ingredient, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @PathVariable UUID id,
        @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = extractUserId(authHeader);
        ingredientService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/import/off")
    public ResponseEntity<List<IngredientEntity>> importFromOff(
        @RequestParam String q,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(ingredientService.importFromOpenFoodFacts(q, extractUserId(auth)));
    }

    @GetMapping("/import/barcode/{ean}")
    public ResponseEntity<IngredientEntity> importByBarcode(
        @PathVariable String ean,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(ingredientService.importByBarcode(ean, extractUserId(auth)));
    }

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }
}
