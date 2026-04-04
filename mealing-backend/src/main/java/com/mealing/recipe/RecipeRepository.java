package com.mealing.recipe;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipeRepository extends JpaRepository<RecipeEntity, UUID> {
    List<RecipeEntity> findByUserId(UUID userId);
    Optional<RecipeEntity> findByIdAndUserId(UUID id, UUID userId);
}
