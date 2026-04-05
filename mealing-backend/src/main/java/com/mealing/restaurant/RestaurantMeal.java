package com.mealing.restaurant;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "restaurant_meals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RestaurantMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "restaurant_name")
    private String restaurantName;

    @Column(name = "restaurant_type")
    private String restaurantType;

    @Column(name = "dish_name", nullable = false)
    private String dishName;

    @Column(name = "dish_notes")
    private String dishNotes;

    @Column(name = "estimation_method", nullable = false)
    private String estimationMethod = "FREE";

    // Méthode FREE
    @Column(name = "calories_free", precision = 8, scale = 2)
    private BigDecimal caloriesFree;

    @Column(name = "proteins_free", precision = 7, scale = 2)
    private BigDecimal proteinsFree;

    @Column(name = "carbs_free", precision = 7, scale = 2)
    private BigDecimal carbsFree;

    @Column(name = "fat_free", precision = 7, scale = 2)
    private BigDecimal fatFree;

    // Méthode GUIDED
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dish_template_id")
    private DishTemplate dishTemplate;

    @Column(name = "portion_size")
    private String portionSize = "NORMAL";

    // Total calculé
    @Column(name = "total_calories", precision = 8, scale = 2)
    private BigDecimal totalCalories;

    @Column(name = "total_proteins", precision = 7, scale = 2)
    private BigDecimal totalProteins;

    @Column(name = "total_carbs", precision = 7, scale = 2)
    private BigDecimal totalCarbs;

    @Column(name = "total_fat", precision = 7, scale = 2)
    private BigDecimal totalFat;

    @Builder.Default
    @Column(name = "is_deviation")
    private Boolean isDeviation = false;

    @Column(name = "original_slot_id")
    private UUID originalSlotId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "restaurantMeal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<RestaurantMealIngredient> ingredients = new ArrayList<>();

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum EstimationMethod { RECONSTRUCTED, GUIDED, FREE, MIXED }
    public enum PortionSize { SMALL, NORMAL, LARGE }
}
