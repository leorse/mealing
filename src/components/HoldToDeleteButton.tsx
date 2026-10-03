import { useEffect, useRef, useState } from 'react';
import MaskIcon from './MaskIcon';

/** Durée d'appui avant suppression. Reprise telle quelle par l'animation CSS. */
const HOLD_MS = 700;

interface HoldToDeleteButtonProps {
  onConfirm: () => void;
  label: string;
}

/**
 * Suppression par appui maintenu : un clic bref ne fait rien, le disque se remplit
 * pendant l'appui, et relâcher avant la fin annule. Protège d'un appui malencontreux
 * dans une grille dense, sans coûter de surface ni ouvrir de fenêtre.
 */
export default function HoldToDeleteButton({ onConfirm, label }: HoldToDeleteButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancel() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
  }

  function start() {
    if (timerRef.current !== null) return; // appui déjà en cours (répétition clavier)
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setIsHolding(false);
      onConfirm();
    }, HOLD_MS);
  }

  // Une minuterie laissée en vol supprimerait après le démontage — changement de semaine, par exemple.
  useEffect(() => cancel, []);

  return (
    <button
      type="button"
      className={`meal-entry-delete ${isHolding ? 'holding' : ''}`}
      aria-label={label}
      title={label}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if (e.repeat) return;
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancel();
      }}
      onBlur={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MaskIcon src="/icons/common/trash.svg" color="currentColor" size="0.85rem" />
    </button>
  );
}
