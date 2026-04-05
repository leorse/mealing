package com.mealing.ingredient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IngredientRepository extends JpaRepository<IngredientEntity, UUID> {

    @Query("SELECT i FROM IngredientEntity i WHERE " +
           "LOWER(i.name) LIKE LOWER(CONCAT('%', :q, '%')) AND " +
           "(i.isCustom = false OR i.userId = :userId) " +
           "ORDER BY i.name")
    List<IngredientEntity> searchByName(@Param("q") String q, @Param("userId") UUID userId);

    Optional<IngredientEntity> findByBarcode(String barcode);

    List<IngredientEntity> findByUserIdOrIsCustomFalse(UUID userId);

    List<IngredientEntity> findByNameIgnoreCase(String name);

    Optional<IngredientEntity> findByOffId(String offId);

    long countBySource(String source);
}
