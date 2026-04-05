package com.mealing.restaurant;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "dish_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DishTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String category;

    @Column(name = "restaurant_type")
    private String restaurantType;

    @Column(name = "calories_small")
    private Integer caloriesSmall;

    @Column(name = "calories_normal", nullable = false)
    private Integer caloriesNormal;

    @Column(name = "calories_large")
    private Integer caloriesLarge;

    @Column(name = "proteins_normal", precision = 7, scale = 2)
    private BigDecimal proteinsNormal;

    @Column(name = "carbs_normal", precision = 7, scale = 2)
    private BigDecimal carbsNormal;

    @Column(name = "fat_normal", precision = 7, scale = 2)
    private BigDecimal fatNormal;

    private String source;
}
