package com.mealing.restaurant;

import com.mealing.ingredient.IngredientEntity;
import com.mealing.ingredient.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantMealService {

    private final RestaurantMealRepository repository;
    private final DishTemplateRepository templateRepository;
    private final IngredientRepository ingredientRepository;

    public List<RestaurantMeal> getAll(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public RestaurantMeal getById(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new IllegalArgumentException("Repas restaurant non trouvé"));
    }

    public List<DishTemplate> searchTemplates(String q, String category) {
        return templateRepository.search(
            (q == null || q.isBlank()) ? null : q,
            (category == null || category.isBlank()) ? null : category
        );
    }

    @Transactional
    public RestaurantMeal create(RestaurantMeal meal, UUID userId) {
        meal.setUserId(userId);
        computeTotal(meal);
        return repository.save(meal);
    }

    @Transactional
    public RestaurantMeal update(UUID id, RestaurantMeal updated, UUID userId) {
        RestaurantMeal existing = getById(id, userId);
        existing.setRestaurantName(updated.getRestaurantName());
        existing.setRestaurantType(updated.getRestaurantType());
        existing.setDishName(updated.getDishName());
        existing.setDishNotes(updated.getDishNotes());
        existing.setEstimationMethod(updated.getEstimationMethod());
        existing.setCaloriesFree(updated.getCaloriesFree());
        existing.setProteinsFree(updated.getProteinsFree());
        existing.setCarbsFree(updated.getCarbsFree());
        existing.setFatFree(updated.getFatFree());
        existing.setDishTemplate(updated.getDishTemplate());
        existing.setPortionSize(updated.getPortionSize());
        computeTotal(existing);
        return repository.save(existing);
    }

    @Transactional
    public RestaurantMealIngredient addIngredient(UUID mealId, UUID userId, UUID ingredientId, BigDecimal quantityG, String unitLabel) {
        RestaurantMeal meal = getById(mealId, userId);
        IngredientEntity ingredient = ingredientRepository.findById(ingredientId)
            .orElseThrow(() -> new IllegalArgumentException("Ingrédient non trouvé"));

        RestaurantMealIngredient rmi = RestaurantMealIngredient.builder()
            .restaurantMeal(meal)
            .ingredient(ingredient)
            .quantityG(quantityG)
            .unitLabel(unitLabel)
            .isEstimated(true)
            .build();

        meal.getIngredients().add(rmi);
        meal.setEstimationMethod("RECONSTRUCTED");
        computeTotal(meal);
        repository.save(meal);
        return rmi;
    }

    @Transactional
    public void removeIngredient(UUID mealId, UUID userId, UUID ingredientId) {
        RestaurantMeal meal = getById(mealId, userId);
        meal.getIngredients().removeIf(i -> i.getId().equals(ingredientId));
        computeTotal(meal);
        repository.save(meal);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        repository.delete(getById(id, userId));
    }

    /** Recalcule le total selon la méthode d'estimation */
    private void computeTotal(RestaurantMeal meal) {
        String method = meal.getEstimationMethod() != null ? meal.getEstimationMethod() : "FREE";

        switch (method) {
            case "FREE" -> {
                meal.setTotalCalories(meal.getCaloriesFree());
                meal.setTotalProteins(meal.getProteinsFree());
                meal.setTotalCarbs(meal.getCarbsFree());
                meal.setTotalFat(meal.getFatFree());
            }
            case "GUIDED" -> {
                if (meal.getDishTemplate() != null) {
                    DishTemplate t = meal.getDishTemplate();
                    String size = meal.getPortionSize() != null ? meal.getPortionSize() : "NORMAL";
                    int cal = switch (size) {
                        case "SMALL" -> t.getCaloriesSmall() != null ? t.getCaloriesSmall() : t.getCaloriesNormal();
                        case "LARGE" -> t.getCaloriesLarge() != null ? t.getCaloriesLarge() : t.getCaloriesNormal();
                        default -> t.getCaloriesNormal();
                    };
                    BigDecimal factor = size.equals("NORMAL") ? BigDecimal.ONE
                        : size.equals("SMALL") && t.getCaloriesSmall() != null
                            ? BigDecimal.valueOf(t.getCaloriesSmall()).divide(BigDecimal.valueOf(t.getCaloriesNormal()), 4, RoundingMode.HALF_UP)
                            : t.getCaloriesLarge() != null
                                ? BigDecimal.valueOf(t.getCaloriesLarge()).divide(BigDecimal.valueOf(t.getCaloriesNormal()), 4, RoundingMode.HALF_UP)
                                : BigDecimal.ONE;
                    meal.setTotalCalories(BigDecimal.valueOf(cal));
                    meal.setTotalProteins(t.getProteinsNormal() != null ? t.getProteinsNormal().multiply(factor) : null);
                    meal.setTotalCarbs(t.getCarbsNormal() != null ? t.getCarbsNormal().multiply(factor) : null);
                    meal.setTotalFat(t.getFatNormal() != null ? t.getFatNormal().multiply(factor) : null);
                }
            }
            case "RECONSTRUCTED", "MIXED" -> {
                BigDecimal cal = meal.getCaloriesFree() != null ? meal.getCaloriesFree() : BigDecimal.ZERO;
                BigDecimal prot = meal.getProteinsFree() != null ? meal.getProteinsFree() : BigDecimal.ZERO;
                BigDecimal carbs = meal.getCarbsFree() != null ? meal.getCarbsFree() : BigDecimal.ZERO;
                BigDecimal fat = meal.getFatFree() != null ? meal.getFatFree() : BigDecimal.ZERO;

                for (RestaurantMealIngredient rmi : meal.getIngredients()) {
                    if (rmi.getIngredient() == null || rmi.getQuantityG() == null) continue;
                    BigDecimal f = rmi.getQuantityG().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                    cal = cal.add(orZero(rmi.getIngredient().getCalories100g()).multiply(f));
                    prot = prot.add(orZero(rmi.getIngredient().getProteins100g()).multiply(f));
                    carbs = carbs.add(orZero(rmi.getIngredient().getCarbs100g()).multiply(f));
                    fat = fat.add(orZero(rmi.getIngredient().getFat100g()).multiply(f));
                }
                meal.setTotalCalories(cal);
                meal.setTotalProteins(prot);
                meal.setTotalCarbs(carbs);
                meal.setTotalFat(fat);
            }
        }
    }

    private BigDecimal orZero(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
}
