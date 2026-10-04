import { useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useShoppingList } from '../../hooks/useShoppingList';
import {
  clearShoppingList,
  setShoppingItemStates,
  setSlotShopping,
} from '../../db/repositories/planningRepository';
import { groupByItem, toItemChanges, type ShoppingGroup, type ShoppingOccurrence } from '../../services/shopping';
import { fromIsoDate } from '../../utils/date';
import { mealTypeLabel } from '../../utils/mealTypes';
import MaskIcon from '../../components/MaskIcon';
import ConfirmModal from '../../components/ConfirmModal';
import type { MealSlot } from '../../db/schema';

type Mode = 'ITEM' | 'RECIPE';
type Target = { slotId: string; itemId: string };

function formatGrams(grams: number): string {
  return `${Math.round(grams)} g`;
}

function formatWhen(slotDate: string, mealType: MealSlot['mealType']): string {
  return `${format(fromIsoDate(slotDate), 'EEE d MMM', { locale: fr })} · ${mealTypeLabel(mealType)}`;
}

/** Une ligne de la liste : bouton de courses à gauche, corbeille à droite,
 *  aux deux extrémités pour ne pas confondre le geste réversible et le geste définitif. */
function ShoppingRow({
  name,
  note,
  quantity,
  isOff,
  isTitle = false,
  onToggle,
  onDelete,
  children,
}: {
  name: string;
  note?: ReactNode;
  quantity?: string;
  isOff: boolean;
  isTitle?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  children?: ReactNode;
}) {
  const toggleLabel = isOff ? `Remettre ${name} dans les courses` : `Retirer ${name} des courses`;
  const deleteLabel = `Supprimer ${name} de la liste`;

  return (
    <div className={`shopping-row ${isOff ? 'off' : ''}`}>
      <button
        type="button"
        className={`shop-toggle ${isOff ? '' : 'active'}`}
        onClick={onToggle}
        aria-pressed={!isOff}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        <MaskIcon src="/icons/nav/caddie.svg" color="currentColor" />
      </button>
      <div className="shopping-row-text">
        <span className={isTitle ? 'shopping-row-name recipe-name' : 'shopping-row-name'}>{name}</span>
        {note && <span className="shopping-row-note">{note}</span>}
      </div>
      {quantity && <span className="shopping-row-quantity">{quantity}</span>}
      {children}
      <button type="button" className="icon-button" onClick={onDelete} aria-label={deleteLabel} title={deleteLabel}>
        <MaskIcon src="/icons/common/trash.svg" color="#e74c3c" />
      </button>
    </div>
  );
}

