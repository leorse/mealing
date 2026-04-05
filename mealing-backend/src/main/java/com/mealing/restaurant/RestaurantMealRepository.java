package com.mealing.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantMealRepository extends JpaRepository<RestaurantMeal, UUID> {
    List<RestaurantMeal> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<RestaurantMeal> findByIdAndUserId(UUID id, UUID userId);
}
