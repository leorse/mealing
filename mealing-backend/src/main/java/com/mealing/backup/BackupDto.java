package com.mealing.backup;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BackupDto(
    String version,
    String exportedAt,
    ProfileDto profile,
    List<IngredientDto> customIngredients,
    List<RecipeDto> recipes,
    List<PreparedMealDto> preparedMeals,
    List<WeekPlanDto> weekPlans,
    List<MealExtraDto> mealExtras,
    List<RestaurantMealDto> restaurantMeals,
    List<DeviationDto> deviations
) {

    public record ProfileDto(
        UUID id,
        String firstName,
        LocalDate birthDate,
        String gender,
        BigDecimal heightCm,
        BigDecimal weightKg,
        String activityLevel,
        String goal,
        Integer targetCalories,
        Integer macroProteinPct,
        Integer macroCarbsPct,
        Integer macroFatPct
    ) {}

    public record IngredientDto(
        UUID id,
        String name,
        String brand,
        String barcode,
        String category,
        BigDecimal calories100g,
        BigDecimal proteins100g,
        BigDecimal carbs100g,
        BigDecimal sugars100g,
        BigDecimal fat100g,
        BigDecimal saturatedFat100g,
        BigDecimal fiber100g,
        BigDecimal salt100g,
        Integer glycemicIndex,
        String nutriScore
    ) {}

    public record RecipeDto(
        UUID id,
        String name,
        String description,
        Integer servings,
        Integer prepTimeMin,
        Integer cookTimeMin,
        String difficulty,
        Boolean isHealthy,
        String tags,
        List<RecipeIngredientDto> ingredients
    ) {}

    public record RecipeIngredientDto(
        UUID id,
        UUID ingredientId,
        BigDecimal quantityG,
        String unitLabel
    ) {}

    public record PreparedMealDto(
        UUID id,
        String name,
        String brand,
        String barcode,
        String nutriScore,
        BigDecimal caloriesPortion,
        BigDecimal proteinsG,
        BigDecimal carbsG,
        BigDecimal fatG,
        BigDecimal fiberG,
        String portionLabel,
        String offId,
        Boolean isFavorite
    ) {}

    public record WeekPlanDto(
        UUID id,
        LocalDate weekStart,
        String notes,
        List<MealSlotDto> slots
    ) {}

    public record MealSlotDto(
        UUID id,
        LocalDate slotDate,
        String mealType,
        UUID recipeId,
        String freeLabel,
        BigDecimal portions,
        Boolean isDeviation,
        Integer caloriesOverride,
        Boolean isConsumed,
        LocalDateTime consumedAt,
        UUID preparedMealId,
        BigDecimal preparedMealPortions,
        String sourceType
    ) {}

    public record MealExtraDto(
        UUID id,
        UUID mealSlotId,
        String label,
        String extraType,
        UUID ingredientId,
        BigDecimal quantityG,
        UUID preparedMealId,
        BigDecimal portions,
        BigDecimal caloriesFree,
        BigDecimal proteinsFree,
        BigDecimal carbsFree,
        BigDecimal fatFree,
        LocalDateTime addedAt
    ) {}

    public record RestaurantMealDto(
        UUID id,
        String restaurantName,
        String restaurantType,
        String dishName,
        String dishNotes,
        String estimationMethod,
        BigDecimal caloriesFree,
        BigDecimal proteinsFree,
        BigDecimal carbsFree,
        BigDecimal fatFree,
        String portionSize,
        BigDecimal totalCalories,
        BigDecimal totalProteins,
        BigDecimal totalCarbs,
        BigDecimal totalFat,
        Boolean isDeviation,
        UUID originalSlotId,
        LocalDateTime createdAt,
        List<RestaurantIngredientDto> ingredients
    ) {}

    public record RestaurantIngredientDto(
        UUID id,
        UUID ingredientId,
        BigDecimal quantityG,
        String unitLabel,
        Boolean isEstimated
    ) {}

    public record DeviationDto(
        UUID id,
        LocalDate deviationDate,
        UUID mealSlotId,
        String type,
        String label,
        Integer caloriesExtra,
        Integer compensationSpread,
        String notes,
        LocalDateTime createdAt
    ) {}
}
