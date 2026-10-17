import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MealSlot } from '../db/schema';
import { getAiSettings } from '../db/repositories/settingsRepository';
import { useOnce } from '../hooks/useOnce';
import { AiError } from '../services/aiClient';
import type { ReviewGoal } from '../services/aiReview';
import { ChoiceStepError, type AnalysisCheckpoint } from '../services/dishFromText';
import {
  EmbeddingError,
  acquireEmbedding,
  embeddingErrorMessage,
  getEmbeddingStatus,
} from '../services/embedding/embeddingClient';
import {
  FILL_HINTS_MAX_LENGTH,
  FILL_MEAL_TYPES,
  buildWeekContext,
  compareSlots,
  fillErrorMessage,
  generate,
  requestProposals,
  slotKey,
  slotLabel,
  type FillSlot,
  type FillStage,
  type Proposal,
} from '../services/weekFill';
import { fromIsoDate, weekDates } from '../utils/date';
import { mealTypeLabel } from '../utils/mealTypes';
import EmbeddingSetup from './EmbeddingSetup';
import MaskIcon from './MaskIcon';

interface WeekAiModalProps {
  weekStart: string;
  slots: MealSlot[];
  goal: ReviewGoal;
  /** La semaine contient des repas : le bilan a de quoi noter. */
  canReview: boolean;
  onRequestReview: () => void;
  onClose: () => void;
}

type Tab = 'REVIEW' | 'FILL';
type Phase = 'GRID' | 'SETUP' | 'PROPOSING' | 'PROPOSALS' | 'GENERATING';

interface Failure {
  message: string;
  needsSettings: boolean;
  detail?: string;
}

const STAGE_LABELS: Record<FillStage, string> = {
  PROPOSE: "L'IA cherche des plats pour tes repas…",
  DECOMPOSE: 'Compréhension des plats…',
  SEARCH: 'Recherche des aliments…',
  CHOOSE: 'Choix des aliments…',
  WRITE: 'Ajout au planning…',
};

function failureOf(error: unknown): Failure {
  if (error instanceof AiError) {
    return { message: fillErrorMessage(error.code), needsSettings: error.code === 'NO_KEY' || error.code === 'UNAUTHORIZED' };
  }
  if (error instanceof EmbeddingError) {
    return { message: embeddingErrorMessage(error.code), needsSettings: false, detail: error.detail };
  }
  return { message: fillErrorMessage('INVALID_RESPONSE'), needsSettings: false, detail: String(error) };
}

function isGarnished(slots: MealSlot[], slot: FillSlot): boolean {
  return slots.some((s) => s.slotDate === slot.date && s.mealType === slot.mealType);
}

