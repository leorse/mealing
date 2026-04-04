package com.mealing.nutrition.dto;

import java.time.LocalDate;
import java.util.List;

public record CompensationResponse(
    int totalSurplusKcal,
    List<DayAdjustment> adjustments
) {
    public record DayAdjustment(LocalDate date, int baseTarget, int adjustment, int adjustedTarget) {}
}
