import { useEffect, useRef, useState } from 'react';
import { search as searchIngredients, setPortion } from '../db/repositories/ingredientRepository';
import { formatGrams, gramsFor, hasOwnUnit, hasPortion, pluralizeUnit } from '../services/portions';
import MaskIcon from './MaskIcon';
import type { Ingredient } from '../db/schema';

const MIN_QUERY_LENGTH = 2;
const DEFAULT_QUANTITY_G = 100;

type Mode = 'G' | 'UNIT';

export interface IngredientChoice {
  ingredient: Ingredient;
  quantityG: number;
  /** Présent quand la quantité a été saisie en unités de l'aliment. */
  unitCount?: number;
}

interface IngredientPickerModalProps {
  open: boolean;
  /** Ingrédients déjà présents dans la recette : affichés, mais non sélectionnables. */
  existingIngredientIds: string[];
  onConfirm: (choice: IngredientChoice) => void;
  onCancel: () => void;
  /** L'unité d'un aliment vient d'être corrigée : l'appelant peut tenir ses propres lignes à jour. */
  onIngredientChange?: (ingredient: Ingredient) => void;
}

export default function IngredientPickerModal({
  open,
  existingIngredientIds,
  onConfirm,
  onCancel,
  onIngredientChange,
}: IngredientPickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [mode, setMode] = useState<Mode>('G');
  const [quantity, setQuantity] = useState<number | ''>(DEFAULT_QUANTITY_G);
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [unitLabel, setUnitLabel] = useState('');
  const [unitG, setUnitG] = useState<number | ''>('');
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
      setMode('G');
      setQuantity(DEFAULT_QUANTITY_G);
      setIsEditingUnit(false);
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

  const quantityIsValid = quantity !== '' && quantity > 0;
  const canConfirm = selected !== null && quantityIsValid;
  const searched = query.trim().length >= MIN_QUERY_LENGTH;
  // Sous le seuil, on n'affiche rien plutôt que de vider l'état depuis l'effet.
  const visibleResults = searched ? results : [];
  const unitIsValid = unitLabel.trim().length > 0 && unitG !== '' && unitG > 0;

  /** Un aliment à unité propre se compte d'emblée ; les autres restent en grammes. */
  function select(ingredient: Ingredient) {
    setSelected(ingredient);
    setIsEditingUnit(false);
    if (hasOwnUnit(ingredient)) {
      setMode('UNIT');
      setQuantity(1);
    } else {
      setMode('G');
      setQuantity(DEFAULT_QUANTITY_G);
    }
  }

  /** Changer de mode convertit la valeur saisie au lieu de la perdre. */
  function changeMode(next: Mode) {
    if (next === mode || !selected || !hasPortion(selected)) return;
    if (quantity !== '') {
      setQuantity(
        next === 'G'
          ? Math.round(gramsFor(quantity, selected.portionG))
          : Math.max(0.5, Math.round((quantity / selected.portionG) * 2) / 2),
      );
    }
    setMode(next);
  }

  function openUnitEditor() {
    if (!selected) return;
    setUnitLabel(selected.portionLabel ?? '');
    setUnitG(selected.portionG ?? '');
    setIsEditingUnit(true);
  }

  async function saveUnit() {
    if (!selected || !unitIsValid) return;
    const updated = await setPortion(selected.id!, { portionG: Number(unitG), portionLabel: unitLabel.trim() });
    if (!updated) return;
    setSelected(updated);
    setResults(results.map((r) => (r.id === updated.id ? updated : r)));
    setIsEditingUnit(false);
    onIngredientChange?.(updated);
  }

  function confirm() {
    if (!selected || !quantityIsValid) return;
    if (mode === 'UNIT' && hasPortion(selected)) {
      onConfirm({ ingredient: selected, quantityG: gramsFor(quantity, selected.portionG), unitCount: quantity });
    } else {
      onConfirm({ ingredient: selected, quantityG: quantity });
    }
  }

  const isCounting = mode === 'UNIT' && selected !== null && hasPortion(selected);

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
                    onClick={() => select(ingredient)}
                  >
                    <span className="picker-result-name">{ingredient.name}</span>
                    {alreadyAdded && <span className="picker-result-note">déjà ajouté</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected && hasPortion(selected) && (
          <div className="mode-toggle">
            <button type="button" className={mode === 'UNIT' ? 'active' : ''} onClick={() => changeMode('UNIT')}>
              {selected.portionLabel}
            </button>
            <button type="button" className={mode === 'G' ? 'active' : ''} onClick={() => changeMode('G')}>
              g
            </button>
          </div>
        )}

        <label className="picker-quantity">
          {isCounting ? `Nombre (${selected.portionLabel})` : 'Quantité (g)'}
          <input
            type="number"
            min={isCounting ? 0.5 : 1}
            step={isCounting ? 0.5 : 1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>

        {isCounting && quantityIsValid && (
          <p className="quantity-note">= {formatGrams(gramsFor(quantity, selected.portionG))}</p>
        )}

        {selected &&
          (isEditingUnit ? (
            <div className="picker-unit-editor">
              <label className="picker-quantity">
                Nom de l'unité
                <input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="tranche" />
              </label>
              <label className="picker-quantity">
                Poids (g)
                <input
                  type="number"
                  min={1}
                  value={unitG}
                  onChange={(e) => setUnitG(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className="icon-button"
                disabled={!unitIsValid}
                onClick={saveUnit}
                aria-label="Enregistrer l'unité"
                title="Enregistrer l'unité"
              >
                <MaskIcon src="/icons/common/save.svg" color="currentColor" size="1.4rem" />
              </button>
            </div>
          ) : (
            <div className="picker-unit">
              <span className="quantity-note">
                {hasPortion(selected)
                  ? `1 ${pluralizeUnit(selected.portionLabel, 1)} = ${formatGrams(selected.portionG)}`
                  : 'Aucune unité définie pour cet aliment'}
              </span>
              <button
                type="button"
                className="icon-button"
                onClick={openUnitEditor}
                aria-label={hasPortion(selected) ? "Corriger l'unité" : 'Définir une unité'}
                title={hasPortion(selected) ? "Corriger l'unité" : 'Définir une unité'}
              >
                <MaskIcon src="/icons/common/edit.svg" color="currentColor" />
              </button>
            </div>
          ))}

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