export default function ShoppingListScreen() {
  const occurrences = useShoppingList();
  const [mode, setMode] = useState<Mode>('ITEM');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (occurrences === undefined) return null;

  const { ingredients, prepared } = groupByItem(occurrences);
  const isEmpty = occurrences.length === 0;

  function toggle(targets: Target[], isOff: boolean) {
    void setShoppingItemStates(toItemChanges(occurrences!, targets, false), isOff ? 'ON' : 'OFF');
  }

  function remove(targets: Target[]) {
    void setShoppingItemStates(toItemChanges(occurrences!, targets, true), 'DELETED');
  }

  function toggleExpanded(itemId: string) {
    setExpandedIds(expandedIds.includes(itemId) ? expandedIds.filter((id) => id !== itemId) : [...expandedIds, itemId]);
  }

  async function confirmClear() {
    await clearShoppingList();
    setConfirmOpen(false);
  }

  function groupTargets(group: ShoppingGroup): Target[] {
    return group.sources.map((s) => ({ slotId: s.slotId, itemId: group.itemId }));
  }

  function occurrenceTargets(occurrence: ShoppingOccurrence): Target[] {
    return occurrence.lines.map((l) => ({ slotId: occurrence.slotId, itemId: l.itemId }));
  }

  function renderGroup(group: ShoppingGroup) {
    const isExpanded = expandedIds.includes(group.itemId);
    const expandLabel = isExpanded ? `Masquer le détail de ${group.name}` : `Voir le détail de ${group.name}`;
    const quantity = group.isPrepared
      ? `×${group.isOff ? group.sources.length : group.activeCount}`
      : formatGrams(group.isOff ? group.totalG : group.activeG);

    return (
      <li key={group.itemId} className="shopping-item">
        <ShoppingRow
          name={group.name}
          note={
            !group.isPrepared &&
            group.provenance.map((p, index) => (
              <span key={p.recipeId} className={p.isOff ? 'shopping-struck' : ''}>
                {index > 0 && ' · '}
                {p.recipeName}
                {p.count > 1 && ` ×${p.count}`}
              </span>
            ))
          }
          quantity={quantity}
          isOff={group.isOff}
          onToggle={() => toggle(groupTargets(group), group.isOff)}
          onDelete={() => remove(groupTargets(group))}
        >
          <button
            type="button"
            className={`icon-button shopping-expand ${isExpanded ? 'open' : ''}`}
            onClick={() => toggleExpanded(group.itemId)}
            aria-expanded={isExpanded}
            aria-label={expandLabel}
            title={expandLabel}
          >
            <MaskIcon src="/icons/common/chevron.svg" color="currentColor" />
          </button>
        </ShoppingRow>

        {isExpanded && (
          <ul className="shopping-detail">
            {group.sources.map((source) => (
              <li key={source.slotId}>
                <ShoppingRow
                  name={source.recipeName}
                  note={formatWhen(source.slotDate, source.mealType)}
                  quantity={source.quantityG === undefined ? undefined : formatGrams(source.quantityG)}
                  isOff={source.isOff}
                  onToggle={() => toggle([{ slotId: source.slotId, itemId: group.itemId }], source.isOff)}
                  onDelete={() => remove([{ slotId: source.slotId, itemId: group.itemId }])}
                />
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="screen">
      <h1>Liste de courses</h1>

      <div className="mode-toggle">
        <button type="button" className={mode === 'ITEM' ? 'active' : ''} onClick={() => setMode('ITEM')}>
          Par ingrédient
        </button>
        <button type="button" className={mode === 'RECIPE' ? 'active' : ''} onClick={() => setMode('RECIPE')}>
          Par plat
        </button>
      </div>

      {isEmpty && (
        <p className="empty-state">
          La liste est vide — touchez le caddie d'un plat dans le planning pour l'y ajouter.
        </p>
      )}

      {mode === 'ITEM' ? (
        <>
          <ul className="shopping-list">{ingredients.map(renderGroup)}</ul>
          {prepared.length > 0 && (
            <>
              <p className="card-label">Plats tout prêts</p>
              <ul className="shopping-list">{prepared.map(renderGroup)}</ul>
            </>
          )}
        </>
      ) : (
        occurrences.map((occurrence) => (
          <section key={occurrence.slotId} className="card shopping-card">
            <ShoppingRow
              name={occurrence.recipeName}
              note={formatWhen(occurrence.slotDate, occurrence.mealType)}
              isOff={occurrence.isOff}
              isTitle
              onToggle={() => toggle(occurrenceTargets(occurrence), occurrence.isOff)}
              // Supprimer un plat entier, c'est éteindre sa pastille : le repas reste au planning.
              onDelete={() => void setSlotShopping(occurrence.slotId, false)}
            />
            {!occurrence.isPrepared && (
              <ul className="shopping-detail">
                {occurrence.lines.map((line) => (
                  <li key={line.itemId}>
                    <ShoppingRow
                      name={line.name}
                      quantity={line.quantityG === undefined ? undefined : formatGrams(line.quantityG)}
                      isOff={line.isOff}
                      onToggle={() => toggle([{ slotId: occurrence.slotId, itemId: line.itemId }], line.isOff)}
                      onDelete={() => remove([{ slotId: occurrence.slotId, itemId: line.itemId }])}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      {!isEmpty && (
        <button type="button" className="button-primary button-primary--danger" onClick={() => setConfirmOpen(true)}>
          <MaskIcon src="/icons/common/trash.svg" color="currentColor" size="1.2rem" />
          Tout supprimer
        </button>
      )}

      <ConfirmModal
        open={confirmOpen}
        message="Vider la liste de courses ? Les repas restent au planning."
        onConfirm={confirmClear}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
