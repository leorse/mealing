package com.mealing.mealplan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MealSlotRepository extends JpaRepository<MealSlot, UUID> {
    Optional<MealSlot> findByIdAndWeekPlanUserId(UUID id, UUID userId);
    List<MealSlot> findBySlotDateAndWeekPlanUserId(LocalDate slotDate, UUID userId);
}
