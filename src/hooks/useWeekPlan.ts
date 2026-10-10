import { useLiveQuery } from 'dexie-react-hooks';
import { getWeek } from '../db/repositories/planningRepository';
import type { WeekPlan } from '../db/schema';

/** Semaine enregistrée, avec ses avis de l'IA ; undefined tant qu'elle n'existe pas ou se charge. Lecture seule. */
export function useWeekPlan(weekStart: string): WeekPlan | undefined {
  return useLiveQuery(() => getWeek(weekStart), [weekStart]);
}
