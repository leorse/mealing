package com.mealing.recipe;

import com.mealing.ingredient.IngredientEntity;
import com.mealing.ingredient.IngredientRepository;
import com.mealing.recipe.dto.NutritionResponse;
import com.mealing.recipe.dto.RecipeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;

    public List<RecipeEntity> getAll(UUID userId) {
        return recipeRepository.findByUserId(userId);
    }

    public RecipeEntity getById(UUID id, UUID userId) {
        return recipeRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new IllegalArgumentException("Recette non trouvée"));
    }

    @Transactional
    public RecipeEntity create(RecipeRequest req, UUID userId) {
        RecipeEntity recipe = RecipeEntity.builder()
            .userId(userId)
            .name(req.name())
            .description(req.description())
            .servings(req.servings() != null ? req.servings() : 1)
            .prepTimeMin(req.prepTimeMin())
            .cookTimeMin(req.cookTimeMin())
            .difficulty(req.difficulty())
            .photoUrl(req.photoUrl())
            .ingredients(new ArrayList<>())
            .build();

        if (req.ingredients() != null) {
            for (RecipeRequest.IngredientItem item : req.ingredients()) {
                IngredientEntity ing = ingredientRepository.findById(item.ingredientId())
                    .orElseThrow(() -> new IllegalArgumentException("Ingrédient non trouvé : " + item.ingredientId()));
                RecipeIngredient ri = RecipeIngredient.builder()
                    .recipe(recipe)
                    .ingredient(ing)
                    .quantityG(item.quantityG())
                    .unitLabel(item.unitLabel())
                    .build();
                recipe.getIngredients().add(ri);
            }
        }

        RecipeEntity saved = recipeRepository.save(recipe);
        saved.setIsHealthy(calculateIsHealthy(computeNutrition(saved)));
        return recipeRepository.save(saved);
    }

    @Transactional
    public RecipeEntity update(UUID id, RecipeRequest req, UUID userId) {
        RecipeEntity recipe = getById(id, userId);
        recipe.setName(req.name());
        recipe.setDescription(req.description());
        if (req.servings() != null) recipe.setServings(req.servings());
        recipe.setPrepTimeMin(req.prepTimeMin());
        recipe.setCookTimeMin(req.cookTimeMin());
        recipe.setDifficulty(req.difficulty());
        recipe.setPhotoUrl(req.photoUrl());

        recipe.getIngredients().clear();
        if (req.ingredients() != null) {
            for (RecipeRequest.IngredientItem item : req.ingredients()) {
                IngredientEntity ing = ingredientRepository.findById(item.ingredientId())
                    .orElseThrow(() -> new IllegalArgumentException("Ingrédient non trouvé"));
                recipe.getIngredients().add(RecipeIngredient.builder()
                    .recipe(recipe)
                    .ingredient(ing)
                    .quantityG(item.quantityG())
                    .unitLabel(item.unitLabel())
                    .build());
            }
        }

        RecipeEntity saved = recipeRepository.save(recipe);
        saved.setIsHealthy(calculateIsHealthy(computeNutrition(saved)));
        return recipeRepository.save(saved);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        RecipeEntity recipe = getById(id, userId);
        recipeRepository.delete(recipe);
    }

    public NutritionResponse getNutrition(UUID id, UUID userId) {
        RecipeEntity recipe = getById(id, userId);
        return computeNutrition(recipe);
    }

    private NutritionResponse computeNutrition(RecipeEntity recipe) {
        double totalCalories = 0, totalProteins = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;

        for (RecipeIngredient ri : recipe.getIngredients()) {
            IngredientEntity ing = ri.getIngredient();
            double qty = ri.getQuantityG().doubleValue() / 100.0;
            totalCalories += safe(ing.getCalories100g()) * qty;
            totalProteins += safe(ing.getProteins100g()) * qty;
            totalCarbs += safe(ing.getCarbs100g()) * qty;
            totalFat += safe(ing.getFat100g()) * qty;
            totalFiber += safe(ing.getFiber100g()) * qty;
        }

        int servings = recipe.getServings() != null ? recipe.getServings() : 1;
        return new NutritionResponse(
            totalCalories, totalProteins, totalCarbs, totalFat, totalFiber,
            totalCalories / servings, totalProteins / servings,
            totalCarbs / servings, totalFat / servings, totalFiber / servings,
            false
        );
    }

    private boolean calculateIsHealthy(NutritionResponse n) {
        int score = 0;
        if (n.caloriesPerServing() <= 600) score++;
        if (n.fiberPerServing() >= 3) score++;
        if (n.carbsPerServing() > 0 && (n.carbsPerServing() - n.fiberPerServing()) <= 10) score++;
        // Ajout score simple : protéines suffisantes
        if (n.proteinsPerServing() >= 15) score++;
        return score >= 3;
    }

    private double safe(BigDecimal val) {
        return val != null ? val.doubleValue() : 0.0;
    }
}
