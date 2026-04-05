package com.mealing.nutrition;

import com.mealing.config.UserContext;
import com.mealing.nutrition.dto.CompensationResponse;
import com.mealing.nutrition.dto.DeviationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionService nutritionService;
    private final UserContext userContext;

    @GetMapping("/log")
    public ResponseEntity<DailyLog> getDailyLog(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(nutritionService.getDailyLog(date, userContext.getUserId()));
    }

    @PutMapping("/log/{date}")
    public ResponseEntity<DailyLog> updateDailyLog(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestBody DailyLog update
    ) {
        return ResponseEntity.ok(nutritionService.updateDailyLog(date, update, userContext.getUserId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<List<DailyLog>> getStats(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(nutritionService.getStats(from, to, userContext.getUserId()));
    }

    @PostMapping("/deviations")
    public ResponseEntity<Deviation> addDeviation(@Valid @RequestBody DeviationRequest req) {
        return ResponseEntity.ok(nutritionService.addDeviation(req, userContext.getUserId()));
    }

    @GetMapping("/deviations")
    public ResponseEntity<List<Deviation>> getDeviations() {
        return ResponseEntity.ok(nutritionService.getDeviations(userContext.getUserId()));
    }

    @GetMapping("/deviations/compensation")
    public ResponseEntity<CompensationResponse> getCompensation() {
        return ResponseEntity.ok(nutritionService.getCompensation(userContext.getUserId()));
    }
}
