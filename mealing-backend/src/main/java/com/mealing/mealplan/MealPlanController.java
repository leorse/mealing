package com.mealing.mealplan;

import com.mealing.config.UserContext;
import com.mealing.mealplan.dto.MealSlotRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final UserContext userContext;

    @GetMapping
    public ResponseEntity<WeekPlan> getWeekPlan(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week
    ) {
        return ResponseEntity.ok(mealPlanService.getWeekPlan(week, userContext.getUserId()));
    }

    @PostMapping
    public ResponseEntity<WeekPlan> createWeekPlan(@RequestBody Map<String, String> body) {
        LocalDate weekStart = LocalDate.parse(body.get("weekStart"));
        return ResponseEntity.ok(mealPlanService.createWeekPlan(weekStart, userContext.getUserId()));
    }

    @PostMapping("/{id}/slots")
    public ResponseEntity<MealSlot> addSlot(
        @PathVariable UUID id,
        @Valid @RequestBody MealSlotRequest req
    ) {
        return ResponseEntity.ok(mealPlanService.addSlot(id, req, userContext.getUserId()));
    }

    @PutMapping("/slots/{slotId}")
    public ResponseEntity<MealSlot> updateSlot(
        @PathVariable UUID slotId,
        @RequestBody MealSlotRequest req
    ) {
        return ResponseEntity.ok(mealPlanService.updateSlot(slotId, req, userContext.getUserId()));
    }

    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<Void> deleteSlot(@PathVariable UUID slotId) {
        mealPlanService.deleteSlot(slotId, userContext.getUserId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/slots/{slotId}/consume")
    public ResponseEntity<MealSlot> markConsumed(@PathVariable UUID slotId) {
        return ResponseEntity.ok(mealPlanService.markConsumed(slotId, userContext.getUserId()));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<WeekPlan> copyWeek(
        @PathVariable UUID id,
        @RequestBody Map<String, String> body
    ) {
        LocalDate targetWeekStart = LocalDate.parse(body.get("targetWeekStart"));
        return ResponseEntity.ok(mealPlanService.copyWeek(id, targetWeekStart, userContext.getUserId()));
    }
}
