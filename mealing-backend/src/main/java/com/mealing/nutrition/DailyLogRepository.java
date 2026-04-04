package com.mealing.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyLogRepository extends JpaRepository<DailyLog, UUID> {
    Optional<DailyLog> findByUserIdAndLogDate(UUID userId, LocalDate logDate);
    List<DailyLog> findByUserIdAndLogDateBetween(UUID userId, LocalDate from, LocalDate to);
}
