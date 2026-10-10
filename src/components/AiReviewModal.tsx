import { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface AiReviewModalProps {
  title: string;
  text: string;
  /** Note sur 10 ; absente pour un bilan de semaine ou un message d'échec. */
  score?: number;
  /** La journée a été modifiée depuis l'avis. */
  isOutdated?: boolean;
  /** Rappel des notes par jour, pour le bilan de la semaine. */
  dayScores?: { label: string; score: number }[];
  /** Message d'échec plutôt qu'avis. */
  isError?: boolean;
  /** L'échec se règle dans les Réglages. */
  showSettingsLink?: boolean;
  onClose: () => void;
}

/** Fenêtre de lecture d'un avis de l'IA, d'un bilan de semaine, ou du message d'une demande échouée. */
export default function AiReviewModal({
  title,
  text,
  score,
  isOutdated = false,
  dayScores,
  isError = false,
  showSettingsLink = false,
  onClose,
}: AiReviewModalProps) {
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
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="card-label">{title}</p>

        {score !== undefined && (
          <p className="calorie-target">
            {score} <span>/ 10</span>
          </p>
        )}

        {isOutdated && <p className="quantity-note">La journée a changé depuis cet avis.</p>}

        <p className="ai-comment">{text}</p>

        {dayScores && dayScores.length > 0 && (
          <ul className="ingredient-list">
            {dayScores.map(({ label, score: dayScore }) => (
              <li key={label} className="ai-day-score">
                <span>{label}</span>
                <span>{dayScore} / 10</span>
              </li>
            ))}
          </ul>
        )}

        {!isError && (
          <p className="quantity-note">Avis indicatif rédigé par une IA : il ne remplace pas un professionnel de santé.</p>
        )}

        {showSettingsLink && (
          <div className="button-row">
            <Link to="/settings">Ouvrir les Réglages</Link>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="modal-button modal-button--yes" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
