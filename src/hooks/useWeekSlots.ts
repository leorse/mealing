import { useLiveQuery } from 'dexie-react-hooks';
import { getWeek, listSlotsForWeek } from '../db/repositories/planningRepository';
import type { MealSlot } from '../db/schema';

export function useWeekSlots(weekStart: string): MealSlot[] {
  return (
    useLiveQuery(
      async () => {
        const week = await getWeek(weekStart);
        if (!week?.id) return [];
        return listSlotsForWeek(week.id);
      },
      [weekStart],
      [] as MealSlot[],
    ) ?? []
  );
}
