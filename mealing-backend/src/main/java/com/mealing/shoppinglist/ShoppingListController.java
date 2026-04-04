package com.mealing.shoppinglist;

import com.mealing.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/shopping")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService shoppingListService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<ShoppingList> getList(
        @RequestParam UUID weekPlanId,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(shoppingListService.generateForWeek(weekPlanId, uid(auth)));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ShoppingItem> addManualItem(
        @PathVariable UUID id,
        @RequestBody ShoppingItem item,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(shoppingListService.addManualItem(id, item, uid(auth)));
    }

    @PutMapping("/items/{itemId}/check")
    public ResponseEntity<ShoppingItem> toggleCheck(
        @PathVariable UUID itemId,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(shoppingListService.toggleCheck(itemId, uid(auth)));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(
        @PathVariable UUID itemId,
        @RequestHeader("Authorization") String auth
    ) {
        shoppingListService.deleteItem(itemId, uid(auth));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<String> exportText(
        @PathVariable UUID id,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(shoppingListService.exportAsText(id, uid(auth)));
    }

    private UUID uid(String auth) {
        return jwtService.extractUserId(auth.substring(7));
    }
}
