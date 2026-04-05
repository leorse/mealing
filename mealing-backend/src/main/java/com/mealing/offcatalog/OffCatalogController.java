package com.mealing.offcatalog;

import com.mealing.ingredient.IngredientEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/off-catalog")
@RequiredArgsConstructor
public class OffCatalogController {

    private final OffCatalogService offCatalogService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        OffCatalogService.CatalogStatus s = offCatalogService.getStatus();
        return ResponseEntity.ok(Map.of(
            "available", s.available(),
            "productCount", s.productCount(),
            "path", s.path()
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<List<IngredientEntity>> search(@RequestParam String q) {
        return ResponseEntity.ok(offCatalogService.search(q));
    }
}
