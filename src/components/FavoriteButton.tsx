import MaskIcon from './MaskIcon';

interface FavoriteButtonProps {
  name: string;
  isFavorite: boolean;
  onToggle: () => void;
}

/** Cœur d'un plat : contour neutre, ou plein rouge quand le plat est favori. */
export default function FavoriteButton({ name, isFavorite, onToggle }: FavoriteButtonProps) {
  const label = isFavorite ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`;

  return (
    <button
      type="button"
      className="icon-button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
    >
      <MaskIcon
        src={isFavorite ? '/icons/common/heart-filled.svg' : '/icons/common/heart.svg'}
        color={isFavorite ? '#e74c3c' : 'currentColor'}
      />
    </button>
  );
}
