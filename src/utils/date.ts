/**
 * Convention : une chaîne `AAAA-MM-JJ` désigne un jour civil **local**, jamais un instant.
 *
 * Rien ici ne passe par UTC. `toISOString()` convertit en temps universel : appliqué à une
 * date construite en heure locale, il recule d'un jour dès que les deux ne tombent pas le
 * même jour civil — entre minuit et 2 h en France, et en permanence à l'ouest de Greenwich.
 */

/** Relit une chaîne `AAAA-MM-JJ` comme une date locale, positionnée à midi.
 *  Midi, et non minuit, pour qu'un changement d'heure ne puisse pas faire basculer le jour. */
export function fromIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Formate une date à partir de ses composantes locales. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Lundi de la semaine contenant la date donnée. */
export function startOfWeekIso(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // lundi
  return toIsoDate(d);
}

export function addDays(isoDate: string, days: number): string {
  const d = fromIsoDate(isoDate);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}
