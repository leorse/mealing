import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAiSettings } from '../../db/repositories/settingsRepository';
import { create } from '../../db/repositories/recipeRepository';
import CandidatePickerModal from '../../components/CandidatePickerModal';
import EmbeddingSetup from '../../components/EmbeddingSetup';
import IngredientPickerModal from '../../components/IngredientPickerModal';
import MaskIcon from '../../components/MaskIcon';
import { AiError } from '../../services/aiClient';
import {
  ChoiceStepError,
  PORTION_FACTORS,
  analyze,
  dishErrorMessage,
  mergeSameIngredient,
  portionSizeOf,
  replaceLineIngredient,
  resizeLine,
  setLineWeight,
  type AnalysisCheckpoint,
  type AnalysisStage,
  type DishErrorCode,
  type DishLine,
  type PortionSize,
} from '../../services/dishFromText';
import {
  EmbeddingError,
  acquireEmbedding,
  embeddingErrorMessage,
  getEmbeddingStatus,
  prepareEmbedding,
} from '../../services/embedding/embeddingClient';
import { computeRecipeNutrition, isHealthyFromItems } from '../../services/nutrition';
import { formatQuantity } from '../../services/portions';
import type { Ingredient } from '../../db/schema';

const EXAMPLE = 'un sandwich avec une grande merguez sauce samouraï et une grosse frite';

const STAGES: { stage: AnalysisStage; label: string }[] = [
  { stage: 'DECOMPOSE', label: 'Compréhension du texte…' },
  { stage: 'SEARCH', label: 'Recherche des aliments…' },
  { stage: 'CHOOSE', label: 'Choix des aliments…' },
];

const SIZE_LABELS: Record<PortionSize, string> = { SMALL: 'Petite', NORMAL: 'Normale', LARGE: 'Grande' };
const SIZES = Object.keys(PORTION_FACTORS) as PortionSize[];

type Phase = 'INPUT' | 'SETUP' | 'ANALYZING' | 'RESULT';

interface Failure {
  message: string;
  needsSettings: boolean;
  /** Détail technique d'un échec de la recherche intelligente. */
  detail?: string;
}

