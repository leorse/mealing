import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { remove } from '../../db/repositories/recipeRepository';
import MaskIcon from '../../components/MaskIcon';
import ConfirmModal from '../../components/ConfirmModal';
import RecipeDetailView from '../../components/RecipeDetailView';

export default function RecipeDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!id) return <p className="screen">Plat introuvable.</p>;

  async function confirmDelete() {
    await remove(id!);
    navigate('/recipes');
  }

  return (
    <div className="screen">
      <RecipeDetailView recipeId={id} />

      <div className="detail-actions">
        <Link to={`/recipes/${id}/edit`} className="icon-button" aria-label="Modifier">
          <MaskIcon src="/icons/common/edit.svg" color="currentColor" size="1.4rem" />
        </Link>
        <button type="button" className="icon-button" onClick={() => setConfirmOpen(true)} aria-label="Supprimer">
          <MaskIcon src="/icons/common/trash.svg" color="#e74c3c" size="1.4rem" />
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        message="Supprimer ce plat ?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
