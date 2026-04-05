package com.mealing.ingredient;

import com.mealing.config.UserContext;
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
    private final UserContext userContext;

    @GetMapping
    public ResponseEntity<List<IngredientEntity>> search(@RequestParam String q) {
        return ResponseEntity.ok(ingredientService.search(q, userContext.getUserId()));
    }

    @GetMapping("/barcode/{ean}")
    public ResponseEntity<IngredientEntity> findByBarcode(@PathVariable String ean) {
        return ingredientService.findByBarcode(ean, userContext.getUserId())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IngredientEntity> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ingredientService.getById(id));
    }

    @PostMapping
    public ResponseEntity<IngredientEntity> createCustom(@RequestBody IngredientEntity ingredient) {
        return ResponseEntity.ok(ingredientService.createCustom(ingredient, userContext.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IngredientEntity> update(@PathVariable UUID id, @RequestBody IngredientEntity ingredient) {
        return ResponseEntity.ok(ingredientService.update(id, ingredient, userContext.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        ingredientService.delete(id, userContext.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/import/off")
    public ResponseEntity<List<IngredientEntity>> importFromOff(@RequestParam String q) {
        return ResponseEntity.ok(ingredientService.importFromOpenFoodFacts(q, userContext.getUserId()));
    }

    @GetMapping("/import/barcode/{ean}")
    public ResponseEntity<IngredientEntity> importByBarcode(@PathVariable String ean) {
        return ResponseEntity.ok(ingredientService.importByBarcode(ean, userContext.getUserId()));
    }
}
