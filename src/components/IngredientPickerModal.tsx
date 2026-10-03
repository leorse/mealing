import { useEffect, useRef, useState } from 'react';
import { search as searchIngredients } from '../db/repositories/ingredientRepository';
import type { Ingredient } from '../db/schema';

const MIN_QUERY_LENGTH = 2;
const DEFAULT_QUANTITY_G = 100;

interface IngredientPickerModalProps {
  open: boolean;
  /** Ingrédients déjà présents dans la recette : affichés, mais non sélectionnables. */
  existingIngredientIds: string[];
  onConfirm: (choice: { ingredient: Ingredient; quantityG: number }) => void;
  onCancel: () => void;
}

export default function IngredientPickerModal({
  open,
  existingIngredientIds,
  onConfirm,
  onCancel,
}: IngredientPickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [quantityG, setQuantityG] = useState<number | ''>(DEFAULT_QUANTITY_G);
  const searchRef = useRef<HTMLInputElement>(null);

  // Repartir d'une fenêtre vierge à chaque ouverture : ajustement pendant le rendu
  // plutôt que dans un effet, qui déclencherait un rendu en cascade.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setQuantityG(DEFAULT_QUANTITY_G);
    }
  }

  // Le focus est un effet de bord sur le DOM : il reste dans un effet.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open || query.trim().length < MIN_QUERY_LENGTH) return;
    let cancelled = false;
    searchIngredients(query).then((found) => {
      if (!cancelled) setResults(found);
    });
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  if (!open) return null;

  const quantityIsValid = quantityG !== '' && quantityG > 0;
  const canConfirm = selected !== null && quantityIsValid;
  const searched = query.trim().length >= MIN_QUERY_LENGTH;
  // Sous le seuil, on n'affiche rien plutôt que de vider l'état depuis l'effet.
  const visibleResults = searched ? results : [];

  function confirm() {
    if (!selected || !quantityIsValid) return;
    onConfirm({ ingredient: selected, quantityG: Number(quantityG) });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card--picker" role="dialog" aria-modal="true" aria-label="Ajouter un ingrédient">
        <input
          ref={searchRef}
          className="picker-search"
          placeholder="Rechercher un ingrédient…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="picker-results">
          {searched && visibleResults.length === 0 && (
            <p className="empty-state">Aucun ingrédient ne correspond à cette recherche.</p>
          )}

          <ul className="picker-result-list">
            {visibleResults.map((ingredient) => {
              const alreadyAdded = existingIngredientIds.includes(ingredient.id!);
              return (
                <li key={ingredient.id}>
                  <button
                    type="button"
                    className={`picker-result ${selected?.id === ingredient.id ? 'selected' : ''}`}
                    disabled={alreadyAdded}
                    onClick={() => setSelected(ingredient)}
                  >
                    <span className="picker-result-name">{ingredient.name}</span>
                    {alreadyAdded && <span className="picker-result-note">déjà ajouté</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <label className="picker-quantity">
          Quantité (g)
          <input
            type="number"
            min={1}
            value={quantityG}
            onChange={(e) => setQuantityG(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="modal-button modal-button--no" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="modal-button modal-button--yes" disabled={!canConfirm} onClick={confirm}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
