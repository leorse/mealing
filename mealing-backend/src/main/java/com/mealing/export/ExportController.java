package com.mealing.export;

import com.mealing.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final PdfExportService pdfExportService;
    private final JwtService jwtService;

    @GetMapping("/weekly-report")
    public ResponseEntity<byte[]> weeklyReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
        @RequestHeader("Authorization") String auth
    ) {
        byte[] pdf = pdfExportService.generateWeeklyReport(week, uid(auth));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mealing-bilan-" + week + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    @GetMapping("/shopping-list")
    public ResponseEntity<byte[]> shoppingListPdf(
        @RequestParam UUID weekPlanId,
        @RequestHeader("Authorization") String auth
    ) {
        byte[] pdf = pdfExportService.generateShoppingListPdf(weekPlanId, uid(auth));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mealing-courses.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    private UUID uid(String auth) {
        return jwtService.extractUserId(auth.substring(7));
    }
}
