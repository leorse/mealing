package com.mealing.shoppinglist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, UUID> {
    Optional<ShoppingItem> findByIdAndShoppingListUserId(UUID id, UUID userId);
}
