package com.mealing.nutrition;

import com.mealing.config.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final NutritionService nutritionService;
    private final UserContext userContext;

    @GetMapping("/daily")
    public ResponseEntity<DailyLog> daily(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(nutritionService.getDailyLog(date, userContext.getUserId()));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<DailyLog>> weekly(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week
    ) {
        return ResponseEntity.ok(nutritionService.getStats(week, week.plusDays(6), userContext.getUserId()));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<DailyLog>> monthly(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month
    ) {
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());
        return ResponseEntity.ok(nutritionService.getStats(month, end, userContext.getUserId()));
    }

    @GetMapping("/trends")
    public ResponseEntity<List<DailyLog>> trends(@RequestParam(defaultValue = "30") int period) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(period);
        return ResponseEntity.ok(nutritionService.getStats(from, to, userContext.getUserId()));
    }
}
