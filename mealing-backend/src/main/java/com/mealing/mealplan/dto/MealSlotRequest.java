package com.mealing.mealplan.dto;

import com.mealing.mealplan.MealSlot.MealType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MealSlotRequest(
    @NotNull LocalDate slotDate,
    @NotNull MealType mealType,
    UUID recipeId,
    String freeLabel,
    BigDecimal portions,
    Boolean isDeviation,
    Integer caloriesOverride
) {}
