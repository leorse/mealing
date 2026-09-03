import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getById, getIngredients, remove } from '../../db/repositories/recipeRepository';
import { getById as getIngredientById } from '../../db/repositories/ingredientRepository';
import { computeRecipeNutrition, perServing } from '../../services/nutrition';
import DifficultyIcon from '../../components/DifficultyIcon';
import MaskIcon from '../../components/MaskIcon';
import ConfirmModal from '../../components/ConfirmModal';

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function RecipeDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const data = useLiveQuery(async () => {
    if (!id) return undefined;
    const recipe = await getById(id);
    if (!recipe) return null;
    if (recipe.kind === 'PREPARED') return { recipe, items: [], totals: null, per: null };

    const recipeIngredients = await getIngredients(id);
    const items = await Promise.all(
      recipeIngredients.map(async (ri) => {
        const ingredient = await getIngredientById(ri.ingredientId);
        return ingredient ? { ingredient, quantityG: ri.quantityG } : null;
      }),
    );
    const resolvedItems = items.filter((i): i is { ingredient: NonNullable<typeof i>['ingredient']; quantityG: number } => i !== null);
    const totals = computeRecipeNutrition(resolvedItems);
    const per = perServing(totals, recipe.servings);
    return { recipe, items: resolvedItems, totals, per };
  }, [id]);

  if (data === undefined) return null;
  if (data === null) return <p className="screen">Recette introuvable.</p>;

  const { recipe, items, totals, per } = data;
  const isPrepared = recipe.kind === 'PREPARED';

  async function confirmDelete() {
    await remove(id!);
    navigate('/recipes');
  }

  return (
    <div className="screen">
      <h1>{recipe.name}</h1>
      {recipe.description && <p>{recipe.description}</p>}

      <div className="recipe-badges">
        {isPrepared ? (
          <span className="badge">🍱 Plat tout prêt</span>
        ) : (
          <DifficultyIcon difficulty={recipe.difficulty ?? 'EASY'} />
        )}
        {recipe.isHealthy && <span className="badge badge--healthy">🌿 Healthy</span>}
        <span>{recipe.servings} portion(s)</span>
        {!isPrepared && recipe.prepTimeMin != null && <span>Préparation {recipe.prepTimeMin} min</span>}
        {!isPrepared && recipe.cookTimeMin != null && <span>Cuisson {recipe.cookTimeMin} min</span>}
      </div>

      {!isPrepared && (
        <section className="card">
          <p className="card-label">Ingrédients</p>
          <ul className="ingredient-list">
            {items.map(({ ingredient, quantityG }) => (
              <li key={ingredient.id}>
                {ingredient.name} — {quantityG} g
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <p className="card-label">Valeurs nutritionnelles {isPrepared ? '(par portion)' : ''}</p>
        {isPrepared ? (
          <table className="nutrition-table">
            <tbody>
              <tr>
                <td>Calories</td>
                <td>{recipe.caloriesPerServing} kcal</td>
              </tr>
              {recipe.proteinsPerServing != null && (
                <tr>
                  <td>Protéines</td>
                  <td>{recipe.proteinsPerServing} g</td>
                </tr>
              )}
              {recipe.carbsPerServing != null && (
                <tr>
                  <td>Glucides</td>
                  <td>{recipe.carbsPerServing} g</td>
                </tr>
              )}
              {recipe.fatPerServing != null && (
                <tr>
                  <td>Lipides</td>
                  <td>{recipe.fatPerServing} g</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          totals &&
          per && (
            <table className="nutrition-table">
              <thead>
                <tr>
                  <th />
                  <th>Total</th>
                  <th>Par portion</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Calories</td>
                  <td>{round(totals.calories)} kcal</td>
                  <td>{round(per.calories)} kcal</td>
                </tr>
                <tr>
                  <td>Protéines</td>
                  <td>{round(totals.proteins)} g</td>
                  <td>{round(per.proteins)} g</td>
                </tr>
                <tr>
                  <td>Glucides</td>
                  <td>{round(totals.carbs)} g</td>
                  <td>{round(per.carbs)} g</td>
                </tr>
                <tr>
                  <td>Lipides</td>
                  <td>{round(totals.fat)} g</td>
                  <td>{round(per.fat)} g</td>
                </tr>
                <tr>
                  <td>Fibres</td>
                  <td>{round(totals.fiber)} g</td>
                  <td>{round(per.fiber)} g</td>
                </tr>
              </tbody>
            </table>
          )
        )}
      </section>

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
        message="Supprimer cette recette ?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
