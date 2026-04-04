package com.mealing.mealplan;

import com.mealing.auth.JwtService;
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
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<WeekPlan> getWeekPlan(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(mealPlanService.getWeekPlan(week, uid(auth)));
    }

    @PostMapping
    public ResponseEntity<WeekPlan> createWeekPlan(
        @RequestBody Map<String, String> body,
        @RequestHeader("Authorization") String auth
    ) {
        LocalDate weekStart = LocalDate.parse(body.get("weekStart"));
        return ResponseEntity.ok(mealPlanService.createWeekPlan(weekStart, uid(auth)));
    }

    @PostMapping("/{id}/slots")
    public ResponseEntity<MealSlot> addSlot(
        @PathVariable UUID id,
        @Valid @RequestBody MealSlotRequest req,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(mealPlanService.addSlot(id, req, uid(auth)));
    }

    @PutMapping("/slots/{slotId}")
    public ResponseEntity<MealSlot> updateSlot(
        @PathVariable UUID slotId,
        @RequestBody MealSlotRequest req,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(mealPlanService.updateSlot(slotId, req, uid(auth)));
    }

    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<Void> deleteSlot(
        @PathVariable UUID slotId,
        @RequestHeader("Authorization") String auth
    ) {
        mealPlanService.deleteSlot(slotId, uid(auth));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/slots/{slotId}/consume")
    public ResponseEntity<MealSlot> markConsumed(
        @PathVariable UUID slotId,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(mealPlanService.markConsumed(slotId, uid(auth)));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<WeekPlan> copyWeek(
        @PathVariable UUID id,
        @RequestBody Map<String, String> body,
        @RequestHeader("Authorization") String auth
    ) {
        LocalDate targetWeekStart = LocalDate.parse(body.get("targetWeekStart"));
        return ResponseEntity.ok(mealPlanService.copyWeek(id, targetWeekStart, uid(auth)));
    }

    private UUID uid(String auth) {
        return jwtService.extractUserId(auth.substring(7));
    }
}
