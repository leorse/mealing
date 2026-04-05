package com.mealing.restaurant;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mealing.ingredient.IngredientEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "restaurant_meal_ingredients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RestaurantMealIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_meal_id", nullable = false)
    @JsonIgnore
    private RestaurantMeal restaurantMeal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id")
    private IngredientEntity ingredient;

    @Column(name = "quantity_g", precision = 8, scale = 2)
    private BigDecimal quantityG;

    @Column(name = "unit_label")
    private String unitLabel;

    @Builder.Default
    @Column(name = "is_estimated")
    private Boolean isEstimated = true;
}
