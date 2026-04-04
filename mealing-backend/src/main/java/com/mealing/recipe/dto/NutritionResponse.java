package com.mealing.recipe.dto;

public record NutritionResponse(
    double totalCalories,
    double totalProteins,
    double totalCarbs,
    double totalFat,
    double totalFiber,
    double caloriesPerServing,
    double proteinsPerServing,
    double carbsPerServing,
    double fatPerServing,
    double fiberPerServing,
    boolean isHealthy
) {}
