import { useEffect, useState } from 'react';
import { update } from '../db/repositories/ingredientRepository';
import { EMPTY_PER_100G, isPer100gDraftValid, per100gDraftOf, per100gFromDraft } from '../services/nutrition';
import NutritionFields from './NutritionFields';
import type { Ingredient } from '../db/schema';

interface IngredientNutritionModalProps {
  /** Aliment personnel à corriger ; `null` ferme la fenêtre. */
  ingredient: Ingredient | null;
  /** Les valeurs sont enregistrées sur l'aliment : l'appelant peut tenir ses propres lignes à jour. */
  onSaved: (ingredient: Ingredient) => void;
  onCancel: () => void;
}

export default function IngredientNutritionModal({ ingredient, onSaved, onCancel }: IngredientNutritionModalProps) {
  const [values, setValues] = useState(EMPTY_PER_100G);

  // Repartir des valeurs de l'aliment à chaque ouverture : ajustement pendant le rendu
  // plutôt que dans un effet, qui déclencherait un rendu en cascade.
  const [shown, setShown] = useState<Ingredient | null>(null);
  if (ingredient !== shown) {
    setShown(ingredient);
    if (ingredient) setValues(per100gDraftOf(ingredient));
  }

  useEffect(() => {
    if (!ingredient) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ingredient, onCancel]);

  if (!ingredient) return null;

  const canSave = isPer100gDraftValid(values);

  async function save() {
    if (!ingredient || !canSave) return;
    const per100g = per100gFromDraft(values);
    await update(ingredient.id!, per100g);
    onSaved({ ...ingredient, ...per100g });
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-card modal-card--picker"
        role="dialog"
        aria-modal="true"
        aria-label="Corriger les valeurs nutritionnelles"
      >
        <p>
          <strong>{ingredient.name}</strong>
        </p>
        <p className="quantity-note">Valeurs pour 100 g, appliquées à tous les plats qui utilisent cet aliment.</p>

        <NutritionFields value={values} onChange={setValues} />

        <div className="modal-actions">
          <button type="button" className="modal-button modal-button--no" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="modal-button modal-button--yes" disabled={!canSave} onClick={save}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
