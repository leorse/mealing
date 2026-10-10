import { useEffect } from 'react';
import type { Ingredient } from '../db/schema';

interface CandidatePickerModalProps {
  open: boolean;
  /** L'ingrédient tel que décrit, rappelé en titre. */
  label: string;
  candidates: Ingredient[];
  selectedId?: string;
  onPick: (ingredient: Ingredient) => void;
  /** Aucun candidat ne convient : l'appelant ouvre la recherche d'ingrédient habituelle. */
  onSearchElsewhere: () => void;
  onCancel: () => void;
}

/** Choix d'un aliment parmi les candidats trouvés pour un ingrédient décrit librement. */
export default function CandidatePickerModal({
  open,
  label,
  candidates,
  selectedId,
  onPick,
  onSearchElsewhere,
  onCancel,
}: CandidatePickerModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card modal-card--picker"
        role="dialog"
        aria-modal="true"
        aria-label={`Choisir l'aliment pour ${label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="card-label">Aliment pour « {label} »</p>

        <div className="picker-results">
          {candidates.length === 0 && <p className="empty-state">Aucun aliment proche n'a été trouvé.</p>}
          <ul className="picker-result-list">
            {candidates.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  className={`picker-result ${candidate.id === selectedId ? 'selected' : ''}`}
                  onClick={() => onPick(candidate)}
                >
                  <span>{candidate.name}</span>
                  <span className="picker-result-note">{Math.round(candidate.calories100g)} kcal / 100 g</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="button-row">
          <button type="button" onClick={onSearchElsewhere}>
            Chercher un autre aliment
          </button>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-button modal-button--no" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
