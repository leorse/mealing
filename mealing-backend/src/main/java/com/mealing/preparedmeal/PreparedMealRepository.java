package com.mealing.preparedmeal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PreparedMealRepository extends JpaRepository<PreparedMeal, UUID> {
    List<PreparedMeal> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<PreparedMeal> findByUserIdAndIsFavoriteTrueOrderByNameAsc(UUID userId);
    Optional<PreparedMeal> findByBarcode(String barcode);
}
