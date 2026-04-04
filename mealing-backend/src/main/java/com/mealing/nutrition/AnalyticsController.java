package com.mealing.nutrition;

import com.mealing.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final NutritionService nutritionService;
    private final JwtService jwtService;

    @GetMapping("/daily")
    public ResponseEntity<DailyLog> daily(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(nutritionService.getDailyLog(date, uid(auth)));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<DailyLog>> weekly(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
        @RequestHeader("Authorization") String auth
    ) {
        return ResponseEntity.ok(nutritionService.getStats(week, week.plusDays(6), uid(auth)));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<DailyLog>> monthly(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month,
        @RequestHeader("Authorization") String auth
    ) {
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());
        return ResponseEntity.ok(nutritionService.getStats(month, end, uid(auth)));
    }

    @GetMapping("/trends")
    public ResponseEntity<List<DailyLog>> trends(
        @RequestParam(defaultValue = "30") int period,
        @RequestHeader("Authorization") String auth
    ) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(period);
        return ResponseEntity.ok(nutritionService.getStats(from, to, uid(auth)));
    }

    private UUID uid(String auth) {
        return jwtService.extractUserId(auth.substring(7));
    }
}
