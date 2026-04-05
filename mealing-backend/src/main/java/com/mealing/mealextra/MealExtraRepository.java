package com.mealing.mealextra;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MealExtraRepository extends JpaRepository<MealExtra, UUID> {
    List<MealExtra> findByMealSlotIdOrderByAddedAtAsc(UUID mealSlotId);
    void deleteByMealSlotId(UUID mealSlotId);
}
