import { useEffect, useRef, useState } from 'react';
import { list as listRecipes, getIngredients, setFavorite } from '../db/repositories/recipeRepository';
import { getById as getIngredientById } from '../db/repositories/ingredientRepository';
import { computeRecipeNutrition, perServing } from '../services/nutrition';
import { addSlotForWeek, updateSlot } from '../db/repositories/planningRepository';
import { startOfWeekIso, fromIsoDate } from '../utils/date';
import FavoriteButton from './FavoriteButton';
import type { MealSlot, Recipe } from '../db/schema';

type Mode = 'RECIPE' | 'DEVIATION';

interface MealPickerModalProps {
  open: boolean;
  slotDate: string;
  mealType: MealSlot['mealType'];
  /** Entrée à modifier ; absent pour un ajout. */
  slot?: MealSlot;
  onClose: () => void;
}

/** Favoris d'abord, puis les autres, chaque groupe par ordre alphabétique. */
function favoritesFirst(recipes: Recipe[]): Recipe[] {
  return [...recipes].sort(
    (a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) || a.name.localeCompare(b.name, 'fr'),
  );
}

/** Calories par portion : lues pour un plat tout prêt, recalculées pour une recette maison. */
async function caloriesPerServingOf(recipe: Recipe): Promise<number> {
  if (recipe.kind === 'PREPARED') return Math.round(recipe.caloriesPerServing ?? 0);
  const recipeIngredients = await getIngredients(recipe.id!);
  const items = (
    await Promise.all(
      recipeIngredients.map(async (ri) => {
        const ingredient = await getIngredientById(ri.ingredientId);
        return ingredient ? { ingredient, quantityG: ri.quantityG } : null;
      }),
    )
  ).filter((i): i is { ingredient: NonNullable<Awaited<ReturnType<typeof getIngredientById>>>; quantityG: number } => i !== null);
  return Math.round(perServing(computeRecipeNutrition(items), recipe.servings).calories);
}

export default function MealPickerModal({ open, slotDate, mealType, slot, onClose }: MealPickerModalProps) {
  const isEdit = slot !== undefined;

  const [mode, setMode] = useState<Mode>('RECIPE');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Repartir de l'état voulu à chaque ouverture : ajustement pendant le rendu
  // plutôt que dans un effet, qui déclencherait un rendu en cascade.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode(slot?.isDeviation ? 'DEVIATION' : 'RECIPE');
      setQuery('');
      setSelectedId(slot?.recipeId ?? null);
      setLabel(slot?.freeLabel ?? '');
      setCalories(slot?.caloriesOverride ?? '');
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    // L'ordre est figé à l'ouverture : un plat marqué pendant le choix ne saute pas sous le doigt.
    listRecipes().then((found) => setRecipes(favoritesFirst(found)));
  }, [open]);

  useEffect(() => {
    if (open && mode === 'RECIPE') searchRef.current?.focus();
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = recipes.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));
  const caloriesIsValid = calories !== '' && calories > 0;
  const canConfirm =
    caloriesIsValid && (mode === 'RECIPE' ? selectedId !== null : label.trim().length > 0);

  function toggleFavorite(recipe: Recipe) {
    const isFavorite = !recipe.isFavorite;
    void setFavorite(recipe.id!, isFavorite);
    setRecipes(recipes.map((r) => (r.id === recipe.id ? { ...r, isFavorite } : r)));
  }

  function chooseRecipe(recipe: Recipe) {
    setSelectedId(recipe.id!);
    setLabel(recipe.name);
    caloriesPerServingOf(recipe).then(setCalories);
  }

  async function confirm() {
    if (!canConfirm || isSaving) return;
    setIsSaving(true);
    const chosen = mode === 'RECIPE' ? recipes.find((r) => r.id === selectedId) : undefined;
    const data = {
      slotDate,
      mealType,
      recipeId: mode === 'RECIPE' ? chosen?.id : undefined,
      freeLabel: mode === 'RECIPE' ? (chosen?.name ?? '') : label.trim(),
      portions: 1,
      isDeviation: mode === 'DEVIATION',
      caloriesOverride: Number(calories),
    };

    if (isEdit && slot?.id) {
      // Autre plat : l'état de ses articles aux courses ne vaut plus, et un écart n'a rien à acheter.
      const recipeChanged = data.recipeId !== slot.recipeId;
      await updateSlot(slot.id, {
        ...data,
        ...(recipeChanged && { shoppingItemStates: undefined }),
        ...(recipeChanged && data.recipeId === undefined && { includeInShopping: false }),
      });
    } else {
      await addSlotForWeek(startOfWeekIso(fromIsoDate(slotDate)), data);
    }
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card--picker" role="dialog" aria-modal="true" aria-label="Ajouter un repas">
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === 'RECIPE' ? 'active' : ''}
            onClick={() => setMode('RECIPE')}
          >
            Plat
          </button>
          <button
            type="button"
            className={mode === 'DEVIATION' ? 'active' : ''}
            onClick={() => setMode('DEVIATION')}
          >
            Écart
          </button>
        </div>

        {mode === 'RECIPE' ? (
          <>
            <input
              ref={searchRef}
              className="picker-search"
              placeholder="Rechercher un plat…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="picker-results">
              {recipes.length === 0 ? (
                <p className="empty-state">Aucun plat enregistré — créez-en un dans l'onglet Plats.</p>
              ) : (
                filtered.length === 0 && <p className="empty-state">Aucun plat ne correspond.</p>
              )}

              <ul className="picker-result-list">
                {filtered.map((recipe) => (
                  <li key={recipe.id} className="picker-result-row">
                    <button
                      type="button"
                      className={`picker-result ${selectedId === recipe.id ? 'selected' : ''}`}
                      onClick={() => chooseRecipe(recipe)}
                    >
                      <span className="picker-result-name">{recipe.name}</span>
                      <span className="picker-result-note">
                        {recipe.kind === 'PREPARED' ? 'tout prêt' : 'maison'}
                      </span>
                    </button>
                    <FavoriteButton
                      name={recipe.name}
                      isFavorite={Boolean(recipe.isFavorite)}
                      onToggle={() => toggleFavorite(recipe)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <label className="picker-quantity">
            Nom de l'écart
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Resto italien" />
          </label>
        )}

        <label className="picker-quantity">
          Calories (kcal)
          <input
            type="number"
            min={1}
            value={calories}
            onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="modal-button modal-button--no" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="modal-button modal-button--yes"
            disabled={!canConfirm || isSaving}
            onClick={confirm}
          >
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
