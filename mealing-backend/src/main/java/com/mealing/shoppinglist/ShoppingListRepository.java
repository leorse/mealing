package com.mealing.shoppinglist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {
    Optional<ShoppingList> findByWeekPlanIdAndUserId(UUID weekPlanId, UUID userId);
    Optional<ShoppingList> findByIdAndUserId(UUID id, UUID userId);
}
