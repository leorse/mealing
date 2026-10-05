import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getById as getIngredientById } from '../../db/repositories/ingredientRepository';
import IngredientPickerModal from '../../components/IngredientPickerModal';
import MaskIcon from '../../components/MaskIcon';
import {
  create,
  update,
  getById,
  getIngredients,
  type RecipeIngredientInput,
} from '../../db/repositories/recipeRepository';
import { computeRecipeNutrition, perServing, mainIngredient, isHealthyRecipe } from '../../services/nutrition';
import type { Ingredient, Recipe } from '../../db/schema';

interface DraftIngredient {
  ingredient: Ingredient;
  quantityG: number;
}

function IconNumberField({
  icon,
  label,
  value,
  onChange,
  min = 0,
  required = false,
}: {
  icon: string;
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
  required?: boolean;
}) {
  return (
    <div className="icon-field">
      <img src={icon} alt={label} title={label} className="dark-invert icon-field-icon" />
      <input
        type="number"
        min={min}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    </div>
  );
}

const DIFFICULTIES: NonNullable<Recipe['difficulty']>[] = ['EASY', 'MEDIUM', 'HARD'];

function DifficultyPicker({
  value,
  onChange,
}: {
  value: NonNullable<Recipe['difficulty']>;
  onChange: (value: NonNullable<Recipe['difficulty']>) => void;
}) {
  return (
    <div className="difficulty-picker">
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          type="button"
          className={`difficulty-picker-option difficulty-picker-option--${d} ${value === d ? 'active' : ''}`}
          onClick={() => onChange(d)}
        >
          <span className={`difficulty-icon difficulty-icon--${d}`} />
        </button>
      ))}
    </div>
  );
}

