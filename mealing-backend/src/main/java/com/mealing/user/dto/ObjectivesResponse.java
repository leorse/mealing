package com.mealing.user.dto;

public record ObjectivesResponse(
    double bmr,
    double tdee,
    int targetCalories,
    int targetProteinG,
    int targetCarbsG,
    int targetFatG
) {}
