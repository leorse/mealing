package com.mealing.user;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(name = "height_cm", precision = 5, scale = 1)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level")
    private ActivityLevel activityLevel;

    @Enumerated(EnumType.STRING)
    private Goal goal;

    @Column(name = "target_calories")
    private Integer targetCalories;

    @Column(name = "macro_protein_pct")
    private Integer macroProteinPct = 30;

    @Column(name = "macro_carbs_pct")
    private Integer macroCarbsPct = 45;

    @Column(name = "macro_fat_pct")
    private Integer macroFatPct = 25;

    @Column(name = "off_username")
    private String offUsername;

    @Column(name = "off_password")
    private String offPassword;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Gender { MALE, FEMALE, OTHER }
    public enum ActivityLevel { SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE }
    public enum Goal { LOSE, MAINTAIN, GAIN }
}
