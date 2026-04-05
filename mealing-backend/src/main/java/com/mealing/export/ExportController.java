package com.mealing.export;

import com.mealing.config.UserContext;
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
    private final UserContext userContext;

    @GetMapping("/weekly-report")
    public ResponseEntity<byte[]> weeklyReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week
    ) {
        byte[] pdf = pdfExportService.generateWeeklyReport(week, userContext.getUserId());
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mealing-bilan-" + week + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    @GetMapping("/shopping-list")
    public ResponseEntity<byte[]> shoppingListPdf(@RequestParam UUID weekPlanId) {
        byte[] pdf = pdfExportService.generateShoppingListPdf(weekPlanId, userContext.getUserId());
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mealing-courses.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }
}
