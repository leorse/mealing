package com.mealing.mealextra;

import com.mealing.ingredient.IngredientEntity;
import com.mealing.ingredient.IngredientRepository;
import com.mealing.preparedmeal.PreparedMeal;
import com.mealing.preparedmeal.PreparedMealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MealExtraService {

    private final MealExtraRepository extraRepository;
    private final IngredientRepository ingredientRepository;
    private final PreparedMealRepository preparedMealRepository;

    public List<MealExtra> getExtras(UUID slotId) {
        return extraRepository.findByMealSlotIdOrderByAddedAtAsc(slotId);
    }

    @Transactional
    public MealExtra addExtra(UUID slotId, MealExtra extra) {
        extra.setMealSlotId(slotId);
        return extraRepository.save(extra);
    }

    @Transactional
    public MealExtra updateExtra(UUID slotId, UUID extraId, MealExtra updated) {
        MealExtra existing = extraRepository.findById(extraId)
            .filter(e -> e.getMealSlotId().equals(slotId))
            .orElseThrow(() -> new IllegalArgumentException("Extra non trouvé"));
        updated.setId(extraId);
        updated.setMealSlotId(slotId);
        return extraRepository.save(updated);
    }

    @Transactional
    public void deleteExtra(UUID slotId, UUID extraId) {
        MealExtra extra = extraRepository.findById(extraId)
            .filter(e -> e.getMealSlotId().equals(slotId))
            .orElseThrow(() -> new IllegalArgumentException("Extra non trouvé"));
        extraRepository.delete(extra);
    }

    /** Calcule le total nutritionnel d'un créneau : plat principal + tous les extras */
    public NutritionTotal getNutritionTotal(UUID slotId, BigDecimal slotCalories,
                                            BigDecimal slotProteins, BigDecimal slotCarbs, BigDecimal slotFat) {
        List<MealExtra> extras = extraRepository.findByMealSlotIdOrderByAddedAtAsc(slotId);

        BigDecimal totalCal = slotCalories != null ? slotCalories : BigDecimal.ZERO;
        BigDecimal totalProt = slotProteins != null ? slotProteins : BigDecimal.ZERO;
        BigDecimal totalCarbs = slotCarbs != null ? slotCarbs : BigDecimal.ZERO;
        BigDecimal totalFat = slotFat != null ? slotFat : BigDecimal.ZERO;

        for (MealExtra e : extras) {
            BigDecimal[] nutrition = computeExtraNutrition(e);
            totalCal = totalCal.add(nutrition[0]);
            totalProt = totalProt.add(nutrition[1]);
            totalCarbs = totalCarbs.add(nutrition[2]);
            totalFat = totalFat.add(nutrition[3]);
        }

        return new NutritionTotal(totalCal, totalProt, totalCarbs, totalFat, extras.size());
    }

    private BigDecimal[] computeExtraNutrition(MealExtra e) {
        // Option C : saisie libre
        if (e.getCaloriesFree() != null) {
            return new BigDecimal[]{
                e.getCaloriesFree(),
                orZero(e.getProteinsFree()),
                orZero(e.getCarbsFree()),
                orZero(e.getFatFree())
            };
        }
        // Option B : plat préparé
        if (e.getPreparedMealId() != null) {
            return preparedMealRepository.findById(e.getPreparedMealId())
                .map(pm -> {
                    BigDecimal p = orZero(e.getPortions());
                    return new BigDecimal[]{
                        pm.getCaloriesPortion().multiply(p),
                        orZero(pm.getProteinsG()).multiply(p),
                        orZero(pm.getCarbsG()).multiply(p),
                        orZero(pm.getFatG()).multiply(p)
                    };
                }).orElse(zeros());
        }
        // Option A : ingrédient
        if (e.getIngredientId() != null && e.getQuantityG() != null) {
            return ingredientRepository.findById(e.getIngredientId())
                .map(ing -> {
                    BigDecimal factor = e.getQuantityG().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
                    return new BigDecimal[]{
                        ing.getCalories100g().multiply(factor),
                        orZero(ing.getProteins100g()).multiply(factor),
                        orZero(ing.getCarbs100g()).multiply(factor),
                        orZero(ing.getFat100g()).multiply(factor)
                    };
                }).orElse(zeros());
        }
        return zeros();
    }

    private BigDecimal orZero(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
    private BigDecimal[] zeros() { return new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO}; }

    public record NutritionTotal(BigDecimal calories, BigDecimal proteins,
                                  BigDecimal carbs, BigDecimal fat, int extrasCount) {}
}
