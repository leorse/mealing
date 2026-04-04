package com.mealing.ingredient;

import com.mealing.user.UserProfile;
import com.mealing.user.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final OpenFoodFactsClient offClient;
    private final UserProfileRepository userProfileRepository;

    public List<IngredientEntity> search(String query, UUID userId) {
        return ingredientRepository.searchByName(query, userId);
    }

    public Optional<IngredientEntity> findByBarcode(String ean, UUID userId) {
        return ingredientRepository.findByBarcode(ean);
    }

    public IngredientEntity getById(UUID id) {
        return ingredientRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ingrédient non trouvé"));
    }

    @Transactional
    public IngredientEntity createCustom(IngredientEntity ingredient, UUID userId) {
        ingredient.setIsCustom(true);
        ingredient.setUserId(userId);
        return ingredientRepository.save(ingredient);
    }

    @Transactional
    public IngredientEntity update(UUID id, IngredientEntity updated, UUID userId) {
        IngredientEntity existing = ingredientRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ingrédient non trouvé"));
        if (!existing.getIsCustom() || !userId.equals(existing.getUserId())) {
            throw new IllegalStateException("Non autorisé");
        }
        updated.setId(id);
        updated.setUserId(userId);
        updated.setIsCustom(true);
        return ingredientRepository.save(updated);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        IngredientEntity existing = ingredientRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ingrédient non trouvé"));
        if (!existing.getIsCustom() || !userId.equals(existing.getUserId())) {
            throw new IllegalStateException("Non autorisé");
        }
        ingredientRepository.delete(existing);
    }

    public List<IngredientEntity> importFromOpenFoodFacts(String query, UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        String username = profile != null ? profile.getOffUsername() : null;
        String password = profile != null ? profile.getOffPassword() : null;
        return offClient.search(query, username, password);
    }

    @Transactional
    public IngredientEntity importByBarcode(String ean, UUID userId) {
        return ingredientRepository.findByBarcode(ean)
            .orElseGet(() -> {
                UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
                String username = profile != null ? profile.getOffUsername() : null;
                String password = profile != null ? profile.getOffPassword() : null;
                return offClient.findByBarcode(ean, username, password)
                    .map(ingredientRepository::save)
                    .orElseThrow(() -> new IllegalArgumentException("Produit non trouvé : " + ean));
            });
    }
}
