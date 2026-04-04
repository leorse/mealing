package com.mealing.user.dto;

import com.mealing.user.UserProfile.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UserProfileRequest(
    String firstName,
    LocalDate birthDate,
    Gender gender,
    BigDecimal heightCm,
    BigDecimal weightKg,
    ActivityLevel activityLevel,
    Goal goal,
    Integer targetCalories,
    Integer macroProteinPct,
    Integer macroCarbsPct,
    Integer macroFatPct,
    String offUsername,
    String offPassword
) {}
