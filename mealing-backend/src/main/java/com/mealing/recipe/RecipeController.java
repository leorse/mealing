package com.mealing.recipe;

import com.mealing.auth.JwtService;
import com.mealing.recipe.dto.NutritionResponse;
import com.mealing.recipe.dto.RecipeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<RecipeEntity>> getAll(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(recipeService.getAll(uid(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeEntity> getById(@PathVariable UUID id, @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(recipeService.getById(id, uid(auth)));
    }

    @PostMapping
    public ResponseEntity<RecipeEntity> create(@Valid @RequestBody RecipeRequest req, @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(recipeService.create(req, uid(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipeEntity> update(@PathVariable UUID id, @Valid @RequestBody RecipeRequest req, @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(recipeService.update(id, req, uid(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @RequestHeader("Authorization") String auth) {
        recipeService.delete(id, uid(auth));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/nutrition")
    public ResponseEntity<NutritionResponse> nutrition(@PathVariable UUID id, @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(recipeService.getNutrition(id, uid(auth)));
    }

    private UUID uid(String auth) {
        return jwtService.extractUserId(auth.substring(7));
    }
}
