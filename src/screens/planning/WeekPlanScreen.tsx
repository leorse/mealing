import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUiStore } from '../../store/useUiStore';
import { useWeekSlots } from '../../hooks/useWeekSlots';
import { useProfile, PROFILE_LOADING } from '../../hooks/useProfile';
import { computeTargetCalories } from '../../services/nutrition';
import { addDays, weekDates } from '../../utils/date';
import type { MealSlot } from '../../db/schema';

const MEAL_TYPES: { type: MealSlot['mealType']; label: string }[] = [
  { type: 'BREAKFAST', label: 'Petit-déj' },
  { type: 'LUNCH', label: 'Déjeuner' },
  { type: 'DINNER', label: 'Dîner' },
  { type: 'SNACK', label: 'Collation' },
];

function slotCalories(slot: MealSlot): number {
  return slot.caloriesOverride ?? 0;
}

function dayStatus(dayCalories: number, target: number): 'ok' | 'warn' | 'over' {
  if (dayCalories <= target * 1.1 && dayCalories >= target * 0.9) return 'ok';
  if (dayCalories > target * 1.1) return 'over';
  return 'warn';
}

export default function WeekPlanScreen() {
  const { selectedWeekStart, setSelectedWeekStart } = useUiStore();
  const slots = useWeekSlots(selectedWeekStart);
  const profile = useProfile();

  if (profile === PROFILE_LOADING || profile === undefined) return null;

  const target = computeTargetCalories(profile);
  const days = weekDates(selectedWeekStart);

  return (
    <div className="screen screen--wide">
      <header className="week-header">
        <button type="button" onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))} aria-label="Semaine précédente">
          ‹
        </button>
        <h1>Semaine du {format(new Date(selectedWeekStart), 'd MMM', { locale: fr })}</h1>
        <button type="button" onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))} aria-label="Semaine suivante">
          ›
        </button>
      </header>

      <div className="week-grid-scroll">
        <div className="week-grid">
          {days.map((date) => {
            const daySlots = slots.filter((s) => s.slotDate === date);
            const dayCalories = daySlots.reduce((sum, s) => sum + slotCalories(s), 0);
            const status = dayStatus(dayCalories, target);

            return (
              <div key={date} className="day-column">
                <div className="day-column-header">
                  <span className="day-name">{format(new Date(date), 'EEE d', { locale: fr })}</span>
                  <span className={`day-total day-total--${status}`}>{dayCalories} kcal</span>
                </div>

                {MEAL_TYPES.map(({ type, label }) => {
                  const slot = daySlots.find((s) => s.mealType === type);
                  return slot ? (
                    <div key={type} className="meal-slot meal-slot--filled">
                      <span className="meal-slot-type">{label}</span>
                      <span>{slot.freeLabel}</span>
                      <span className="meal-slot-kcal">{slotCalories(slot)} kcal</span>
                    </div>
                  ) : (
                    <Link key={type} to={`/planning/${date}/add?type=${type}`} className="meal-slot meal-slot--empty">
                      <span className="meal-slot-type">{label}</span>
                      <span>+</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
