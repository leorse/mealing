package com.mealing.mealplan;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "week_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WeekPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    private String notes;

    @OneToMany(mappedBy = "weekPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<MealSlot> slots = new ArrayList<>();
}
