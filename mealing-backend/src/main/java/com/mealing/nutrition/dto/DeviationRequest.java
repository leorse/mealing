package com.mealing.nutrition.dto;

import com.mealing.nutrition.Deviation.DeviationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.UUID;

public record DeviationRequest(
    @NotNull LocalDate deviationDate,
    UUID mealSlotId,
    @NotNull DeviationType type,
    String label,
    @NotNull @Positive Integer caloriesExtra,
    Integer compensationSpread,
    String notes
) {}
