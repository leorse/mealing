package com.mealing.nutrition;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "deviations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Deviation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "deviation_date", nullable = false)
    private LocalDate deviationDate;

    @Column(name = "meal_slot_id")
    private UUID mealSlotId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviationType type;

    private String label;

    @Column(name = "calories_extra", nullable = false)
    private Integer caloriesExtra;

    @Column(name = "compensation_spread")
    private Integer compensationSpread = 2;

    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum DeviationType { PLANNED, UNPLANNED }
}
