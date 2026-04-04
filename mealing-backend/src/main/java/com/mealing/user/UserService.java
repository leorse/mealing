package com.mealing.user;

import com.mealing.user.dto.ObjectivesResponse;
import com.mealing.user.dto.UserProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository profileRepository;

    public UserProfile getProfile(UUID userId) {
        return profileRepository.findByUserId(userId)
            .orElseGet(() -> {
                UserProfile empty = new UserProfile();
                empty.setUserId(userId);
                return empty;
            });
    }

    @Transactional
    public UserProfile updateProfile(UUID userId, UserProfileRequest req) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> {
                UserProfile p = new UserProfile();
                p.setUserId(userId);
                return p;
            });

        if (req.firstName() != null) profile.setFirstName(req.firstName());
        if (req.birthDate() != null) profile.setBirthDate(req.birthDate());
        if (req.gender() != null) profile.setGender(req.gender());
        if (req.heightCm() != null) profile.setHeightCm(req.heightCm());
        if (req.weightKg() != null) profile.setWeightKg(req.weightKg());
        if (req.activityLevel() != null) profile.setActivityLevel(req.activityLevel());
        if (req.goal() != null) profile.setGoal(req.goal());
        if (req.targetCalories() != null) profile.setTargetCalories(req.targetCalories());
        if (req.macroProteinPct() != null) profile.setMacroProteinPct(req.macroProteinPct());
        if (req.macroCarbsPct() != null) profile.setMacroCarbsPct(req.macroCarbsPct());
        if (req.macroFatPct() != null) profile.setMacroFatPct(req.macroFatPct());
        if (req.offUsername() != null) profile.setOffUsername(req.offUsername());
        // Permettre d'effacer le mot de passe en envoyant une chaîne vide
        if (req.offPassword() != null) profile.setOffPassword(req.offPassword().isBlank() ? null : req.offPassword());

        return profileRepository.save(profile);
    }

    public ObjectivesResponse getObjectives(UUID userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalStateException("Profil non trouvé"));

        double bmr = calculateBmr(profile);
        double tdee = calculateTdee(bmr, profile.getActivityLevel());
        int targetCalories = calculateTargetCalories(tdee, profile.getGoal(), profile.getTargetCalories());

        int proteinPct = profile.getMacroProteinPct() != null ? profile.getMacroProteinPct() : 30;
        int carbsPct = profile.getMacroCarbsPct() != null ? profile.getMacroCarbsPct() : 45;
        int fatPct = profile.getMacroFatPct() != null ? profile.getMacroFatPct() : 25;

        // Protéines : 4 kcal/g, glucides : 4 kcal/g, lipides : 9 kcal/g
        int proteinG = (int) (targetCalories * proteinPct / 100.0 / 4);
        int carbsG = (int) (targetCalories * carbsPct / 100.0 / 4);
        int fatG = (int) (targetCalories * fatPct / 100.0 / 9);

        return new ObjectivesResponse(bmr, tdee, targetCalories, proteinG, carbsG, fatG);
    }

    private double calculateBmr(UserProfile profile) {
        if (profile.getWeightKg() == null || profile.getHeightCm() == null || profile.getBirthDate() == null) {
            return 0;
        }
        double weight = profile.getWeightKg().doubleValue();
        double height = profile.getHeightCm().doubleValue();
        int age = Period.between(profile.getBirthDate(), LocalDate.now()).getYears();

        double bmr = (10 * weight) + (6.25 * height) - (5 * age);
        if (profile.getGender() == UserProfile.Gender.FEMALE) {
            bmr -= 161;
        } else {
            bmr += 5;
        }
        return bmr;
    }

    private double calculateTdee(double bmr, UserProfile.ActivityLevel level) {
        if (level == null) return bmr * 1.55;
        return switch (level) {
            case SEDENTARY -> bmr * 1.2;
            case LIGHT -> bmr * 1.375;
            case MODERATE -> bmr * 1.55;
            case ACTIVE -> bmr * 1.725;
            case VERY_ACTIVE -> bmr * 1.9;
        };
    }

    private int calculateTargetCalories(double tdee, UserProfile.Goal goal, Integer manualTarget) {
        if (manualTarget != null) return manualTarget;
        if (goal == null) return (int) tdee;
        return switch (goal) {
            case LOSE -> (int) (tdee * 0.8);
            case MAINTAIN -> (int) tdee;
            case GAIN -> (int) (tdee * 1.15);
        };
    }
}
