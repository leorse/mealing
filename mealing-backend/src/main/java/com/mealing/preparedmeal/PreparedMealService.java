package com.mealing.preparedmeal;

import com.mealing.ingredient.IngredientEntity;
import com.mealing.ingredient.OpenFoodFactsClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PreparedMealService {

    private final PreparedMealRepository repository;
    private final OpenFoodFactsClient offClient;

    public List<PreparedMeal> getAll(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<PreparedMeal> getFavorites(UUID userId) {
        return repository.findByUserIdAndIsFavoriteTrueOrderByNameAsc(userId);
    }

    public PreparedMeal getById(UUID id, UUID userId) {
        return repository.findById(id)
            .filter(m -> m.getUserId().equals(userId))
            .orElseThrow(() -> new IllegalArgumentException("Plat préparé non trouvé"));
    }

    @Transactional
    public PreparedMeal create(PreparedMeal meal, UUID userId) {
        meal.setUserId(userId);
        return repository.save(meal);
    }

    @Transactional
    public PreparedMeal createFromBarcode(String ean, UUID userId) {
        // Vérifie si déjà connu
        Optional<PreparedMeal> existing = repository.findByBarcode(ean);
        if (existing.isPresent()) return existing.get();

        // Import depuis OFF
        IngredientEntity offData = offClient.findByBarcode(ean)
            .orElseThrow(() -> new IllegalArgumentException("Produit non trouvé sur Open Food Facts : " + ean));

        PreparedMeal meal = PreparedMeal.builder()
            .userId(userId)
            .name(offData.getName())
            .brand(offData.getBrand())
            .barcode(ean)
            .offId(offData.getOffId())
            .nutriScore(offData.getNutriScore())
            .caloriesPortion(offData.getCalories100g())
            .proteinsG(offData.getProteins100g())
            .carbsG(offData.getCarbs100g())
            .fatG(offData.getFat100g())
            .fiberG(offData.getFiber100g())
            .portionLabel("100g")
            .build();

        return repository.save(meal);
    }

    @Transactional
    public PreparedMeal update(UUID id, PreparedMeal updated, UUID userId) {
        PreparedMeal existing = getById(id, userId);
        existing.setName(updated.getName());
        existing.setBrand(updated.getBrand());
        existing.setCaloriesPortion(updated.getCaloriesPortion());
        existing.setProteinsG(updated.getProteinsG());
        existing.setCarbsG(updated.getCarbsG());
        existing.setFatG(updated.getFatG());
        existing.setFiberG(updated.getFiberG());
        existing.setPortionLabel(updated.getPortionLabel());
        existing.setNutriScore(updated.getNutriScore());
        return repository.save(existing);
    }

    @Transactional
    public PreparedMeal toggleFavorite(UUID id, UUID userId) {
        PreparedMeal meal = getById(id, userId);
        meal.setIsFavorite(!Boolean.TRUE.equals(meal.getIsFavorite()));
        return repository.save(meal);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        PreparedMeal meal = getById(id, userId);
        repository.delete(meal);
    }
}
