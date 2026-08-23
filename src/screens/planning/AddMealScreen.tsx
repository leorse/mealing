import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { addSlotForWeek } from '../../db/repositories/planningRepository';
import { startOfWeekIso } from '../../utils/date';
import type { MealSlot } from '../../db/schema';

const MEAL_TYPE_LABELS: Record<MealSlot['mealType'], string> = {
  BREAKFAST: 'Petit-déjeuner',
  LUNCH: 'Déjeuner',
  DINNER: 'Dîner',
  SNACK: 'Collation',
};

export default function AddMealScreen() {
  const { date } = useParams<{ date: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mealType = (searchParams.get('type') as MealSlot['mealType']) ?? 'BREAKFAST';

  const [label, setLabel] = useState('');
  const [calories, setCalories] = useState<number>(0);
  const [isDeviation, setIsDeviation] = useState(false);

  if (!date) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const weekStart = startOfWeekIso(new Date(date!));
    await addSlotForWeek(weekStart, {
      slotDate: date!,
      mealType,
      freeLabel: label,
      portions: 1,
      isDeviation,
      caloriesOverride: calories,
    });
    navigate('/planning');
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <h1>{MEAL_TYPE_LABELS[mealType]}</h1>
      <p>{format(new Date(date), 'EEEE d MMMM', { locale: fr })}</p>

      <label>
        Nom du repas
        <input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Salade de poulet" />
      </label>

      <label>
        Calories (kcal)
        <input
          type="number"
          required
          min={0}
          value={calories}
          onChange={(e) => setCalories(Number(e.target.value))}
        />
      </label>

      <label className="checkbox-label">
        <input type="checkbox" checked={isDeviation} onChange={(e) => setIsDeviation(e.target.checked)} />
        Marquer comme écart prévu
      </label>

      <button type="submit">Ajouter</button>
    </form>
  );
}
