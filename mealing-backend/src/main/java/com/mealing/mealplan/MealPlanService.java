package com.mealing.mealplan;

import com.mealing.mealplan.dto.MealSlotRequest;
import com.mealing.recipe.RecipeEntity;
import com.mealing.recipe.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MealPlanService {

    private final WeekPlanRepository weekPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final RecipeRepository recipeRepository;

    public WeekPlan getWeekPlan(LocalDate weekStart, UUID userId) {
        return weekPlanRepository.findByUserIdAndWeekStart(userId, weekStart)
            .orElseGet(() -> createWeekPlan(weekStart, userId));
    }

    @Transactional
    public WeekPlan createWeekPlan(LocalDate weekStart, UUID userId) {
        return weekPlanRepository.save(WeekPlan.builder()
            .userId(userId)
            .weekStart(weekStart)
            .slots(new ArrayList<>())
            .build());
    }

    @Transactional
    public MealSlot addSlot(UUID planId, MealSlotRequest req, UUID userId) {
        WeekPlan plan = weekPlanRepository.findByIdAndUserId(planId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Planning non trouvé"));

        RecipeEntity recipe = null;
        if (req.recipeId() != null) {
            recipe = recipeRepository.findByIdAndUserId(req.recipeId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Recette non trouvée"));
        }

        MealSlot slot = MealSlot.builder()
            .weekPlan(plan)
            .slotDate(req.slotDate())
            .mealType(req.mealType())
            .recipe(recipe)
            .freeLabel(req.freeLabel())
            .portions(req.portions())
            .isDeviation(req.isDeviation() != null ? req.isDeviation() : false)
            .caloriesOverride(req.caloriesOverride())
            .isConsumed(false)
            .build();

        return mealSlotRepository.save(slot);
    }

    @Transactional
    public MealSlot updateSlot(UUID slotId, MealSlotRequest req, UUID userId) {
        MealSlot slot = mealSlotRepository.findByIdAndWeekPlanUserId(slotId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Créneau non trouvé"));

        if (req.recipeId() != null) {
            RecipeEntity recipe = recipeRepository.findByIdAndUserId(req.recipeId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Recette non trouvée"));
            slot.setRecipe(recipe);
        }
        if (req.freeLabel() != null) slot.setFreeLabel(req.freeLabel());
        if (req.portions() != null) slot.setPortions(req.portions());
        if (req.isDeviation() != null) slot.setIsDeviation(req.isDeviation());
        if (req.caloriesOverride() != null) slot.setCaloriesOverride(req.caloriesOverride());

        return mealSlotRepository.save(slot);
    }

    @Transactional
    public void deleteSlot(UUID slotId, UUID userId) {
        MealSlot slot = mealSlotRepository.findByIdAndWeekPlanUserId(slotId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Créneau non trouvé"));
        mealSlotRepository.delete(slot);
    }

    @Transactional
    public MealSlot markConsumed(UUID slotId, UUID userId) {
        MealSlot slot = mealSlotRepository.findByIdAndWeekPlanUserId(slotId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Créneau non trouvé"));
        slot.setIsConsumed(true);
        slot.setConsumedAt(LocalDateTime.now());
        return mealSlotRepository.save(slot);
    }

    @Transactional
    public WeekPlan copyWeek(UUID planId, LocalDate targetWeekStart, UUID userId) {
        WeekPlan source = weekPlanRepository.findByIdAndUserId(planId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Planning non trouvé"));

        WeekPlan target = weekPlanRepository.findByUserIdAndWeekStart(userId, targetWeekStart)
            .orElseGet(() -> weekPlanRepository.save(WeekPlan.builder()
                .userId(userId)
                .weekStart(targetWeekStart)
                .slots(new ArrayList<>())
                .build()));

        long dayOffset = targetWeekStart.toEpochDay() - source.getWeekStart().toEpochDay();

        for (MealSlot slot : source.getSlots()) {
            MealSlot copy = MealSlot.builder()
                .weekPlan(target)
                .slotDate(slot.getSlotDate().plusDays(dayOffset))
                .mealType(slot.getMealType())
                .recipe(slot.getRecipe())
                .freeLabel(slot.getFreeLabel())
                .portions(slot.getPortions())
                .isDeviation(false)
                .isConsumed(false)
                .build();
            target.getSlots().add(copy);
        }

        return weekPlanRepository.save(target);
    }
}