/** Fenêtre IA de la semaine : bilan, ou remplissage des créneaux vides par l'IA. */
export default function WeekAiModal({ weekStart, slots, goal, canReview, onRequestReview, onClose }: WeekAiModalProps) {
  // Figés à l'ouverture : la semaine remplie est celle qui était affichée.
  const [week] = useState(() => ({ start: weekStart, slots, dates: weekDates(weekStart) }));
  const [tab, setTab] = useState<Tab>(canReview ? 'REVIEW' : 'FILL');

  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        week.dates.flatMap((date) =>
          FILL_MEAL_TYPES.map((mealType) => ({ date, mealType })).filter((slot) => !isGarnished(week.slots, slot)).map(slotKey),
        ),
      ),
  );
  // Propres à la demande : ni enregistrés, ni conservés à la fermeture de la fenêtre.
  const [includeWeek, setIncludeWeek] = useState(true);
  const [hints, setHints] = useState('');
  const [phase, setPhase] = useState<Phase>('GRID');
  const [stage, setStage] = useState<FillStage>('PROPOSE');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  // Vrai dès qu'une proposition a été reçue : ses résultats restent consultables depuis la grille,
  // pour ne pas repayer une demande après un retour à la grille par erreur.
  const [hasResults, setHasResults] = useState(false);
  // Créneaux que la dernière proposition n'a pas couverts.
  const [missing, setMissing] = useState<FillSlot[]>([]);
  // Issue de la dernière création (échec partiel) : propre à la liste, effacée en la quittant.
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const { isBusy, once } = useOnce();

  const abortRef = useRef<AbortController | null>(null);
  // Décomposition gardée après un échec du seul tri : la relance ne refait que celui-ci.
  const checkpointRef = useRef<AnalysisCheckpoint | null>(null);

  // La fenêtre tient le modèle de recherche en mémoire, et toute opération s'arrête à sa fermeture.
  useEffect(() => {
    const release = acquireEmbedding();
    return () => {
      abortRef.current?.abort();
      release();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const allSlots: FillSlot[] = week.dates.flatMap((date) => FILL_MEAL_TYPES.map((mealType) => ({ date, mealType })));
  const retained = allSlots.filter((slot) => selected.has(slotKey(slot)));
  const hasEmptySlot = allSlots.some((slot) => !isGarnished(week.slots, slot));
  const isWorking = phase === 'PROPOSING' || phase === 'GENERATING';

  function toggle(slot: FillSlot) {
    const next = new Set(selected);
    if (next.has(slotKey(slot))) next.delete(slotKey(slot));
    else next.add(slotKey(slot));
    setSelected(next);
  }

  function startOperation(): AbortController {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setFailure(null);
    setNotice(null);
    return controller;
  }

  async function propose() {
    const controller = startOperation();
    setStage('PROPOSE');
    setPhase('PROPOSING');
    try {
      const settings = await getAiSettings();
      const result = await requestProposals({
        apiKey: settings.apiKey,
        model: settings.model,
        slots: retained,
        week: await buildWeekContext(week.dates, week.slots, retained, includeWeek),
        goal,
        hints,
        includeWeek,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setProposals([...result.proposals].sort((a, b) => compareSlots(a.slot, b.slot)));
      setMissing(result.missing);
      setHasResults(true);
      checkpointRef.current = null;
      setPhase('PROPOSALS');
    } catch (error) {
      if (controller.signal.aborted) return;
      setFailure(failureOf(error));
      setPhase('GRID');
    }
  }

  function handlePropose() {
    void once(async () => {
      const settings = await getAiSettings();
      if (!settings.apiKey) {
        setFailure(failureOf(new AiError('NO_KEY')));
        return;
      }
      // Le modèle de recherche sert à la création : on le vérifie avant de payer la proposition.
      const status = await getEmbeddingStatus().catch(() => null);
      if (!status?.isModelCached) {
        setFailure(null);
        setPhase('SETUP');
        return;
      }
      await propose();
    });
  }

  function handleGenerate() {
    void once(async () => {
      const controller = startOperation();
      setStage('DECOMPOSE');
      setPhase('GENERATING');
      try {
        const settings = await getAiSettings();
        const result = await generate({
          weekStart: week.start,
          proposals,
          apiKey: settings.apiKey,
          model: settings.model,
          signal: controller.signal,
          onStage: setStage,
          checkpoint: checkpointRef.current ?? undefined,
        });
        checkpointRef.current = null;
        if (result.failed.length === 0) {
          onClose();
          return;
        }
        setProposals(result.failed);
        setNotice(
          `${result.createdDishes} plat(s) ajouté(s) au planning. Ces propositions n'ont pas pu être créées : ${result.failed
            .map((p) => `${p.name} (${slotLabel(p.slot)})`)
            .join(', ')}. Tu peux réessayer ou les supprimer.`,
        );
        setPhase('PROPOSALS');
      } catch (error) {
        if (controller.signal.aborted) {
          setPhase('PROPOSALS');
          return;
        }
        checkpointRef.current = error instanceof ChoiceStepError ? error.checkpoint : null;
        setFailure(failureOf(error));
        setPhase('PROPOSALS');
      }
    });
  }

  function cancel() {
    abortRef.current?.abort();
    setPhase(phase === 'GENERATING' ? 'PROPOSALS' : 'GRID');
  }

  function removeProposal(target: Proposal) {
    setProposals(proposals.filter((p) => p !== target));
    checkpointRef.current = null;
  }

  return (
    <div className="modal-overlay" onClick={isWorking ? undefined : onClose}>
      <div
        className="modal-card modal-card--picker"
        role="dialog"
        aria-modal="true"
        aria-label="IA de la semaine"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mode-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'REVIEW'}
            className={tab === 'REVIEW' ? 'active' : ''}
            disabled={isWorking}
            onClick={() => setTab('REVIEW')}
          >
            Bilan
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'FILL'}
            className={tab === 'FILL' ? 'active' : ''}
            onClick={() => setTab('FILL')}
          >
            Remplir la semaine
          </button>
        </div>

        {tab === 'REVIEW' && (
          <div className="picker-free">
            <p className="quantity-note">
              L'IA note chaque jour qui contient des repas et rédige un bilan de la semaine, au regard de ton objectif.
            </p>
            {!canReview && <p className="empty-state">Aucun repas à noter cette semaine.</p>}
            <button
              type="button"
              className="button-primary"
              disabled={!canReview}
              onClick={() => {
                onRequestReview();
                onClose();
              }}
            >
              <MaskIcon src="/icons/common/ia.svg" color="currentColor" size="1.2rem" />
              Demander le bilan
            </button>
          </div>
        )}

        {tab === 'FILL' && (phase === 'GRID' || phase === 'SETUP' || phase === 'PROPOSING') && (
          <div className="picker-free">

            <div className="fill-grid" role="group" aria-label="Repas à remplir">
              <span />
              {week.dates.map((date) => (
                <span key={date} className="fill-grid-head">
                  {format(fromIsoDate(date), 'EEE d', { locale: fr })}
                </span>
              ))}
              {FILL_MEAL_TYPES.map((mealType) => (
                <div key={mealType} className="fill-grid-row">
                  <span className="fill-grid-label">{mealTypeLabel(mealType)}</span>
                  {week.dates.map((date) => {
                    const slot = { date, mealType };
                    const isFull = isGarnished(week.slots, slot);
                    const isOn = selected.has(slotKey(slot));
                    return (
                      <button
                        key={date}
                        type="button"
                        className={`fill-cell ${isOn ? 'selected' : ''}`}
                        disabled={isFull || phase !== 'GRID'}
                        aria-pressed={isOn}
                        aria-label={`${slotLabel(slot)}${isFull ? ', déjà prévu' : ''}`}
                        title={`${slotLabel(slot)}${isFull ? ' — déjà prévu' : isOn ? ' — à remplir' : ' — écarté'}`}
                        onClick={() => toggle(slot)}
                      >
                        {isFull ? '•' : isOn ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <p className="quantity-note">
              {hasEmptySlot
                ? `${retained.length} repas à proposer.`
                : 'Tous les repas de la semaine sont déjà prévus : rien à remplir.'}
            </p>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeWeek}
                disabled={phase !== 'GRID'}
                onChange={(e) => setIncludeWeek(e.target.checked)}
              />
              Tenir compte du reste de la semaine
            </label>

            <label>
              Indications complémentaires (facultatif)
              <textarea
                rows={2}
                maxLength={FILL_HINTS_MAX_LENGTH}
                value={hints}
                disabled={phase !== 'GRID'}
                placeholder="Par exemple : pas de riz, sans poisson."
                onChange={(e) => setHints(e.target.value)}
              />
            </label>
            <p className="quantity-note">
              {` ${hints.length} / ${FILL_HINTS_MAX_LENGTH} caractères.`}
            </p>

            {phase === 'SETUP' && <EmbeddingSetup onReady={() => void once(propose)} />}

            {phase === 'GRID' && (
              <div className="modal-actions">
                <button
                  type="button"
                  className="button-primary"
                  disabled={retained.length === 0 || isBusy}
                  onClick={handlePropose}
                >
                  <MaskIcon src="/icons/common/ia.svg" color="currentColor" size="1.2rem" />
                  {hasResults ? 'Nouvelle proposition' : 'Proposer des plats'}
                </button>
                {hasResults && (
                  <button
                    type="button"
                    className="button-primary button-primary--neutral"
                    disabled={isBusy}
                    onClick={() => {
                      setFailure(null);
                      setPhase('PROPOSALS');
                    }}
                    title="Revoir les propositions déjà reçues, sans nouvelle demande"
                  >
                    Résultats ({proposals.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'FILL' && (phase === 'PROPOSALS' || phase === 'GENERATING') && (
          <>
            <div className="picker-results">
              {proposals.length === 0 && <p className="empty-state">Aucune proposition.</p>}
              <ul className="ingredient-list">
                {proposals.map((proposal) => (
                  <li key={slotKey(proposal.slot)} className="dish-line">
                    <div className="ingredient-row">
                      <span className="ingredient-row-name">
                        <span className="quantity-note">{slotLabel(proposal.slot)}</span>
                        <br />
                        {proposal.name}
                      </span>
                      <button
                        type="button"
                        className="icon-button"
                        disabled={phase === 'GENERATING'}
                        onClick={() => removeProposal(proposal)}
                        aria-label={`Supprimer la proposition ${proposal.name}`}
                        title="Supprimer la proposition"
                      >
                        <MaskIcon src="/icons/common/trash.svg" color="#e74c3c" />
                      </button>
                    </div>
                    <p className="quantity-note">{proposal.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            {phase === 'PROPOSALS' && (
              <>
                <div className="button-row">
                  <button
                    type="button"
                    onClick={() => {
                      setNotice(null);
                      setFailure(null);
                      setPhase('GRID');
                    }}
                  >
                    Revenir à la grille
                  </button>
                </div>
                <button
                  type="button"
                  className="button-primary"
                  disabled={proposals.length === 0 || isBusy}
                  onClick={handleGenerate}
                >
                  <MaskIcon src="/icons/common/add.svg" color="currentColor" size="1.2rem" />
                  Créer et ajouter au planning
                </button>
              </>
            )}
          </>
        )}

        {isWorking && (
          <>
            <progress className="progress-bar" aria-label="Opération en cours" />
            <p className="quantity-note" role="status">
              {STAGE_LABELS[stage]}
            </p>
            {stage !== 'WRITE' && (
              <div className="button-row">
                <button type="button" onClick={cancel}>
                  Annuler
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'PROPOSALS' && missing.length > 0 && (
          <p className="quantity-note" role="status">
            Sans proposition de l'IA : {missing.map(slotLabel).join(', ')}. Ces repas resteront vides.
          </p>
        )}

        {notice && !isWorking && <p className="quantity-note" role="status">{notice}</p>}

        {failure && !isWorking && (
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

        {!isWorking && (
          <div className="modal-actions">
            <button type="button" className="modal-button modal-button--no" onClick={onClose}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
