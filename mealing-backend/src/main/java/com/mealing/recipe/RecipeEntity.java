package com.mealing.recipe;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "recipes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecipeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private Integer servings = 1;

    @Column(name = "prep_time_min")
    private Integer prepTimeMin;

    @Column(name = "cook_time_min")
    private Integer cookTimeMin;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(name = "is_healthy")
    private Boolean isHealthy;

    @Column(name = "photo_url")
    private String photoUrl;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Difficulty { EASY, MEDIUM, HARD }
}
