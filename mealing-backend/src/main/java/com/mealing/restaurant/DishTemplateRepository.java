package com.mealing.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DishTemplateRepository extends JpaRepository<DishTemplate, UUID> {

    @Query("SELECT d FROM DishTemplate d WHERE " +
           "(:q IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
           "(:category IS NULL OR d.category = :category) " +
           "ORDER BY d.name")
    List<DishTemplate> search(@Param("q") String q, @Param("category") String category);
}
