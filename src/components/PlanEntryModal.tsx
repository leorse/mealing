import { useEffect, useState } from 'react';
import type { MealSlot } from '../db/schema';
import MealPickerModal from './MealPickerModal';
import RecipeDetailView from './RecipeDetailView';

type Tab = 'DISH' | 'REPLACE';

interface PlanEntryModalProps {
  /** Entrée du planning qui porte un plat. */
  slot: MealSlot;
  onClose: () => void;
}

/** Fenêtre d'une entrée de plat du planning : sa fiche en lecture seule, ou son remplacement. */
export default function PlanEntryModal({ slot, onClose }: PlanEntryModalProps) {
  const [tab, setTab] = useState<Tab>('DISH');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-card--picker"
        role="dialog"
        aria-modal="true"
        aria-label={slot.freeLabel ?? 'Plat'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mode-toggle" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'DISH'} className={tab === 'DISH' ? 'active' : ''} onClick={() => setTab('DISH')}>
            Plat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'REPLACE'}
            className={tab === 'REPLACE' ? 'active' : ''}
            onClick={() => setTab('REPLACE')}
          >
            Remplacer
          </button>
        </div>

        {tab === 'DISH' ? (
          <div className="plan-entry-detail">
            {slot.recipeId && <RecipeDetailView recipeId={slot.recipeId} />}
            <div className="modal-actions">
              <button type="button" className="modal-button modal-button--no" onClick={onClose}>
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <MealPickerModal open embedded slotDate={slot.slotDate} mealType={slot.mealType} slot={slot} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
