import type { Per100gDraft } from '../services/nutrition';

const FIELDS: { key: keyof Per100gDraft; label: string }[] = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'proteins', label: 'Protéines (g)' },
  { key: 'carbs', label: 'Glucides (g)' },
  { key: 'fat', label: 'Lipides (g)' },
];

interface NutritionFieldsProps {
  value: Per100gDraft;
  onChange: (value: Per100gDraft) => void;
}

/** Les quatre valeurs pour 100 g d'un aliment personnel, dans une fenêtre modale. */
export default function NutritionFields({ value, onChange }: NutritionFieldsProps) {
  return (
    <div className="nutrition-fields">
      {FIELDS.map(({ key, label }) => (
        <label key={key} className="picker-quantity">
          {label}
          <input
            type="number"
            min={0}
            step="any"
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value === '' ? '' : Number(e.target.value) })}
          />
        </label>
      ))}
    </div>
  );
}
