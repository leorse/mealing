package com.mealing.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DeviationRepository extends JpaRepository<Deviation, UUID> {
    List<Deviation> findByUserIdOrderByDeviationDateDesc(UUID userId);
    List<Deviation> findByUserIdAndDeviationDateBetween(UUID userId, LocalDate from, LocalDate to);
    List<Deviation> findByUserIdAndDeviationDateAfter(UUID userId, LocalDate date);
}
