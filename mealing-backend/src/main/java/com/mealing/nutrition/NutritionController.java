package com.mealing.nutrition;

import com.mealing.auth.JwtService;
import com.mealing.nutrition.dto.CompensationResponse;
import com.mealing.nutrition.dto.DeviationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionService nutritionService;
    private final JwtService jwtService;

    @GetMapping("/log")
    public ResponseEntity<DailyLog> getDailyLog(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(nutritionService.getDailyLog(date, uid(auth)));
    }

    @PutMapping("/log/{date}")
    public ResponseEntity<DailyLog> updateDailyLog(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestBody DailyLog update,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(nutritionService.updateDailyLog(date, update, uid(auth)));
    }

    @GetMapping("/stats")
    public ResponseEntity<List<DailyLog>> getStats(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(nutritionService.getStats(from, to, uid(auth)));
    }

    @PostMapping("/deviations")
    public ResponseEntity<Deviation> addDeviation(
        @Valid @RequestBody DeviationRequest req,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(nutritionService.addDeviation(req, uid(auth)));
    }

    @GetMapping("/deviations")
    public ResponseEntity<List<Deviation>> getDeviations(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(nutritionService.getDeviations(uid(auth)));
    }

    @GetMapping("/deviations/compensation")
    public ResponseEntity<CompensationResponse> getCompensation(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(nutritionService.getCompensation(uid(auth)));
    }

    private UUID uid(String auth) {
        return jwtService.extractUserId(auth.substring(7));
    }
}
