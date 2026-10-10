import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUiStore } from '../../store/useUiStore';
import { useWeekSlots } from '../../hooks/useWeekSlots';
import { useWeekPlan } from '../../hooks/useWeekPlan';
import { deleteSlot, saveAiReviews, setSlotShopping } from '../../db/repositories/planningRepository';
import { getAiSettings } from '../../db/repositories/settingsRepository';
import { useProfile, PROFILE_LOADING } from '../../hooks/useProfile';
import { computeMacroTargets, computeTargetCalories } from '../../services/nutrition';
import {
  AiReviewError,
  aiErrorMessage,
  aiErrorNeedsSettings,
  daySignature,
  loadReviewDays,
  requestReview,
  type AiReviewErrorCode,
} from '../../services/aiReview';
import { addDays, weekDates, fromIsoDate } from '../../utils/date';
import { MEAL_TYPES } from '../../utils/mealTypes';
import MaskIcon from '../../components/MaskIcon';
import MealPickerModal from '../../components/MealPickerModal';
import HoldToDeleteButton from '../../components/HoldToDeleteButton';
import AiReviewModal from '../../components/AiReviewModal';
import type { MealSlot } from '../../db/schema';

function slotCalories(slot: MealSlot): number {
  return slot.caloriesOverride ?? 0;
}

function dayStatus(dayCalories: number, target: number): 'ok' | 'warn' | 'over' {
  if (dayCalories <= target * 1.1 && dayCalories >= target * 0.9) return 'ok';
  if (dayCalories > target * 1.1) return 'over';
  return 'warn';
}

type ReviewView = { kind: 'DAY'; date: string } | { kind: 'WEEK' } | { kind: 'ERROR'; code: AiReviewErrorCode };

