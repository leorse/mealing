package com.mealing.mealextra;

import com.mealing.config.UserContext;
import com.mealing.mealplan.MealPlanService;
import com.mealing.mealplan.MealSlot;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/meal-slots/{slotId}")
@RequiredArgsConstructor
public class MealExtraController {

    private final MealExtraService extraService;
    private final MealPlanService mealPlanService;
    private final UserContext userContext;

    @GetMapping("/extras")
    public ResponseEntity<List<MealExtra>> getExtras(@PathVariable UUID slotId) {
        return ResponseEntity.ok(extraService.getExtras(slotId));
    }

    @PostMapping("/extras")
    public ResponseEntity<MealExtra> addExtra(@PathVariable UUID slotId, @RequestBody MealExtra extra) {
        return ResponseEntity.ok(extraService.addExtra(slotId, extra));
    }

    @PutMapping("/extras/{extraId}")
    public ResponseEntity<MealExtra> updateExtra(
        @PathVariable UUID slotId,
        @PathVariable UUID extraId,
        @RequestBody MealExtra extra
    ) {
        return ResponseEntity.ok(extraService.updateExtra(slotId, extraId, extra));
    }

    @DeleteMapping("/extras/{extraId}")
    public ResponseEntity<Void> deleteExtra(@PathVariable UUID slotId, @PathVariable UUID extraId) {
        extraService.deleteExtra(slotId, extraId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/nutrition-total")
    public ResponseEntity<MealExtraService.NutritionTotal> nutritionTotal(@PathVariable UUID slotId) {
        MealSlot slot = mealPlanService.getSlotById(slotId, userContext.getUserId());

        BigDecimal slotCal = null, slotProt = null, slotCarbs = null, slotFat = null;
        if (slot.getRecipe() != null) {
            var nutrition = mealPlanService.getSlotNutrition(slot);
            slotCal = nutrition.calories();
            slotProt = nutrition.proteins();
            slotCarbs = nutrition.carbs();
            slotFat = nutrition.fat();
        } else if (slot.getPreparedMeal() != null) {
            var pm = slot.getPreparedMeal();
            BigDecimal portions = slot.getPreparedMealPortions() != null ? slot.getPreparedMealPortions() : BigDecimal.ONE;
            slotCal = pm.getCaloriesPortion().multiply(portions);
            slotProt = pm.getProteinsG() != null ? pm.getProteinsG().multiply(portions) : null;
            slotCarbs = pm.getCarbsG() != null ? pm.getCarbsG().multiply(portions) : null;
            slotFat = pm.getFatG() != null ? pm.getFatG().multiply(portions) : null;
        }

        return ResponseEntity.ok(extraService.getNutritionTotal(slotId, slotCal, slotProt, slotCarbs, slotFat));
    }
}
