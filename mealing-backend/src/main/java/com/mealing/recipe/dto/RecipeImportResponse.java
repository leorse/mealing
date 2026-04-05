package com.mealing.recipe.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RecipeImportResponse {

    public enum Status { SUCCESS, PARTIAL_SUCCESS, FAILED }

    private Status status;
    private UUID recipeId;
    private String recipeName;
    private Integer servings;
    private int resolvedCount;
    private List<UnresolvedIngredient> unresolvedIngredients;
    private List<String> warnings;

    @Data
    @Builder
    public static class UnresolvedIngredient {
        private String tempId;
        private String name;
        private String barcode;
        private String quantity;
        private String unit;
    }
}
