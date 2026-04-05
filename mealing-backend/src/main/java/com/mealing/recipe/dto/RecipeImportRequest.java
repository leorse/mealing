package com.mealing.recipe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeImportRequest {

    private String schema = "mealing_recipe";
    private String version = "1.0";
    private String name;
    private String description;
    private Integer servings = 1;
    private Integer prepTimeMin;
    private Integer cookTimeMin;
    private String difficulty;
    private List<String> tags;
    private List<ImportIngredient> ingredients;
    private List<String> steps;
    private NutritionOverride nutritionOverride;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ImportIngredient {
        private String tempId;
        private String name;
        private String barcode;
        private BigDecimal quantity;
        private String unit;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NutritionOverride {
        private BigDecimal calories;
        private BigDecimal proteins;
        private BigDecimal carbs;
        private BigDecimal fat;
    }
}