export default function RecipeFormScreen() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [kind, setKind] = useState<Recipe['kind']>('RECIPE');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(2);
  const [prepTimeMin, setPrepTimeMin] = useState<number | ''>('');
  const [cookTimeMin, setCookTimeMin] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState<NonNullable<Recipe['difficulty']>>('EASY');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);

  const [caloriesPerServing, setCaloriesPerServing] = useState<number | ''>('');
  const [proteinsPerServing, setProteinsPerServing] = useState<number | ''>('');
  const [carbsPerServing, setCarbsPerServing] = useState<number | ''>('');
  const [fatPerServing, setFatPerServing] = useState<number | ''>('');

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const recipe = await getById(id);
      if (!recipe) return;
      setKind(recipe.kind);
      setName(recipe.name);
      setDescription(recipe.description ?? '');
      setServings(recipe.servings);
      setPrepTimeMin(recipe.prepTimeMin ?? '');
      setCookTimeMin(recipe.cookTimeMin ?? '');
      setDifficulty(recipe.difficulty ?? 'EASY');
      setCaloriesPerServing(recipe.caloriesPerServing ?? '');
      setProteinsPerServing(recipe.proteinsPerServing ?? '');
      setCarbsPerServing(recipe.carbsPerServing ?? '');
      setFatPerServing(recipe.fatPerServing ?? '');

      if (recipe.kind === 'RECIPE') {
        const recipeIngredients = await getIngredients(id);
        const draft = await Promise.all(
          recipeIngredients.map(async (ri) => {
            const ingredient = await getIngredientById(ri.ingredientId);
            return ingredient ? { ingredient, quantityG: ri.quantityG } : null;
          }),
        );
        setIngredients(draft.filter((d): d is DraftIngredient => d !== null));
      }
    })();
  }, [id]);

  function addIngredient({ ingredient, quantityG }: { ingredient: Ingredient; quantityG: number }) {
    if (ingredients.some((d) => d.ingredient.id === ingredient.id)) return;
    setIngredients([...ingredients, { ingredient, quantityG }]);
    setIsPickerOpen(false);
  }

  function updateQuantity(ingredientId: string, quantityG: number) {
    setIngredients(ingredients.map((d) => (d.ingredient.id === ingredientId ? { ...d, quantityG } : d)));
  }

  function removeIngredient(ingredientId: string) {
    setIngredients(ingredients.filter((d) => d.ingredient.id !== ingredientId));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const isPrepared = kind === 'PREPARED';

    const recipeInput = isPrepared
      ? {
          name,
          description: description || undefined,
          servings,
          kind,
          caloriesPerServing: Number(caloriesPerServing),
          proteinsPerServing: proteinsPerServing === '' ? undefined : proteinsPerServing,
          carbsPerServing: carbsPerServing === '' ? undefined : carbsPerServing,
          fatPerServing: fatPerServing === '' ? undefined : fatPerServing,
        }
      : (() => {
          const totals = computeRecipeNutrition(ingredients);
          const per = perServing(totals, servings);
          const isHealthy = isHealthyRecipe({
            caloriesPerServing: per.calories,
            saturatedFatPerServing: per.saturatedFat,
            fiberPerServing: per.fiber,
            sugarsPerServing: per.sugars,
            mainIngredientNutriScore: mainIngredient(ingredients)?.nutriScore,
          });
          return {
            name,
            description: description || undefined,
            servings,
            kind,
            prepTimeMin: prepTimeMin === '' ? undefined : prepTimeMin,
            cookTimeMin: cookTimeMin === '' ? undefined : cookTimeMin,
            difficulty,
            isHealthy,
          };
        })();

    const ingredientInputs: RecipeIngredientInput[] = isPrepared
      ? []
      : ingredients.map((d) => ({ ingredientId: d.ingredient.id!, quantityG: d.quantityG }));

    if (isEdit && id) {
      await update(id, recipeInput, ingredientInputs);
      navigate(`/recipes/${id}`);
    } else {
      const recipe = await create(recipeInput, ingredientInputs);
      navigate(`/recipes/${recipe.id}`);
    }
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <h1>{isEdit ? 'Modifier' : (kind === 'PREPARED' ? 'Nouveau plat tout prêt' : 'Nouveau plat maison')}</h1>

      {!isEdit && (
        <div className="kind-toggle">
          <button
            type="button"
            className={kind === 'RECIPE' ? 'active' : ''}
            onClick={() => setKind('RECIPE')}
            aria-label="Plat maison"
            title="Plat maison"
          >
            <img src="/icons/recipes/recipe.svg" alt="" className="dark-invert" />
          </button>
          <button
            type="button"
            className={kind === 'PREPARED' ? 'active' : ''}
            onClick={() => setKind('PREPARED')}
            aria-label="Plat tout prêt"
            title="Plat tout prêt"
          >
            <img src="/icons/recipes/ready-to-eat.svg" alt="" className="dark-invert" />
          </button>
        </div>
      )}

      <label>
        Nom
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </label>

      <IconNumberField
        icon="/icons/recipes/person.svg"
        label="Nombre de portions"
        min={1}
        required
        value={servings}
        onChange={(v) => setServings(v === '' ? 1 : v)}
      />

      {kind === 'PREPARED' ? (
        <fieldset className="ingredient-picker">
          <legend>Valeurs nutritionnelles par portion</legend>
          <label>
            Calories (kcal) *
            <input
              type="number"
              min={0}
              required
              value={caloriesPerServing}
              onChange={(e) => setCaloriesPerServing(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>
          <label>
            Protéines (g)
            <input
              type="number"
              min={0}
              value={proteinsPerServing}
              onChange={(e) => setProteinsPerServing(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>
          <label>
            Glucides (g)
            <input
              type="number"
              min={0}
              value={carbsPerServing}
              onChange={(e) => setCarbsPerServing(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>
          <label>
            Lipides (g)
            <input
              type="number"
              min={0}
              value={fatPerServing}
              onChange={(e) => setFatPerServing(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>
        </fieldset>
      ) : (
        <>
          <IconNumberField
            icon="/icons/recipes/preparer.svg"
            label="Temps de préparation (min)"
            value={prepTimeMin}
            onChange={setPrepTimeMin}
          />

          <IconNumberField
            icon="/icons/recipes/oven.svg"
            label="Temps de cuisson (min)"
            value={cookTimeMin}
            onChange={setCookTimeMin}
          />

          <DifficultyPicker value={difficulty} onChange={setDifficulty} />

          <fieldset className="ingredient-picker">
            <legend>Ingrédients</legend>

            <button
              type="button"
              className="ingredient-add"
              onClick={() => setIsPickerOpen(true)}
              aria-label="Ajouter un ingrédient"
              title="Ajouter un ingrédient"
            >
              <MaskIcon src="/icons/common/add.svg" color="currentColor" size="1.5rem" />
            </button>

            {ingredients.length === 0 && <p className="empty-state">Aucun ingrédient ajouté.</p>}

            <ul className="ingredient-list">
              {ingredients.map(({ ingredient, quantityG }) => (
                <li key={ingredient.id} className="ingredient-row">
                  <span className="ingredient-row-name">{ingredient.name}</span>
                  <input
                    type="number"
                    min={0}
                    value={quantityG}
                    onChange={(e) => updateQuantity(ingredient.id!, Number(e.target.value))}
                  />
                  <span>g</span>
                  <button type="button" className="icon-button" onClick={() => removeIngredient(ingredient.id!)} aria-label="Retirer">
                    <MaskIcon src="/icons/common/trash.svg" color="#e74c3c" />
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>

          <IngredientPickerModal
            open={isPickerOpen}
            existingIngredientIds={ingredients.map((d) => d.ingredient.id!)}
            onConfirm={addIngredient}
            onCancel={() => setIsPickerOpen(false)}
          />
        </>
      )}

      <button type="submit" className={isEdit ? 'button-primary button-primary--neutral' : 'button-primary'}>
        <MaskIcon src={isEdit ? '/icons/common/save.svg' : '/icons/common/add.svg'} color="currentColor" size="1.2rem" />
        {isEdit ? 'Enregistrer' : 'Créer'}
      </button>
    </form>
  );
}
