import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { list, remove, setFavorite } from '../../db/repositories/recipeRepository';
import DifficultyIcon from '../../components/DifficultyIcon';
import MaskIcon from '../../components/MaskIcon';
import ConfirmModal from '../../components/ConfirmModal';
import FavoriteButton from '../../components/FavoriteButton';

export default function RecipeListScreen() {
  const [query, setQuery] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const recipes = useLiveQuery(() => list(), []) ?? [];
  const filtered = recipes.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    await remove(pendingDeleteId);
    setPendingDeleteId(null);
  }

  return (
    <div className="screen">
      <h1>Plats</h1>

      <input
        className="search-input"
        placeholder="Rechercher un plat…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 && <p className="empty-state">Aucun plat — créez-en un d'abord.</p>}

      <ul className="recipe-list">
        {filtered.map((recipe) => (
          <li key={recipe.id} className="recipe-list-item">
            <Link to={`/recipes/${recipe.id}`} className="recipe-list-link">
              <span className="recipe-name">{recipe.name}</span>
              <span className="recipe-meta">
                {recipe.kind === 'PREPARED' ? (
                  <span className="badge">🍱 Plat tout prêt</span>
                ) : (
                  <DifficultyIcon difficulty={recipe.difficulty ?? 'EASY'} />
                )}
                {recipe.isHealthy && <span className="badge badge--healthy">🌿 Healthy</span>}
                <span>{recipe.servings} portion(s)</span>
                {recipe.prepTimeMin != null && <span>{recipe.prepTimeMin} min</span>}
              </span>
            </Link>
            <FavoriteButton
              name={recipe.name}
              isFavorite={Boolean(recipe.isFavorite)}
              onToggle={() => setFavorite(recipe.id!, !recipe.isFavorite)}
            />
            <button type="button" className="icon-button" onClick={() => setPendingDeleteId(recipe.id!)} aria-label="Supprimer">
              <MaskIcon src="/icons/common/trash.svg" color="#e74c3c" />
            </button>
          </li>
        ))}
      </ul>

      <Link to="/recipes/new" className="fab" aria-label="Créer un plat">
        <MaskIcon src="/icons/common/add.svg" color="currentColor" size="2rem" />
      </Link>

      <ConfirmModal
        open={pendingDeleteId !== null}
        message="Supprimer ce plat ?"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
