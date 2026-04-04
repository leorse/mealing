package com.mealing.ingredient;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ingredients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IngredientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String brand;
    private String barcode;
    private String category;

    @Column(name = "calories_100g", nullable = false, precision = 7, scale = 2)
    private BigDecimal calories100g;

    @Column(name = "proteins_100g", precision = 7, scale = 2)
    private BigDecimal proteins100g;

    @Column(name = "carbs_100g", precision = 7, scale = 2)
    private BigDecimal carbs100g;

    @Column(name = "sugars_100g", precision = 7, scale = 2)
    private BigDecimal sugars100g;

    @Column(name = "fat_100g", precision = 7, scale = 2)
    private BigDecimal fat100g;

    @Column(name = "saturated_fat_100g", precision = 7, scale = 2)
    private BigDecimal saturatedFat100g;

    @Column(name = "fiber_100g", precision = 7, scale = 2)
    private BigDecimal fiber100g;

    @Column(name = "salt_100g", precision = 7, scale = 2)
    private BigDecimal salt100g;

    @Column(name = "glycemic_index")
    private Integer glycemicIndex;

    @Column(name = "nutri_score", columnDefinition = "CHAR(1)")
    private String nutriScore;

    @Column(name = "off_id")
    private String offId;

    @Builder.Default
    @Column(name = "is_custom")
    private Boolean isCustom = false;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
