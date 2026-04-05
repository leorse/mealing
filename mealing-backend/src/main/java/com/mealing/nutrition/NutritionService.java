package com.mealing.nutrition;

import com.mealing.mealplan.MealSlot;
import com.mealing.mealplan.MealSlotRepository;
import com.mealing.nutrition.dto.CompensationResponse;
import com.mealing.nutrition.dto.DeviationRequest;
import com.mealing.recipe.RecipeIngredient;
import com.mealing.user.UserProfile;
import com.mealing.user.UserProfileRepository;
import com.mealing.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final DailyLogRepository dailyLogRepository;
    private final DeviationRepository deviationRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserService userService;
    private final MealSlotRepository mealSlotRepository;

    public DailyLog getDailyLog(LocalDate date, UUID userId) {
        DailyLog log = dailyLogRepository.findByUserIdAndLogDate(userId, date)
            .orElseGet(() -> {
                DailyLog l = new DailyLog();
                l.setUserId(userId);
                l.setLogDate(date);
                return l;
            });

        // Calcul automatique depuis les slots du planning pour cette date
        computeFromSlots(log, date, userId);
        return log;
    }

    private void computeFromSlots(DailyLog log, LocalDate date, UUID userId) {
        List<MealSlot> slots = mealSlotRepository.findBySlotDateAndWeekPlanUserId(date, userId);
        if (slots.isEmpty()) return;

        BigDecimal cal = BigDecimal.ZERO, prot = BigDecimal.ZERO,
                   carbs = BigDecimal.ZERO, fat = BigDecimal.ZERO, fiber = BigDecimal.ZERO;

        for (MealSlot slot : slots) {
            SlotNutrition sn = computeSlotNutrition(slot);
            cal   = cal.add(sn.calories);
            prot  = prot.add(sn.proteins);
            carbs = carbs.add(sn.carbs);
            fat   = fat.add(sn.fat);
            fiber = fiber.add(sn.fiber);
        }

        log.setTotalCalories(cal.setScale(1, RoundingMode.HALF_UP));
        log.setTotalProteins(prot.setScale(1, RoundingMode.HALF_UP));
        log.setTotalCarbs(carbs.setScale(1, RoundingMode.HALF_UP));
        log.setTotalFat(fat.setScale(1, RoundingMode.HALF_UP));
        log.setTotalFiber(fiber.setScale(1, RoundingMode.HALF_UP));
    }

    private record SlotNutrition(BigDecimal calories, BigDecimal proteins,
                                  BigDecimal carbs, BigDecimal fat, BigDecimal fiber) {}

    private SlotNutrition computeSlotNutrition(MealSlot slot) {
        // Recette
        if (slot.getRecipe() != null) {
            BigDecimal portions = slot.getPortions() != null ? slot.getPortions() : BigDecimal.ONE;
            int servings = slot.getRecipe().getServings() != null ? slot.getRecipe().getServings() : 1;
            BigDecimal factor = portions.divide(BigDecimal.valueOf(servings), 6, RoundingMode.HALF_UP);

            BigDecimal cal = BigDecimal.ZERO, prot = BigDecimal.ZERO,
                       carbs = BigDecimal.ZERO, fat = BigDecimal.ZERO, fiber = BigDecimal.ZERO;
            for (RecipeIngredient ri : slot.getRecipe().getIngredients()) {
                if (ri.getIngredient() == null || ri.getQuantityG() == null) continue;
                BigDecimal q = ri.getQuantityG()
                    .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                    .multiply(factor);
                cal   = cal.add(orZero(ri.getIngredient().getCalories100g()).multiply(q));
                prot  = prot.add(orZero(ri.getIngredient().getProteins100g()).multiply(q));
                carbs = carbs.add(orZero(ri.getIngredient().getCarbs100g()).multiply(q));
                fat   = fat.add(orZero(ri.getIngredient().getFat100g()).multiply(q));
                fiber = fiber.add(orZero(ri.getIngredient().getFiber100g()).multiply(q));
            }
            return new SlotNutrition(cal, prot, carbs, fat, fiber);
        }

        // Plat préparé
        if (slot.getPreparedMeal() != null) {
            var pm = slot.getPreparedMeal();
            BigDecimal portions = slot.getPreparedMealPortions() != null
                ? slot.getPreparedMealPortions() : BigDecimal.ONE;
            return new SlotNutrition(
                orZero(pm.getCaloriesPortion()).multiply(portions),
                orZero(pm.getProteinsG()).multiply(portions),
                orZero(pm.getCarbsG()).multiply(portions),
                orZero(pm.getFatG()).multiply(portions),
                orZero(pm.getFiberG()).multiply(portions)
            );
        }

        // Libre / override calories
        if (slot.getCaloriesOverride() != null) {
            return new SlotNutrition(
                BigDecimal.valueOf(slot.getCaloriesOverride()),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
            );
        }

        return new SlotNutrition(BigDecimal.ZERO, BigDecimal.ZERO,
                                  BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    private BigDecimal orZero(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }

    @Transactional
    public DailyLog updateDailyLog(LocalDate date, DailyLog update, UUID userId) {
        DailyLog log = dailyLogRepository.findByUserIdAndLogDate(userId, date)
            .orElseGet(() -> {
                DailyLog l = new DailyLog();
                l.setUserId(userId);
                l.setLogDate(date);
                return l;
            });

        if (update.getWeightKg() != null) log.setWeightKg(update.getWeightKg());
        if (update.getNotes() != null) log.setNotes(update.getNotes());

        return dailyLogRepository.save(log);
    }

    public List<DailyLog> getStats(LocalDate from, LocalDate to, UUID userId) {
        List<DailyLog> stored = dailyLogRepository.findByUserIdAndLogDateBetween(userId, from, to);
        // Compléter les jours sans log avec les données du planning
        List<DailyLog> result = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            LocalDate day = d;
            DailyLog log = stored.stream()
                .filter(l -> l.getLogDate().equals(day))
                .findFirst()
                .orElseGet(() -> {
                    DailyLog l = new DailyLog();
                    l.setUserId(userId);
                    l.setLogDate(day);
                    return l;
                });
            computeFromSlots(log, day, userId);
            result.add(log);
        }
        return result;
    }

    @Transactional
    public Deviation addDeviation(DeviationRequest req, UUID userId) {
        Deviation deviation = Deviation.builder()
            .userId(userId)
            .deviationDate(req.deviationDate())
            .mealSlotId(req.mealSlotId())
            .type(req.type())
            .label(req.label())
            .caloriesExtra(req.caloriesExtra())
            .compensationSpread(req.compensationSpread() != null ? req.compensationSpread() : 2)
            .notes(req.notes())
            .build();
        return deviationRepository.save(deviation);
    }

    public List<Deviation> getDeviations(UUID userId) {
        return deviationRepository.findByUserIdOrderByDeviationDateDesc(userId);
    }

    public CompensationResponse getCompensation(UUID userId) {
        LocalDate today = LocalDate.now();
        List<Deviation> activeDeviations = deviationRepository.findByUserIdAndDeviationDateAfter(userId, today.minusDays(7));

        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        int baseTarget = profile != null && profile.getTargetCalories() != null
            ? profile.getTargetCalories()
            : (int) userService.getObjectives(userId).targetCalories();

        int totalSurplus = activeDeviations.stream()
            .mapToInt(Deviation::getCaloriesExtra)
            .sum();

        List<CompensationResponse.DayAdjustment> adjustments = new ArrayList<>();
        if (totalSurplus > 0) {
            int spread = 2;
            int reductionPerDay = totalSurplus / spread;
            for (int i = 1; i <= spread; i++) {
                LocalDate date = today.plusDays(i);
                int adjusted = Math.max(baseTarget - reductionPerDay, (int)(baseTarget * 0.7));
                adjustments.add(new CompensationResponse.DayAdjustment(date, baseTarget, -reductionPerDay, adjusted));
            }
        }

        return new CompensationResponse(totalSurplus, adjustments);
    }
}
