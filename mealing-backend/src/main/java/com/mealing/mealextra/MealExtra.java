package com.mealing.mealextra;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "meal_extras")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MealExtra {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "meal_slot_id", nullable = false)
    private UUID mealSlotId;

    @Column(nullable = false)
    private String label;

    @Builder.Default
    @Column(name = "extra_type", nullable = false)
    private String extraType = "OTHER";

    // Option A : ingrédient BDD
    @Column(name = "ingredient_id")
    private UUID ingredientId;

    @Column(name = "quantity_g", precision = 8, scale = 2)
    private BigDecimal quantityG;

    // Option B : plat préparé
    @Column(name = "prepared_meal_id")
    private UUID preparedMealId;

    @Column(precision = 4, scale = 2)
    private BigDecimal portions;

    // Option C : saisie libre
    @Column(name = "calories_free", precision = 8, scale = 2)
    private BigDecimal caloriesFree;

    @Column(name = "proteins_free", precision = 7, scale = 2)
    private BigDecimal proteinsFree;

    @Column(name = "carbs_free", precision = 7, scale = 2)
    private BigDecimal carbsFree;

    @Column(name = "fat_free", precision = 7, scale = 2)
    private BigDecimal fatFree;

    @Column(name = "added_at")
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() { addedAt = LocalDateTime.now(); }

    public enum ExtraType { STARTER, DESSERT, SIDE, DRINK, SNACK, OTHER }
}
