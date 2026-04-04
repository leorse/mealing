package com.mealing.recipe.dto;

import com.mealing.recipe.RecipeEntity.Difficulty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RecipeRequest(
    @NotBlank String name,
    String description,
    @Min(1) Integer servings,
    Integer prepTimeMin,
    Integer cookTimeMin,
    Difficulty difficulty,
    String photoUrl,
    List<IngredientItem> ingredients
) {
    public record IngredientItem(UUID ingredientId, BigDecimal quantityG, String unitLabel) {}
}
