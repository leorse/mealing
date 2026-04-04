package com.mealing.mealplan;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mealing.recipe.RecipeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "meal_slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MealSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "week_plan_id", nullable = false)
    @JsonIgnore
    private WeekPlan weekPlan;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false)
    private MealType mealType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id")
    private RecipeEntity recipe;

    @Column(name = "free_label")
    private String freeLabel;

    @Column(precision = 4, scale = 2)
    private BigDecimal portions = BigDecimal.ONE;

    @Column(name = "is_deviation")
    private Boolean isDeviation = false;

    @Column(name = "calories_override")
    private Integer caloriesOverride;

    @Column(name = "is_consumed")
    private Boolean isConsumed = false;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    public enum MealType { BREAKFAST, LUNCH, DINNER, SNACK }
}