function failureOf(code: DishErrorCode): Failure {
  return { message: dishErrorMessage(code), needsSettings: code === 'NO_KEY' || code === 'UNAUTHORIZED' };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function DishFromTextScreen() {
  const navigate = useNavigate();
  const settings = useLiveQuery(() => getAiSettings(), []);

  const [phase, setPhase] = useState<Phase>('INPUT');
  const [text, setText] = useState('');
  const [stage, setStage] = useState<AnalysisStage>('DECOMPOSE');
  const [failure, setFailure] = useState<Failure | null>(null);

  const [name, setName] = useState('');
  const [lines, setLines] = useState<DishLine[]>([]);
  // Saisie en cours d'un poids, par ligne : permet de vider le champ avant de retaper un nombre.
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const [replacingKey, setReplacingKey] = useState<string | null>(null);
  const [searchingKey, setSearchingKey] = useState<string | null>(null);

  // Vrai dès le clic sur une action principale : le bouton se grise aussitôt, avant toute attente.
  const [isBusy, setIsBusy] = useState(false);
  // Le même verrou, lisible sans attendre le rendu : deux clics dans la même image ne passent pas.
  const busyRef = useRef(false);

  const abortRef = useRef<AbortController | null>(null);
  // Décomposition gardée après un échec du tri : la relance ne refait que celui-ci.
  const checkpointRef = useRef<AnalysisCheckpoint | null>(null);

  // Le modèle reste en mémoire tant que l'écran est ouvert, et l'analyse en cours s'arrête quand on le quitte.
  useEffect(() => {
    const release = acquireEmbedding();
    return () => {
      abortRef.current?.abort();
      release();
    };
  }, []);

  async function runAnalysis() {
    const controller = new AbortController();
    abortRef.current = controller;
    setFailure(null);
    setStage('DECOMPOSE');
    setPhase('ANALYZING');

    // Mise en route du modèle pendant que l'IA décompose le texte ; un échec ressortira à la recherche.
    prepareEmbedding().catch(() => {});

    const checkpoint = checkpointRef.current?.texts[0] === text ? checkpointRef.current : undefined;
    try {
      const [result] = await analyze({
        texts: [text],
        apiKey: settings?.apiKey,
        model: settings!.model,
        signal: controller.signal,
        onStage: setStage,
        checkpoint,
      });
      if (controller.signal.aborted) return;
      checkpointRef.current = null;

      if (result.status === 'FAILED') {
        setFailure(failureOf(result.code));
        setPhase('INPUT');
        return;
      }
      setName(result.name);
      setLines(result.lines);
      setWeightDrafts({});
      setPhase('RESULT');
    } catch (error) {
      if (controller.signal.aborted) return;
      checkpointRef.current = error instanceof ChoiceStepError ? error.checkpoint : null;
      if (error instanceof AiError) setFailure(failureOf(error.code));
      else if (error instanceof EmbeddingError) {
        setFailure({ message: embeddingErrorMessage(error.code), needsSettings: false, detail: error.detail });
      }
      else setFailure(failureOf('INVALID_RESPONSE'));
      setPhase('INPUT');
    }
  }

  /** Exécute une action principale une seule fois à la fois, bouton grisé pendant toute sa durée. */
  async function once(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    try {
      await action();
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    if (phase !== 'INPUT' || !text.trim() || !settings) return;
    if (!settings.apiKey) {
      setFailure(failureOf('NO_KEY'));
      return;
    }
    void once(async () => {
      const status = await getEmbeddingStatus().catch(() => null);
      if (!status?.isModelCached) {
        setFailure(null);
        setPhase('SETUP');
        return;
      }
      await runAnalysis();
    });
  }

  function cancelAnalysis() {
    abortRef.current?.abort();
    setPhase('INPUT');
  }

  function updateLine(key: string, change: (line: DishLine) => DishLine) {
    setLines(lines.map((line) => (line.key === key ? change(line) : line)));
  }

  function changeWeight(key: string, value: string) {
    setWeightDrafts({ ...weightDrafts, [key]: value });
    updateLine(key, (line) => setLineWeight(line, Number(value)));
  }

  function forgetWeightDraft(key: string) {
    setWeightDrafts(Object.fromEntries(Object.entries(weightDrafts).filter(([k]) => k !== key)));
  }

  /** Un aliment déjà présent sur une autre ligne fusionne avec elle : un aliment ne figure qu'une fois. */
  function replaceIngredient(key: string, ingredient: Ingredient) {
    setLines(mergeSameIngredient(lines.map((line) => (line.key === key ? replaceLineIngredient(line, ingredient) : line))));
    setReplacingKey(null);
    setSearchingKey(null);
  }

  function removeLine(key: string) {
    setLines(lines.filter((line) => line.key !== key));
  }

  const usable = lines.filter((line): line is DishLine & { ingredient: Ingredient } => line.ingredient !== null);
  const totals = computeRecipeNutrition(usable);
  const hasEstimate = usable.some((line) => line.isEstimated);
  const hasMissing = lines.some((line) => line.ingredient === null);
  const canValidate = name.trim().length > 0 && usable.length > 0;

  function handleValidate(e: FormEvent) {
    e.preventDefault();
    if (!canValidate) return;
    void once(async () => {
      const recipe = await create(
        {
          name: name.trim(),
          servings: 1,
          kind: 'RECIPE',
          difficulty: 'EASY',
          isHealthy: isHealthyFromItems(usable, 1),
          sourceText: text.trim(),
        },
        usable.map((line) => ({
          ingredientId: line.ingredient.id!,
          quantityG: line.quantityG,
          unitCount: line.unitCount,
          isEstimated: line.isEstimated || undefined,
        })),
      );
      navigate(`/recipes/${recipe.id}`);
    });
  }

  if (settings === undefined) return null;

  if (phase === 'RESULT') {
    const replacing = lines.find((line) => line.key === replacingKey);

    return (
      <form className="screen" onSubmit={handleValidate}>
        <h1>Plat décrit</h1>
        <p className="quantity-note">« {text.trim()} »</p>

        <label>
          Nom
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <fieldset className="ingredient-picker">
          <legend>Ingrédients</legend>

          {lines.length === 0 && <p className="empty-state">Aucun ingrédient.</p>}

          <ul className="ingredient-list">
            {lines.map((line) => {
              const size = portionSizeOf(line);
              return (
                <li key={line.key} className="dish-line">
                  <div className="ingredient-row">
                    <span className="ingredient-row-name">
                      {line.ingredient ? line.ingredient.name : 'Aucun aliment trouvé'}
                      <span className="quantity-note">
                        {' '}
                        · « {line.label} »{line.origin && ` (${line.origin})`}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => (line.candidates.length > 0 ? setReplacingKey(line.key) : setSearchingKey(line.key))}
                      aria-label={`Changer l'aliment de ${line.label}`}
                      title="Changer d'aliment"
                    >
                      <MaskIcon src="/icons/common/edit.svg" color="currentColor" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeLine(line.key)}
                      aria-label={`Retirer ${line.label}`}
                      title="Retirer"
                    >
                      <MaskIcon src="/icons/common/trash.svg" color="#e74c3c" />
                    </button>
                  </div>

                  {line.ingredient && (
                    <div className="ingredient-row">
                      <span className="ingredient-row-name">
                        {line.isEstimated && '≈ '}
                        {formatQuantity(line, line.ingredient)} · {Math.round((line.ingredient.calories100g * line.quantityG) / 100)} kcal
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={weightDrafts[line.key] ?? line.quantityG}
                        onChange={(e) => changeWeight(line.key, e.target.value)}
                        onBlur={() => forgetWeightDraft(line.key)}
                        aria-label={`Poids de ${line.label} en grammes`}
                        title="Poids précis"
                      />
                      <span>g</span>
                    </div>
                  )}

                  {(line.isEstimated || line.needsReview) && (
                    <div className="recipe-badges">
                      {line.isEstimated && <span className="badge">estimé</span>}
                      {line.needsReview && <span className="badge badge--warn">à vérifier</span>}
                    </div>
                  )}

                  {line.ingredient && line.isEstimated && (
                    <div className="mode-toggle" role="group" aria-label={`Taille de la portion de ${line.label}`}>
                      {SIZES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={size === option ? 'active' : ''}
                          aria-pressed={size === option}
                          onClick={() => updateLine(line.key, (current) => resizeLine(current, option))}
                        >
                          {SIZE_LABELS[option]}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>

        <section className="card">
          <p className="card-label">Valeurs nutritionnelles du plat</p>
          <div className="macro-row">
            <div className="macro-item">
              <span className="macro-value">{Math.round(totals.calories)}</span>
              <span className="macro-label">kcal</span>
            </div>
            <div className="macro-item">
              <span className="macro-value">{round(totals.proteins)} g</span>
              <span className="macro-label">Protéines</span>
            </div>
            <div className="macro-item">
              <span className="macro-value">{round(totals.carbs)} g</span>
              <span className="macro-label">Glucides</span>
            </div>
            <div className="macro-item">
              <span className="macro-value">{round(totals.fat)} g</span>
              <span className="macro-label">Lipides</span>
            </div>
          </div>
        </section>

        {hasEstimate && (
          <p className="quantity-note">
            Total approximatif : les quantités estimées peuvent s'écarter d'environ 30 %. Ajuste la taille ou saisis un
            poids pour l'affiner. Les valeurs pour 100 g viennent de la table Ciqual.
          </p>
        )}
        {hasMissing && (
          <p className="quantity-note">
            Un ingrédient sans aliment ne compte pas dans le total et ne sera pas enregistré : choisis-lui un aliment
            ou retire-le.
          </p>
        )}

        <div className="button-row">
          <button type="button" onClick={() => setPhase('INPUT')}>
            Modifier la description
          </button>
        </div>

        <button type="submit" className="button-primary" disabled={!canValidate || isBusy}>
          <MaskIcon src="/icons/common/add.svg" color="currentColor" size="1.2rem" />
          Valider
        </button>

        <CandidatePickerModal
          open={replacing !== undefined}
          label={replacing?.label ?? ''}
          candidates={replacing?.candidates ?? []}
          selectedId={replacing?.ingredient?.id}
          onPick={(ingredient) => replaceIngredient(replacingKey!, ingredient)}
          onSearchElsewhere={() => {
            setSearchingKey(replacingKey);
            setReplacingKey(null);
          }}
          onCancel={() => setReplacingKey(null)}
        />

        {/* La quantité saisie dans cette fenêtre est ignorée : la ligne garde la sienne et sa provenance. */}
        <IngredientPickerModal
          open={searchingKey !== null}
          existingIngredientIds={[]}
          onConfirm={({ ingredient }) => replaceIngredient(searchingKey!, ingredient)}
          onCancel={() => setSearchingKey(null)}
        />
      </form>
    );
  }

  const isAnalyzing = phase === 'ANALYZING';

  return (
    <form className="screen" onSubmit={handleAnalyze}>
      <h1>Décrire un plat</h1>

      <label>
        Description
        <textarea
          rows={4}
          value={text}
          placeholder={`Par exemple : ${EXAMPLE}`}
          disabled={isAnalyzing || isBusy}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <p className="quantity-note">
        Décris ce que tu as mangé avec tes mots. Une quantité que tu indiques (« 50 g de frites », « deux merguez ») est
        gardée telle quelle ; les autres sont estimées. Seul ce texte est envoyé à 1min.AI, au moment de l'analyse.
      </p>

      {phase === 'SETUP' && (
        <fieldset className="ingredient-picker">
          <legend>Recherche intelligente</legend>
          <EmbeddingSetup onReady={runAnalysis} />
        </fieldset>
      )}

      {isAnalyzing && (
        <>
          <progress className="progress-bar" aria-label="Analyse en cours" />
          <p className="quantity-note" role="status">
            Étape {STAGES.findIndex((s) => s.stage === stage) + 1} sur {STAGES.length} —{' '}
            {STAGES.find((s) => s.stage === stage)?.label}
          </p>
          <div className="button-row">
            <button type="button" onClick={cancelAnalysis}>
              Annuler
            </button>
          </div>
        </>
      )}

      {failure && (
        <>
          <p className="quantity-note" role="alert">
            {failure.message}
          </p>
          {failure.detail && (
            <details className="quantity-note">
              <summary>Détail technique</summary>
              <p className="error-detail">{failure.detail}</p>
            </details>
          )}
          {failure.needsSettings && (
            <div className="button-row">
              <Link to="/settings">Ouvrir les Réglages</Link>
            </div>
          )}
        </>
      )}

      {phase === 'INPUT' && (
        <button type="submit" className="button-primary" disabled={!text.trim() || isBusy}>
          <MaskIcon src="/icons/common/ia.svg" color="currentColor" size="1.2rem" />
          Analyser
        </button>
      )}
    </form>
  );
}
