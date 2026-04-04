package com.mealing.mealplan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface WeekPlanRepository extends JpaRepository<WeekPlan, UUID> {
    Optional<WeekPlan> findByUserIdAndWeekStart(UUID userId, LocalDate weekStart);
    Optional<WeekPlan> findByIdAndUserId(UUID id, UUID userId);
}
