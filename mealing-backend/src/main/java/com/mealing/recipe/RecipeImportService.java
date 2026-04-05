package com.mealing.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealing.ingredient.IngredientEntity;
import com.mealing.ingredient.IngredientRepository;
import com.mealing.ingredient.OpenFoodFactsClient;
import com.mealing.recipe.dto.RecipeImportRequest;
import com.mealing.recipe.dto.RecipeImportRequest.ImportIngredient;
import com.mealing.recipe.dto.RecipeImportResponse;
import com.mealing.recipe.dto.RecipeImportResponse.UnresolvedIngredient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeImportService {

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final IngredientRepository ingredientRepository;
    private final OpenFoodFactsClient offClient;
    private final ObjectMapper objectMapper;

    // Conversion des unités vers grammes (approximations)
    private static final Map<String, BigDecimal> UNIT_TO_GRAMS = Map.of(
        "g", BigDecimal.ONE,
        "kg", new BigDecimal("1000"),
        "ml", BigDecimal.ONE,
        "l", new BigDecimal("1000"),
        "cuillere_cafe", new BigDecimal("5"),
        "cuillere_soupe", new BigDecimal("15"),
        "tasse", new BigDecimal("240"),
        "pincee", new BigDecimal("1"),
        "tranche", new BigDecimal("30"),
        "piece", new BigDecimal("100")
    );

    @Transactional
    public RecipeImportResponse importFromJson(MultipartFile file, boolean overwrite, UUID userId) {
        RecipeImportRequest req;
        try {
            req = objectMapper.readValue(file.getInputStream(), RecipeImportRequest.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Fichier JSON invalide : " + e.getMessage());
        }

        if (req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Le champ 'name' est obligatoire dans le JSON.");
        }

        List<String> warnings = new ArrayList<>();
        List<UnresolvedIngredient> unresolved = new ArrayList<>();

        // Vérification doublon
        Optional<RecipeEntity> existing = recipeRepository.findByUserIdAndNameIgnoreCase(userId, req.getName());
        if (existing.isPresent()) {
            if (!overwrite) {
                throw new IllegalArgumentException("Une recette nommée '" + req.getName() + "' existe déjà. Utilisez overwrite=true pour la remplacer.");
            }
            recipeRepository.delete(existing.get());
        }

        // Création de la recette
        RecipeEntity recipe = RecipeEntity.builder()
            .userId(userId)
            .name(req.getName())
            .description(req.getDescription())
            .servings(req.getServings() != null ? req.getServings() : 1)
            .prepTimeMin(req.getPrepTimeMin())
            .cookTimeMin(req.getCookTimeMin())
            .difficulty(parseDifficulty(req.getDifficulty()))
            .tags(req.getTags() != null ? String.join(",", req.getTags()) : null)
            .build();

        recipe = recipeRepository.save(recipe);

        int resolvedCount = 0;
        List<RecipeIngredient> recipeIngredients = new ArrayList<>();

        if (req.getIngredients() != null) {
            for (ImportIngredient ing : req.getIngredients()) {
                Optional<IngredientEntity> resolved = resolveIngredient(ing, warnings);

                BigDecimal quantityG = toGrams(ing.getQuantity(), ing.getUnit());
                String unitLabel = ing.getUnit();

                if (resolved.isPresent()) {
                    recipeIngredients.add(RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredient(resolved.get())
                        .quantityG(quantityG)
                        .unitLabel(unitLabel)
                        .isResolved(true)
                        .build());
                    resolvedCount++;
                } else {
                    // Ingrédient non résolu : on l'ajoute avec une référence null (résolution manuelle)
                    unresolved.add(UnresolvedIngredient.builder()
                        .tempId(ing.getTempId() != null ? ing.getTempId() : UUID.randomUUID().toString())
                        .name(ing.getName())
                        .barcode(ing.getBarcode())
                        .quantity(ing.getQuantity() != null ? ing.getQuantity().toPlainString() : null)
                        .unit(unitLabel)
                        .build());
                    warnings.add("Ingrédient non résolu : " + ing.getName());
                }
            }
        }

        recipe.setIngredients(recipeIngredients);
        recipeRepository.save(recipe);

        RecipeImportResponse.Status status;
        if (unresolved.isEmpty()) {
            status = RecipeImportResponse.Status.SUCCESS;
        } else if (resolvedCount > 0) {
            status = RecipeImportResponse.Status.PARTIAL_SUCCESS;
        } else {
            status = RecipeImportResponse.Status.FAILED;
        }

        return RecipeImportResponse.builder()
            .status(status)
            .recipeId(recipe.getId())
            .recipeName(recipe.getName())
            .servings(recipe.getServings())
            .resolvedCount(resolvedCount)
            .unresolvedIngredients(unresolved)
            .warnings(warnings)
            .build();
    }

    /** Résolution en cascade : exact → full-text → barcode OFF → nom OFF */
    private Optional<IngredientEntity> resolveIngredient(ImportIngredient ing, List<String> warnings) {
        // 1. Match exact (insensible à la casse)
        List<IngredientEntity> exact = ingredientRepository.findByNameIgnoreCase(ing.getName());
        if (!exact.isEmpty()) return Optional.of(exact.get(0));

        // 2. Match flou (LIKE)
        List<IngredientEntity> fuzzy = ingredientRepository.searchByName(ing.getName(), null);
        if (!fuzzy.isEmpty()) {
            warnings.add("Correspondance approximative pour '" + ing.getName() + "' → '" + fuzzy.get(0).getName() + "'");
            return Optional.of(fuzzy.get(0));
        }

        // 3. Barcode → OFF
        if (ing.getBarcode() != null && !ing.getBarcode().isBlank()) {
            try {
                Optional<IngredientEntity> fromBarcode = offClient.findByBarcode(ing.getBarcode());
                if (fromBarcode.isPresent()) {
                    IngredientEntity saved = ingredientRepository.save(fromBarcode.get());
                    warnings.add("Ingrédient '" + ing.getName() + "' importé depuis OFF via code-barres.");
                    return Optional.of(saved);
                }
            } catch (Exception e) {
                log.warn("Erreur barcode OFF pour {}: {}", ing.getBarcode(), e.getMessage());
            }
        }

        // 4. Nom → OFF
        try {
            List<IngredientEntity> offResults = offClient.search(ing.getName());
            if (!offResults.isEmpty()) {
                IngredientEntity saved = ingredientRepository.save(offResults.get(0));
                warnings.add("Ingrédient '" + ing.getName() + "' importé automatiquement depuis Open Food Facts.");
                return Optional.of(saved);
            }
        } catch (Exception e) {
            log.warn("Erreur search OFF pour {}: {}", ing.getName(), e.getMessage());
        }

        return Optional.empty();
    }

    private BigDecimal toGrams(BigDecimal quantity, String unit) {
        if (quantity == null) return BigDecimal.valueOf(100);
        if (unit == null) return quantity;
        BigDecimal factor = UNIT_TO_GRAMS.getOrDefault(unit.toLowerCase(), BigDecimal.ONE);
        return quantity.multiply(factor);
    }

    private RecipeEntity.Difficulty parseDifficulty(String s) {
        if (s == null) return null;
        try { return RecipeEntity.Difficulty.valueOf(s.toUpperCase()); }
        catch (Exception e) { return null; }
    }
}
