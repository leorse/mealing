import { getDb, uuidv4, now, USER_ID } from './database';
import type { UserProfile, Objectives } from '../api/profile';

function computeBMR(profile: UserProfile): number {
  const { weightKg = 70, heightCm = 170, birthDate, gender = 'MALE' } = profile;
  const age = birthDate
    ? new Date().getFullYear() - new Date(birthDate).getFullYear()
    : 30;
  if (gender === 'MALE') return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, ACTIVE: 1.725, VERY_ACTIVE: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
  LOSE: -500, MAINTAIN: 0, GAIN: 300,
};

export const profileDbApi = {
  get: async () => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [USER_ID]
    );
    if (!row) return { data: {} as UserProfile };
    return { data: rowToProfile(row) };
  },

  update: async (profile: UserProfile) => {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [USER_ID]
    );
    const ts = now();
    if (existing) {
      await db.runAsync(
        `UPDATE user_profiles SET first_name=?, birth_date=?, gender=?, height_cm=?,
          weight_kg=?, activity_level=?, goal=?, target_calories=?,
          macro_protein_pct=?, macro_carbs_pct=?, macro_fat_pct=?, updated_at=?
         WHERE user_id=?`,
        [
          profile.firstName ?? null, profile.birthDate ?? null, profile.gender ?? null,
          profile.heightCm ?? null, profile.weightKg ?? null,
          profile.activityLevel ?? null, profile.goal ?? null,
          profile.targetCalories ?? null,
          profile.macroProteinPct ?? 30, profile.macroCarbsPct ?? 45,
          profile.macroFatPct ?? 25, ts, USER_ID,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO user_profiles (id, user_id, first_name, birth_date, gender, height_cm,
          weight_kg, activity_level, goal, target_calories, macro_protein_pct,
          macro_carbs_pct, macro_fat_pct, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          uuidv4(), USER_ID, profile.firstName ?? null, profile.birthDate ?? null,
          profile.gender ?? null, profile.heightCm ?? null, profile.weightKg ?? null,
          profile.activityLevel ?? null, profile.goal ?? null, profile.targetCalories ?? null,
          profile.macroProteinPct ?? 30, profile.macroCarbsPct ?? 45,
          profile.macroFatPct ?? 25, ts,
        ]
      );
    }
    return profileDbApi.get();
  },

  getObjectives: async () => {
    const { data: profile } = await profileDbApi.get();
    const bmr = Math.round(computeBMR(profile));
    const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel ?? 'MODERATE'] ?? 1.55;
    const tdee = Math.round(bmr * multiplier);
    const adjustment = GOAL_ADJUSTMENTS[profile.goal ?? 'MAINTAIN'] ?? 0;
    const targetCalories = profile.targetCalories ?? Math.max(1200, tdee + adjustment);

    const protPct = (profile.macroProteinPct ?? 30) / 100;
    const carbsPct = (profile.macroCarbsPct ?? 45) / 100;
    const fatPct = (profile.macroFatPct ?? 25) / 100;

    return {
      data: {
        bmr,
        tdee,
        targetCalories,
        targetProteinG: Math.round((targetCalories * protPct) / 4),
        targetCarbsG: Math.round((targetCalories * carbsPct) / 4),
        targetFatG: Math.round((targetCalories * fatPct) / 9),
      } as Objectives,
    };
  },
};

function rowToProfile(row: any): UserProfile {
  return {
    firstName: row.first_name ?? undefined,
    birthDate: row.birth_date ?? undefined,
    gender: row.gender ?? undefined,
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    activityLevel: row.activity_level ?? undefined,
    goal: row.goal ?? undefined,
    targetCalories: row.target_calories ?? undefined,
    macroProteinPct: row.macro_protein_pct ?? 30,
    macroCarbsPct: row.macro_carbs_pct ?? 45,
    macroFatPct: row.macro_fat_pct ?? 25,
  };
}
