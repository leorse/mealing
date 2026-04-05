package com.mealing.shoppinglist;

import com.mealing.config.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/shopping")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService shoppingListService;
    private final UserContext userContext;

    @GetMapping
    public ResponseEntity<ShoppingList> getList(@RequestParam UUID weekPlanId) {
        return ResponseEntity.ok(shoppingListService.generateForWeek(weekPlanId, userContext.getUserId()));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ShoppingItem> addManualItem(@PathVariable UUID id, @RequestBody ShoppingItem item) {
        return ResponseEntity.ok(shoppingListService.addManualItem(id, item, userContext.getUserId()));
    }

    @PutMapping("/items/{itemId}/check")
    public ResponseEntity<ShoppingItem> toggleCheck(@PathVariable UUID itemId) {
        return ResponseEntity.ok(shoppingListService.toggleCheck(itemId, userContext.getUserId()));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable UUID itemId) {
        shoppingListService.deleteItem(itemId, userContext.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<String> exportText(@PathVariable UUID id) {
        return ResponseEntity.ok(shoppingListService.exportAsText(id, userContext.getUserId()));
    }
}
