package com.mealing.export;

import com.mealing.mealplan.WeekPlan;
import com.mealing.mealplan.WeekPlanRepository;
import com.mealing.nutrition.DailyLog;
import com.mealing.nutrition.DailyLogRepository;
import com.mealing.shoppinglist.ShoppingList;
import com.mealing.shoppinglist.ShoppingListRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfExportService {

    private final TemplateEngine templateEngine;
    private final WeekPlanRepository weekPlanRepository;
    private final DailyLogRepository dailyLogRepository;
    private final ShoppingListRepository shoppingListRepository;

    public byte[] generateWeeklyReport(LocalDate weekStart, UUID userId) {
        WeekPlan plan = weekPlanRepository.findByUserIdAndWeekStart(userId, weekStart)
            .orElseThrow(() -> new IllegalArgumentException("Planning non trouvé"));

        LocalDate weekEnd = weekStart.plusDays(6);
        List<DailyLog> logs = dailyLogRepository.findByUserIdAndLogDateBetween(userId, weekStart, weekEnd);

        Context ctx = new Context();
        ctx.setVariable("plan", plan);
        ctx.setVariable("logs", logs);
        ctx.setVariable("weekStart", weekStart);
        ctx.setVariable("weekEnd", weekEnd);

        String html = templateEngine.process("weekly-report", ctx);
        return renderToPdf(html);
    }

    public byte[] generateShoppingListPdf(UUID weekPlanId, UUID userId) {
        ShoppingList list = shoppingListRepository.findByWeekPlanIdAndUserId(weekPlanId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Liste non trouvée"));

        Context ctx = new Context();
        ctx.setVariable("list", list);

        String html = templateEngine.process("shopping-list", ctx);
        return renderToPdf(html);
    }

    private byte[] renderToPdf(String html) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            log.error("Erreur génération PDF", e);
            throw new RuntimeException("Erreur génération PDF", e);
        }
    }
}