export default function WeekPlanScreen() {
  const { selectedWeekStart, setSelectedWeekStart } = useUiStore();
  const slots = useWeekSlots(selectedWeekStart);
  const profile = useProfile();
  const [adding, setAdding] = useState<{ date: string; type: MealSlot['mealType'] } | null>(null);
  const [editing, setEditing] = useState<MealSlot | null>(null);
  const weekPlan = useWeekPlan(selectedWeekStart);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [isWeekPending, setIsWeekPending] = useState(false);
  const [reviewView, setReviewView] = useState<ReviewView | null>(null);

  if (profile === PROFILE_LOADING || profile === undefined) return null;

  const target = computeTargetCalories(profile);
  const days = weekDates(selectedWeekStart);
  const reviews = weekPlan?.aiReviews ?? {};
  const filledDates = days.filter((date) => slots.some((s) => s.slotDate === date));
  const dayLabel = (date: string) => format(fromIsoDate(date), 'EEEE d', { locale: fr });

  /** Demande l'avis de l'IA sur des journées ; avec bilan quand il s'agit de la semaine entière. */
  async function review(dates: string[], withSummary: boolean) {
    if (profile === PROFILE_LOADING || profile === undefined) return;
    const settings = await getAiSettings();
    if (!settings.apiKey) {
      setReviewView({ kind: 'ERROR', code: 'NO_KEY' });
      return;
    }

    // Figés au départ : la semaine affichée et ses repas peuvent changer pendant l'attente.
    const weekStart = selectedWeekStart;
    const daySlots = dates.map((date) => ({ date, slots: slots.filter((s) => s.slotDate === date) }));
    setPendingDates((pending) => [...pending, ...dates]);
    if (withSummary) setIsWeekPending(true);

    try {
      const result = await requestReview({
        apiKey: settings.apiKey,
        model: settings.model,
        days: await loadReviewDays(daySlots),
        goal: { targetCalories: target, ...computeMacroTargets(target, profile), goal: profile.goal },
        withSummary,
      });
      const reviewedAt = new Date().toISOString();
      await saveAiReviews(
        weekStart,
        Object.fromEntries(
          result.days.map((day) => [
            day.date,
            {
              score: day.score,
              comment: day.comment,
              reviewedAt,
              signature: daySignature(daySlots.find((d) => d.date === day.date)!.slots),
            },
          ]),
        ),
        result.summary === undefined ? undefined : { text: result.summary, reviewedAt },
      );
    } catch (error) {
      setReviewView({ kind: 'ERROR', code: error instanceof AiReviewError ? error.code : 'NETWORK' });
    } finally {
      setPendingDates((pending) => pending.filter((date) => !dates.includes(date)));
      if (withSummary) setIsWeekPending(false);
    }
  }

  const isBusy = pendingDates.length > 0;

  return (
    <div className="screen screen--wide">
      <header className="week-header">
        <button type="button" onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))} aria-label="Semaine précédente">
          ‹
        </button>
        <h1>Semaine du {format(fromIsoDate(selectedWeekStart), 'd MMM', { locale: fr })}</h1>
        <button
          type="button"
          className={`ai-button ${isWeekPending ? 'loading' : ''}`}
          disabled={isBusy || filledDates.length === 0}
          aria-busy={isWeekPending}
          onClick={() => review(filledDates, true)}
          aria-label="Demander l'avis de l'IA sur la semaine"
          title="Demander l'avis de l'IA sur la semaine"
        >
          <MaskIcon src="/icons/common/ia.svg" color="currentColor" />
        </button>
        <button
          type="button"
          className="ai-button"
          disabled={!weekPlan?.aiSummary}
          onClick={() => setReviewView({ kind: 'WEEK' })}
          aria-label="Lire le bilan de la semaine"
          title="Lire le bilan de la semaine"
        >
          <MaskIcon src="/icons/common/comment-ia.svg" color="currentColor" />
        </button>
        <button type="button" onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))} aria-label="Semaine suivante">
          ›
        </button>
      </header>

      <div className="week-grid-scroll">
        <div className="week-grid">
          {days.map((date) => {
            const daySlots = slots.filter((s) => s.slotDate === date);
            const dayCalories = daySlots.reduce((sum, s) => sum + slotCalories(s), 0);
            const status = dayStatus(dayCalories, target);
            const dayReview = reviews[date];
            // Un avis ne teinte la journée que s'il porte sur son contenu actuel.
            const isCurrent = dayReview !== undefined && dayReview.signature === daySignature(daySlots);
            const isPending = pendingDates.includes(date);

            return (
              <div key={date} className={`day-column ${isCurrent ? `day-column--score-${dayReview.score}` : ''}`}>
                <div className="day-column-header">
                  <div className="day-column-title">
                    <span className="day-name">{format(fromIsoDate(date), 'EEE d', { locale: fr })}</span>
                    <button
                      type="button"
                      className={`icon-button ai-button ${isPending ? 'loading' : ''}`}
                      disabled={isBusy || daySlots.length === 0}
                      aria-busy={isPending}
                      onClick={() => review([date], false)}
                      aria-label={`Demander l'avis de l'IA sur ${dayLabel(date)}`}
                      title={`Demander l'avis de l'IA sur ${dayLabel(date)}`}
                    >
                      <MaskIcon src="/icons/common/ia.svg" color="currentColor" size="1rem" />
                    </button>
                    <button
                      type="button"
                      className="icon-button ai-button"
                      disabled={dayReview === undefined}
                      onClick={() => setReviewView({ kind: 'DAY', date })}
                      aria-label={`Lire l'avis de l'IA sur ${dayLabel(date)}`}
                      title={`Lire l'avis de l'IA sur ${dayLabel(date)}`}
                    >
                      <MaskIcon src="/icons/common/comment-ia.svg" color="currentColor" size="1rem" />
                    </button>
                  </div>
                  <span className={`day-total day-total--${status}`}>{dayCalories} kcal</span>
                </div>

                {MEAL_TYPES.map(({ type, label }) => {
                  const typeSlots = daySlots.filter((s) => s.mealType === type);
                  return (
                    <div key={type} className="meal-group">
                      <span className="meal-slot-type">{label}</span>

                      {typeSlots.map((slot) => (
                        <div key={slot.id} className="meal-slot meal-slot--filled">
                          {slot.recipeId && (
                            <button
                              type="button"
                              className={`meal-entry-shop ${slot.includeInShopping ? 'active' : ''}`}
                              onClick={() => setSlotShopping(slot.id!, !slot.includeInShopping)}
                              aria-pressed={Boolean(slot.includeInShopping)}
                              aria-label={
                                slot.includeInShopping
                                  ? `Retirer ${slot.freeLabel} des courses`
                                  : `Ajouter ${slot.freeLabel} aux courses`
                              }
                            >
                              <MaskIcon src="/icons/nav/caddie.svg" color="currentColor" size="0.85rem" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="meal-entry"
                            onClick={() => setEditing(slot)}
                            aria-label={`Modifier ${slot.freeLabel}`}
                          >
                            <span className="meal-entry-name" title={slot.freeLabel}>{slot.freeLabel}</span>
                            <span className="meal-slot-kcal">{slotCalories(slot)} kcal</span>
                          </button>
                          <HoldToDeleteButton
                            label={`Supprimer ${slot.freeLabel} — maintenir`}
                            onConfirm={() => deleteSlot(slot.id!)}
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        className="meal-slot meal-slot--empty"
                        onClick={() => setAdding({ date, type })}
                        aria-label={`Ajouter un ${label.toLowerCase()}`}
                      >
                        <MaskIcon src="/icons/common/add.svg" color="currentColor" size="1rem" />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {adding && (
        <MealPickerModal
          open
          slotDate={adding.date}
          mealType={adding.type}
          onClose={() => setAdding(null)}
        />
      )}

      {editing && (
        <MealPickerModal
          open
          slotDate={editing.slotDate}
          mealType={editing.mealType}
          slot={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {reviewView?.kind === 'DAY' && reviews[reviewView.date] && (
        <AiReviewModal
          title={dayLabel(reviewView.date)}
          score={reviews[reviewView.date].score}
          text={reviews[reviewView.date].comment}
          isOutdated={
            reviews[reviewView.date].signature !== daySignature(slots.filter((s) => s.slotDate === reviewView.date))
          }
          onClose={() => setReviewView(null)}
        />
      )}

      {reviewView?.kind === 'WEEK' && weekPlan?.aiSummary && (
        <AiReviewModal
          title="Bilan de la semaine"
          text={weekPlan.aiSummary.text}
          dayScores={days.filter((date) => reviews[date]).map((date) => ({ label: dayLabel(date), score: reviews[date].score }))}
          onClose={() => setReviewView(null)}
        />
      )}

      {reviewView?.kind === 'ERROR' && (
        <AiReviewModal
          title="Avis de l'IA indisponible"
          text={aiErrorMessage(reviewView.code)}
          isError
          showSettingsLink={aiErrorNeedsSettings(reviewView.code)}
          onClose={() => setReviewView(null)}
        />
      )}
    </div>
  );
}
