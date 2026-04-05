package com.mealing.backup;

import com.mealing.ingredient.IngredientEntity;
import com.mealing.ingredient.IngredientRepository;
import com.mealing.mealextra.MealExtra;
import com.mealing.mealextra.MealExtraRepository;
import com.mealing.mealplan.MealSlot;
import com.mealing.mealplan.WeekPlan;
import com.mealing.mealplan.WeekPlanRepository;
import com.mealing.nutrition.Deviation;
import com.mealing.nutrition.DeviationRepository;
import com.mealing.preparedmeal.PreparedMeal;
import com.mealing.preparedmeal.PreparedMealRepository;
import com.mealing.recipe.RecipeEntity;
import com.mealing.recipe.RecipeIngredient;
import com.mealing.recipe.RecipeRepository;
import com.mealing.restaurant.RestaurantMeal;
import com.mealing.restaurant.RestaurantMealIngredient;
import com.mealing.restaurant.RestaurantMealRepository;
import com.mealing.user.UserProfile;
import com.mealing.user.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataBackupService {

    private final UserProfileRepository userProfileRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final PreparedMealRepository preparedMealRepository;
    private final WeekPlanRepository weekPlanRepository;
    private final MealExtraRepository mealExtraRepository;
    private final RestaurantMealRepository restaurantMealRepository;
    private final DeviationRepository deviationRepository;

    @Transactional(readOnly = true)
    public BackupDto export(UUID userId) {
        // Profile
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);

        // Custom ingredients only (source = MANUAL)
        List<IngredientEntity> customIngredients = ingredientRepository.findByUserIdAndSource(userId, "MANUAL");

        // All user recipes
        List<RecipeEntity> recipes = recipeRepository.findByUserId(userId);

        // All prepared meals (user added them intentionally)
        List<PreparedMeal> preparedMeals = preparedMealRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Week plans with slots
        List<WeekPlan> weekPlans = weekPlanRepository.findByUserId(userId);

        // Meal extras for all slots
        List<UUID> slotIds = weekPlans.stream()
            .flatMap(wp -> wp.getSlots().stream())
            .map(MealSlot::getId)
            .collect(Collectors.toList());
        List<MealExtra> mealExtras = slotIds.isEmpty()
            ? List.of()
            : mealExtraRepository.findByMealSlotIdIn(slotIds);

        // Restaurant meals
        List<RestaurantMeal> restaurantMeals = restaurantMealRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Deviations
        List<Deviation> deviations = deviationRepository.findByUserIdOrderByDeviationDateDesc(userId);

        return new BackupDto(
            "1.0",
            LocalDateTime.now().toString(),
            toProfileDto(profile),
            customIngredients.stream().map(this::toIngredientDto).collect(Collectors.toList()),
            recipes.stream().map(this::toRecipeDto).collect(Collectors.toList()),
            preparedMeals.stream().map(this::toPreparedMealDto).collect(Collectors.toList()),
            weekPlans.stream().map(this::toWeekPlanDto).collect(Collectors.toList()),
            mealExtras.stream().map(this::toMealExtraDto).collect(Collectors.toList()),
            restaurantMeals.stream().map(this::toRestaurantMealDto).collect(Collectors.toList()),
            deviations.stream().map(this::toDeviationDto).collect(Collectors.toList())
        );
    }

    @Transactional
    public void importBackup(BackupDto backup, UUID userId) {
        log.info("Starting backup import for user {}", userId);

        // 1. Collect all slot IDs to delete meal extras first
        List<WeekPlan> existingPlans = weekPlanRepository.findByUserId(userId);
        List<UUID> existingSlotIds = existingPlans.stream()
            .flatMap(wp -> wp.getSlots().stream())
            .map(MealSlot::getId)
            .collect(Collectors.toList());
        if (!existingSlotIds.isEmpty()) {
            mealExtraRepository.deleteByMealSlotIdIn(existingSlotIds);
        }

        // 2. Delete week plans (cascades to slots)
        weekPlanRepository.deleteByUserId(userId);
        weekPlanRepository.flush();

        // 3. Delete other user data
        deviationRepository.deleteAll(deviationRepository.findByUserIdOrderByDeviationDateDesc(userId));
        restaurantMealRepository.deleteAll(restaurantMealRepository.findByUserIdOrderByCreatedAtDesc(userId));
        preparedMealRepository.deleteAll(preparedMealRepository.findByUserIdOrderByCreatedAtDesc(userId));
        recipeRepository.deleteAll(recipeRepository.findByUserId(userId));
        ingredientRepository.deleteByUserIdAndSource(userId, "MANUAL");

        // 4. Restore profile
        if (backup.profile() != null) {
            UserProfile p = userProfileRepository.findByUserId(userId).orElse(new UserProfile());
            p.setUserId(userId);
            p.setFirstName(backup.profile().firstName());
            p.setBirthDate(backup.profile().birthDate());
            if (backup.profile().gender() != null)
                p.setGender(UserProfile.Gender.valueOf(backup.profile().gender()));
            p.setHeightCm(backup.profile().heightCm());
            p.setWeightKg(backup.profile().weightKg());
            if (backup.profile().activityLevel() != null)
                p.setActivityLevel(UserProfile.ActivityLevel.valueOf(backup.profile().activityLevel()));
            if (backup.profile().goal() != null)
                p.setGoal(UserProfile.Goal.valueOf(backup.profile().goal()));
            p.setTargetCalories(backup.profile().targetCalories());
            p.setMacroProteinPct(backup.profile().macroProteinPct());
            p.setMacroCarbsPct(backup.profile().macroCarbsPct());
            p.setMacroFatPct(backup.profile().macroFatPct());
            userProfileRepository.save(p);
        }

        // 5. Restore custom ingredients (preserve original UUIDs)
        for (BackupDto.IngredientDto dto : backup.customIngredients()) {
            IngredientEntity ing = IngredientEntity.builder()
                .id(dto.id())
                .name(dto.name())
                .brand(dto.brand())
                .barcode(dto.barcode())
                .category(dto.category())
                .calories100g(dto.calories100g())
                .proteins100g(dto.proteins100g())
                .carbs100g(dto.carbs100g())
                .sugars100g(dto.sugars100g())
                .fat100g(dto.fat100g())
                .saturatedFat100g(dto.saturatedFat100g())
                .fiber100g(dto.fiber100g())
                .salt100g(dto.salt100g())
                .glycemicIndex(dto.glycemicIndex())
                .nutriScore(dto.nutriScore())
                .isCustom(true)
                .source("MANUAL")
                .userId(userId)
                .build();
            ingredientRepository.save(ing);
        }

        // 6. Restore prepared meals
        for (BackupDto.PreparedMealDto dto : backup.preparedMeals()) {
            PreparedMeal pm = PreparedMeal.builder()
                .id(dto.id())
                .userId(userId)
                .name(dto.name())
                .brand(dto.brand())
                .barcode(dto.barcode())
                .nutriScore(dto.nutriScore())
                .caloriesPortion(dto.caloriesPortion())
                .proteinsG(dto.proteinsG())
                .carbsG(dto.carbsG())
                .fatG(dto.fatG())
                .fiberG(dto.fiberG())
                .portionLabel(dto.portionLabel())
                .offId(dto.offId())
                .isFavorite(dto.isFavorite())
                .build();
            preparedMealRepository.save(pm);
        }

        // 7. Restore recipes
        for (BackupDto.RecipeDto dto : backup.recipes()) {
            RecipeEntity recipe = new RecipeEntity();
            recipe.setId(dto.id());
            recipe.setUserId(userId);
            recipe.setName(dto.name());
            recipe.setDescription(dto.description());
            recipe.setServings(dto.servings() != null ? dto.servings() : 1);
            recipe.setPrepTimeMin(dto.prepTimeMin());
            recipe.setCookTimeMin(dto.cookTimeMin());
            if (dto.difficulty() != null)
                recipe.setDifficulty(RecipeEntity.Difficulty.valueOf(dto.difficulty()));
            recipe.setIsHealthy(dto.isHealthy());
            recipe.setTags(dto.tags());

            List<RecipeIngredient> riList = new ArrayList<>();
            for (BackupDto.RecipeIngredientDto ri : dto.ingredients()) {
                ingredientRepository.findById(ri.ingredientId()).ifPresent(ing -> {
                    RecipeIngredient recipeIng = RecipeIngredient.builder()
                        .id(ri.id())
                        .recipe(recipe)
                        .ingredient(ing)
                        .quantityG(ri.quantityG())
                        .unitLabel(ri.unitLabel())
                        .build();
                    riList.add(recipeIng);
                });
            }
            recipe.setIngredients(riList);
            recipeRepository.save(recipe);
        }

        // 8. Restore week plans with slots
        for (BackupDto.WeekPlanDto dto : backup.weekPlans()) {
            WeekPlan wp = new WeekPlan();
            wp.setId(dto.id());
            wp.setUserId(userId);
            wp.setWeekStart(dto.weekStart());
            wp.setNotes(dto.notes());

            List<MealSlot> slots = new ArrayList<>();
            for (BackupDto.MealSlotDto sd : dto.slots()) {
                MealSlot slot = new MealSlot();
                slot.setId(sd.id());
                slot.setWeekPlan(wp);
                slot.setSlotDate(sd.slotDate());
                slot.setMealType(MealSlot.MealType.valueOf(sd.mealType()));
                slot.setFreeLabel(sd.freeLabel());
                slot.setPortions(sd.portions());
                slot.setIsDeviation(sd.isDeviation());
                slot.setCaloriesOverride(sd.caloriesOverride());
                slot.setIsConsumed(sd.isConsumed());
                slot.setConsumedAt(sd.consumedAt());
                slot.setPreparedMealPortions(sd.preparedMealPortions());
                slot.setSourceType(sd.sourceType());
                if (sd.recipeId() != null)
                    recipeRepository.findById(sd.recipeId()).ifPresent(slot::setRecipe);
                if (sd.preparedMealId() != null)
                    preparedMealRepository.findById(sd.preparedMealId()).ifPresent(slot::setPreparedMeal);
                slots.add(slot);
            }
            wp.setSlots(slots);
            weekPlanRepository.save(wp);
        }

        // 9. Restore meal extras
        for (BackupDto.MealExtraDto dto : backup.mealExtras()) {
            MealExtra extra = MealExtra.builder()
                .id(dto.id())
                .mealSlotId(dto.mealSlotId())
                .label(dto.label())
                .extraType(dto.extraType())
                .ingredientId(dto.ingredientId())
                .quantityG(dto.quantityG())
                .preparedMealId(dto.preparedMealId())
                .portions(dto.portions())
                .caloriesFree(dto.caloriesFree())
                .proteinsFree(dto.proteinsFree())
                .carbsFree(dto.carbsFree())
                .fatFree(dto.fatFree())
                .addedAt(dto.addedAt() != null ? dto.addedAt() : LocalDateTime.now())
                .build();
            mealExtraRepository.save(extra);
        }

        // 10. Restore restaurant meals
        for (BackupDto.RestaurantMealDto dto : backup.restaurantMeals()) {
            RestaurantMeal rm = new RestaurantMeal();
            rm.setId(dto.id());
            rm.setUserId(userId);
            rm.setRestaurantName(dto.restaurantName());
            rm.setRestaurantType(dto.restaurantType());
            rm.setDishName(dto.dishName());
            rm.setDishNotes(dto.dishNotes());
            rm.setEstimationMethod(dto.estimationMethod() != null ? dto.estimationMethod() : "FREE");
            rm.setCaloriesFree(dto.caloriesFree());
            rm.setProteinsFree(dto.proteinsFree());
            rm.setCarbsFree(dto.carbsFree());
            rm.setFatFree(dto.fatFree());
            rm.setPortionSize(dto.portionSize());
            rm.setTotalCalories(dto.totalCalories());
            rm.setTotalProteins(dto.totalProteins());
            rm.setTotalCarbs(dto.totalCarbs());
            rm.setTotalFat(dto.totalFat());
            rm.setIsDeviation(dto.isDeviation());
            rm.setOriginalSlotId(dto.originalSlotId());
            rm.setCreatedAt(dto.createdAt() != null ? dto.createdAt() : LocalDateTime.now());

            List<RestaurantMealIngredient> rmiList = new ArrayList<>();
            for (BackupDto.RestaurantIngredientDto rid : dto.ingredients()) {
                ingredientRepository.findById(rid.ingredientId()).ifPresent(ing -> {
                    RestaurantMealIngredient rmi = RestaurantMealIngredient.builder()
                        .id(rid.id())
                        .restaurantMeal(rm)
                        .ingredient(ing)
                        .quantityG(rid.quantityG())
                        .unitLabel(rid.unitLabel())
                        .isEstimated(rid.isEstimated())
                        .build();
                    rmiList.add(rmi);
                });
            }
            rm.setIngredients(rmiList);
            restaurantMealRepository.save(rm);
        }

        // 11. Restore deviations
        for (BackupDto.DeviationDto dto : backup.deviations()) {
            Deviation dev = Deviation.builder()
                .id(dto.id())
                .userId(userId)
                .deviationDate(dto.deviationDate())
                .mealSlotId(dto.mealSlotId())
                .type(Deviation.DeviationType.valueOf(dto.type()))
                .label(dto.label())
                .caloriesExtra(dto.caloriesExtra())
                .compensationSpread(dto.compensationSpread())
                .notes(dto.notes())
                .createdAt(dto.createdAt() != null ? dto.createdAt() : LocalDateTime.now())
                .build();
            deviationRepository.save(dev);
        }

        log.info("Backup import completed successfully for user {}", userId);
    }

    // --- Mappers entity → DTO ---

    private BackupDto.ProfileDto toProfileDto(UserProfile p) {
        if (p == null) return null;
        return new BackupDto.ProfileDto(
            p.getId(), p.getFirstName(), p.getBirthDate(),
            p.getGender() != null ? p.getGender().name() : null,
            p.getHeightCm(), p.getWeightKg(),
            p.getActivityLevel() != null ? p.getActivityLevel().name() : null,
            p.getGoal() != null ? p.getGoal().name() : null,
            p.getTargetCalories(), p.getMacroProteinPct(), p.getMacroCarbsPct(), p.getMacroFatPct()
        );
    }

    private BackupDto.IngredientDto toIngredientDto(IngredientEntity i) {
        return new BackupDto.IngredientDto(
            i.getId(), i.getName(), i.getBrand(), i.getBarcode(), i.getCategory(),
            i.getCalories100g(), i.getProteins100g(), i.getCarbs100g(), i.getSugars100g(),
            i.getFat100g(), i.getSaturatedFat100g(), i.getFiber100g(), i.getSalt100g(),
            i.getGlycemicIndex(), i.getNutriScore()
        );
    }

    private BackupDto.RecipeDto toRecipeDto(RecipeEntity r) {
        List<BackupDto.RecipeIngredientDto> ings = r.getIngredients().stream()
            .map(ri -> new BackupDto.RecipeIngredientDto(
                ri.getId(), ri.getIngredient().getId(), ri.getQuantityG(), ri.getUnitLabel()))
            .collect(Collectors.toList());
        return new BackupDto.RecipeDto(
            r.getId(), r.getName(), r.getDescription(), r.getServings(),
            r.getPrepTimeMin(), r.getCookTimeMin(),
            r.getDifficulty() != null ? r.getDifficulty().name() : null,
            r.getIsHealthy(), r.getTags(), ings
        );
    }

    private BackupDto.PreparedMealDto toPreparedMealDto(PreparedMeal pm) {
        return new BackupDto.PreparedMealDto(
            pm.getId(), pm.getName(), pm.getBrand(), pm.getBarcode(), pm.getNutriScore(),
            pm.getCaloriesPortion(), pm.getProteinsG(), pm.getCarbsG(), pm.getFatG(), pm.getFiberG(),
            pm.getPortionLabel(), pm.getOffId(), pm.getIsFavorite()
        );
    }

    private BackupDto.WeekPlanDto toWeekPlanDto(WeekPlan wp) {
        List<BackupDto.MealSlotDto> slots = wp.getSlots().stream()
            .map(s -> new BackupDto.MealSlotDto(
                s.getId(), s.getSlotDate(), s.getMealType().name(),
                s.getRecipe() != null ? s.getRecipe().getId() : null,
                s.getFreeLabel(), s.getPortions(), s.getIsDeviation(),
                s.getCaloriesOverride(), s.getIsConsumed(), s.getConsumedAt(),
                s.getPreparedMeal() != null ? s.getPreparedMeal().getId() : null,
                s.getPreparedMealPortions(), s.getSourceType()
            ))
            .collect(Collectors.toList());
        return new BackupDto.WeekPlanDto(wp.getId(), wp.getWeekStart(), wp.getNotes(), slots);
    }

    private BackupDto.MealExtraDto toMealExtraDto(MealExtra e) {
        return new BackupDto.MealExtraDto(
            e.getId(), e.getMealSlotId(), e.getLabel(), e.getExtraType(),
            e.getIngredientId(), e.getQuantityG(), e.getPreparedMealId(), e.getPortions(),
            e.getCaloriesFree(), e.getProteinsFree(), e.getCarbsFree(), e.getFatFree(), e.getAddedAt()
        );
    }

    private BackupDto.RestaurantMealDto toRestaurantMealDto(RestaurantMeal rm) {
        List<BackupDto.RestaurantIngredientDto> ings = rm.getIngredients().stream()
            .map(ri -> new BackupDto.RestaurantIngredientDto(
                ri.getId(),
                ri.getIngredient() != null ? ri.getIngredient().getId() : null,
                ri.getQuantityG(), ri.getUnitLabel(), ri.getIsEstimated()))
            .collect(Collectors.toList());
        return new BackupDto.RestaurantMealDto(
            rm.getId(), rm.getRestaurantName(), rm.getRestaurantType(), rm.getDishName(), rm.getDishNotes(),
            rm.getEstimationMethod(), rm.getCaloriesFree(), rm.getProteinsFree(), rm.getCarbsFree(), rm.getFatFree(),
            rm.getPortionSize(), rm.getTotalCalories(), rm.getTotalProteins(), rm.getTotalCarbs(), rm.getTotalFat(),
            rm.getIsDeviation(), rm.getOriginalSlotId(), rm.getCreatedAt(), ings
        );
    }

    private BackupDto.DeviationDto toDeviationDto(Deviation d) {
        return new BackupDto.DeviationDto(
            d.getId(), d.getDeviationDate(), d.getMealSlotId(),
            d.getType().name(), d.getLabel(), d.getCaloriesExtra(),
            d.getCompensationSpread(), d.getNotes(), d.getCreatedAt()
        );
    }
}
