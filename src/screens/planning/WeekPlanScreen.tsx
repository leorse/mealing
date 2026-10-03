import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUiStore } from '../../store/useUiStore';
import { useWeekSlots } from '../../hooks/useWeekSlots';
import { deleteSlot } from '../../db/repositories/planningRepository';
import { useProfile, PROFILE_LOADING } from '../../hooks/useProfile';
import { computeTargetCalories } from '../../services/nutrition';
import { addDays, weekDates } from '../../utils/date';
import MaskIcon from '../../components/MaskIcon';
import MealPickerModal from '../../components/MealPickerModal';
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
  const [adding, setAdding] = useState<{ date: string; type: MealSlot['mealType'] } | null>(null);
  const [editing, setEditing] = useState<MealSlot | null>(null);

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
                  const typeSlots = daySlots.filter((s) => s.mealType === type);
                  return (
                    <div key={type} className="meal-group">
                      <span className="meal-slot-type">{label}</span>

                      {typeSlots.map((slot) => (
                        <div key={slot.id} className="meal-slot meal-slot--filled">
                          <button
                            type="button"
                            className="meal-entry"
                            onClick={() => setEditing(slot)}
                            aria-label={`Modifier ${slot.freeLabel}`}
                          >
                            <span className="meal-entry-name">{slot.freeLabel}</span>
                            <span className="meal-slot-kcal">{slotCalories(slot)} kcal</span>
                          </button>
                          <button
                            type="button"
                            className="meal-entry-delete"
                            onClick={() => deleteSlot(slot.id!)}
                            aria-label={`Supprimer ${slot.freeLabel}`}
                          >
                            <MaskIcon src="/icons/common/trash.svg" color="#e74c3c" size="0.85rem" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="meal-slot meal-slot--empty"
                        onClick={() => setAdding({ date, type })}
                        aria-label={`Ajouter un ${label.toLowerCase()}`}
                      >
                        <MaskIcon src="/icons/common/add.svg" color="currentColor" size="1rem" />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {adding && (
        <MealPickerModal
          open
          slotDate={adding.date}
          mealType={adding.type}
          onClose={() => setAdding(null)}
        />
      )}

      {editing && (
        <MealPickerModal
          open
          slotDate={editing.slotDate}
          mealType={editing.mealType}
          slot={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
