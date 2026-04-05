package com.mealing.recipe;

import com.mealing.config.UserContext;
import com.mealing.recipe.dto.NutritionResponse;
import com.mealing.recipe.dto.RecipeImportResponse;
import com.mealing.recipe.dto.RecipeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;
    private final RecipeImportService recipeImportService;
    private final UserContext userContext;

    @GetMapping
    public ResponseEntity<List<RecipeEntity>> getAll() {
        return ResponseEntity.ok(recipeService.getAll(userContext.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeEntity> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(recipeService.getById(id, userContext.getUserId()));
    }

    @PostMapping
    public ResponseEntity<RecipeEntity> create(@Valid @RequestBody RecipeRequest req) {
        return ResponseEntity.ok(recipeService.create(req, userContext.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipeEntity> update(@PathVariable UUID id, @Valid @RequestBody RecipeRequest req) {
        return ResponseEntity.ok(recipeService.update(id, req, userContext.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        recipeService.delete(id, userContext.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/nutrition")
    public ResponseEntity<NutritionResponse> nutrition(@PathVariable UUID id) {
        return ResponseEntity.ok(recipeService.getNutrition(id, userContext.getUserId()));
    }

    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public ResponseEntity<RecipeImportResponse> importRecipe(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "overwrite", defaultValue = "false") boolean overwrite
    ) {
        return ResponseEntity.ok(recipeImportService.importFromJson(file, overwrite, userContext.getUserId()));
    }
}
