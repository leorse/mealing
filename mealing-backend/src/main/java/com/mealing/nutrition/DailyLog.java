package com.mealing.nutrition;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "total_calories", precision = 8, scale = 2)
    private BigDecimal totalCalories;

    @Column(name = "total_proteins", precision = 8, scale = 2)
    private BigDecimal totalProteins;

    @Column(name = "total_carbs", precision = 8, scale = 2)
    private BigDecimal totalCarbs;

    @Column(name = "total_fat", precision = 8, scale = 2)
    private BigDecimal totalFat;

    @Column(name = "total_fiber", precision = 8, scale = 2)
    private BigDecimal totalFiber;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    private String notes;
}
