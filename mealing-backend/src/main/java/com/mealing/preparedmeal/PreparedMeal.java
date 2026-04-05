package com.mealing.preparedmeal;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "prepared_meals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PreparedMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    private String brand;

    @Column(name = "photo_url")
    private String photoUrl;

    private String barcode;

    @Column(name = "nutri_score")
    private String nutriScore;

    @Column(name = "calories_portion", nullable = false, precision = 8, scale = 2)
    private BigDecimal caloriesPortion = BigDecimal.ZERO;

    @Column(name = "proteins_g", precision = 7, scale = 2)
    private BigDecimal proteinsG;

    @Column(name = "carbs_g", precision = 7, scale = 2)
    private BigDecimal carbsG;

    @Column(name = "fat_g", precision = 7, scale = 2)
    private BigDecimal fatG;

    @Column(name = "fiber_g", precision = 7, scale = 2)
    private BigDecimal fiberG;

    @Column(name = "portion_label")
    private String portionLabel;

    @Column(name = "off_id")
    private String offId;

    @Builder.Default
    @Column(name = "is_favorite")
    private Boolean isFavorite = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
