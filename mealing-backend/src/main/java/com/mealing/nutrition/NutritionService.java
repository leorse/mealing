package com.mealing.nutrition;

import com.mealing.nutrition.dto.CompensationResponse;
import com.mealing.nutrition.dto.DeviationRequest;
import com.mealing.user.UserProfile;
import com.mealing.user.UserProfileRepository;
import com.mealing.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final DailyLogRepository dailyLogRepository;
    private final DeviationRepository deviationRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserService userService;

    public DailyLog getDailyLog(LocalDate date, UUID userId) {
        return dailyLogRepository.findByUserIdAndLogDate(userId, date)
            .orElseGet(() -> {
                DailyLog log = new DailyLog();
                log.setUserId(userId);
                log.setLogDate(date);
                return log;
            });
    }

    @Transactional
    public DailyLog updateDailyLog(LocalDate date, DailyLog update, UUID userId) {
        DailyLog log = dailyLogRepository.findByUserIdAndLogDate(userId, date)
            .orElseGet(() -> {
                DailyLog l = new DailyLog();
                l.setUserId(userId);
                l.setLogDate(date);
                return l;
            });

        if (update.getTotalCalories() != null) log.setTotalCalories(update.getTotalCalories());
        if (update.getTotalProteins() != null) log.setTotalProteins(update.getTotalProteins());
        if (update.getTotalCarbs() != null) log.setTotalCarbs(update.getTotalCarbs());
        if (update.getTotalFat() != null) log.setTotalFat(update.getTotalFat());
        if (update.getTotalFiber() != null) log.setTotalFiber(update.getTotalFiber());
        if (update.getWeightKg() != null) log.setWeightKg(update.getWeightKg());
        if (update.getNotes() != null) log.setNotes(update.getNotes());

        return dailyLogRepository.save(log);
    }

    public List<DailyLog> getStats(LocalDate from, LocalDate to, UUID userId) {
        return dailyLogRepository.findByUserIdAndLogDateBetween(userId, from, to);
    }

    @Transactional
    public Deviation addDeviation(DeviationRequest req, UUID userId) {
        Deviation deviation = Deviation.builder()
            .userId(userId)
            .deviationDate(req.deviationDate())
            .mealSlotId(req.mealSlotId())
            .type(req.type())
            .label(req.label())
            .caloriesExtra(req.caloriesExtra())
            .compensationSpread(req.compensationSpread() != null ? req.compensationSpread() : 2)
            .notes(req.notes())
            .build();
        return deviationRepository.save(deviation);
    }

    public List<Deviation> getDeviations(UUID userId) {
        return deviationRepository.findByUserIdOrderByDeviationDateDesc(userId);
    }

    public CompensationResponse getCompensation(UUID userId) {
        LocalDate today = LocalDate.now();
        List<Deviation> activeDeviations = deviationRepository.findByUserIdAndDeviationDateAfter(userId, today.minusDays(7));

        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        int baseTarget = profile != null && profile.getTargetCalories() != null
            ? profile.getTargetCalories()
            : (int) userService.getObjectives(userId).targetCalories();

        int totalSurplus = activeDeviations.stream()
            .mapToInt(Deviation::getCaloriesExtra)
            .sum();

        List<CompensationResponse.DayAdjustment> adjustments = new ArrayList<>();
        if (totalSurplus > 0) {
            int spread = 2;
            int reductionPerDay = totalSurplus / spread;
            for (int i = 1; i <= spread; i++) {
                LocalDate date = today.plusDays(i);
                int adjusted = Math.max(baseTarget - reductionPerDay, (int)(baseTarget * 0.7));
                adjustments.add(new CompensationResponse.DayAdjustment(date, baseTarget, -reductionPerDay, adjusted));
            }
        }

        return new CompensationResponse(totalSurplus, adjustments);
    }
}
