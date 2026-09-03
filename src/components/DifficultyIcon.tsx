import type { Recipe } from '../db/schema';

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Élaboré',
};

export default function DifficultyIcon({ difficulty }: { difficulty: NonNullable<Recipe['difficulty']> }) {
  return (
    <span
      className={`difficulty-icon difficulty-icon--${difficulty}`}
      role="img"
      aria-label={DIFFICULTY_LABELS[difficulty]}
      title={DIFFICULTY_LABELS[difficulty]}
    />
  );
}
