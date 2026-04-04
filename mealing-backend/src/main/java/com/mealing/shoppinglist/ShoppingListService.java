package com.mealing.shoppinglist;

import com.mealing.ingredient.IngredientEntity;
import com.mealing.mealplan.MealSlot;
import com.mealing.mealplan.WeekPlan;
import com.mealing.mealplan.WeekPlanRepository;
import com.mealing.recipe.RecipeIngredient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingItemRepository shoppingItemRepository;
    private final WeekPlanRepository weekPlanRepository;

    @Transactional
    public ShoppingList generateForWeek(UUID weekPlanId, UUID userId) {
        WeekPlan plan = weekPlanRepository.findByIdAndUserId(weekPlanId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Planning non trouvé"));

        // Retourner la liste existante ou en créer une nouvelle
        return shoppingListRepository.findByWeekPlanIdAndUserId(weekPlanId, userId)
            .orElseGet(() -> generateNewList(plan, userId));
    }

    private ShoppingList generateNewList(WeekPlan plan, UUID userId) {
        // Agréger les ingrédients
        Map<UUID, AggregatedItem> aggregated = new LinkedHashMap<>();

        for (MealSlot slot : plan.getSlots()) {
            if (slot.getRecipe() == null) continue;
            double portions = slot.getPortions() != null ? slot.getPortions().doubleValue() : 1.0;

            for (RecipeIngredient ri : slot.getRecipe().getIngredients()) {
                IngredientEntity ing = ri.getIngredient();
                double qty = ri.getQuantityG().doubleValue() * portions;

                aggregated.merge(ing.getId(),
                    new AggregatedItem(ing, qty),
                    (existing, next) -> {
                        existing.quantity += next.quantity;
                        return existing;
                    });
            }
        }

        ShoppingList list = ShoppingList.builder()
            .userId(userId)
            .weekPlanId(plan.getId())
            .name("Courses semaine du " + plan.getWeekStart())
            .items(new ArrayList<>())
            .build();

        for (AggregatedItem ai : aggregated.values()) {
            ShoppingItem item = ShoppingItem.builder()
                .shoppingList(list)
                .ingredientId(ai.ingredient.getId())
                .label(ai.ingredient.getName())
                .quantityG(BigDecimal.valueOf(ai.quantity))
                .category(ai.ingredient.getCategory())
                .isChecked(false)
                .isManual(false)
                .build();
            list.getItems().add(item);
        }

        return shoppingListRepository.save(list);
    }

    @Transactional
    public ShoppingItem addManualItem(UUID listId, ShoppingItem item, UUID userId) {
        ShoppingList list = shoppingListRepository.findByIdAndUserId(listId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Liste non trouvée"));
        item.setShoppingList(list);
        item.setIsManual(true);
        return shoppingItemRepository.save(item);
    }

    @Transactional
    public ShoppingItem toggleCheck(UUID itemId, UUID userId) {
        ShoppingItem item = shoppingItemRepository.findByIdAndShoppingListUserId(itemId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Item non trouvé"));
        item.setIsChecked(!item.getIsChecked());
        return shoppingItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(UUID itemId, UUID userId) {
        ShoppingItem item = shoppingItemRepository.findByIdAndShoppingListUserId(itemId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Item non trouvé"));
        shoppingItemRepository.delete(item);
    }

    public String exportAsText(UUID listId, UUID userId) {
        ShoppingList list = shoppingListRepository.findByIdAndUserId(listId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Liste non trouvée"));

        StringBuilder sb = new StringBuilder();
        sb.append("=== ").append(list.getName()).append(" ===\n\n");

        Map<String, List<ShoppingItem>> byCategory = new TreeMap<>();
        for (ShoppingItem item : list.getItems()) {
            String cat = item.getCategory() != null ? item.getCategory() : "Autres";
            byCategory.computeIfAbsent(cat, k -> new ArrayList<>()).add(item);
        }

        for (Map.Entry<String, List<ShoppingItem>> entry : byCategory.entrySet()) {
            sb.append("--- ").append(entry.getKey()).append(" ---\n");
            for (ShoppingItem item : entry.getValue()) {
                String check = item.getIsChecked() ? "[x] " : "[ ] ";
                sb.append(check).append(item.getLabel());
                if (item.getQuantityG() != null) {
                    sb.append(" - ").append(item.getQuantityG().intValue()).append(" g");
                }
                sb.append("\n");
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private static class AggregatedItem {
        IngredientEntity ingredient;
        double quantity;
        AggregatedItem(IngredientEntity i, double q) { ingredient = i; quantity = q; }
    }
}
