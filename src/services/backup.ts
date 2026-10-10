import { db } from '../db/schema';
import { SECRET_META_KEYS } from '../db/repositories/settingsRepository';

const BACKUP_VERSION = 1;

export async function exportAllData(): Promise<Blob> {
  const payload: Record<string, unknown> = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
  };
  for (const table of db.tables) {
    const rows = await table.toArray();
    // La clé d'accès à l'IA ne sort jamais de l'appareil, sauvegarde comprise.
    payload[table.name] =
      table.name === 'appMeta' ? rows.filter((row) => !SECRET_META_KEYS.includes(row.key)) : rows;
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function importAllData(file: File): Promise<void> {
  const payload = JSON.parse(await file.text()) as Record<string, unknown>;
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      const rows = payload[table.name];
      if (Array.isArray(rows)) await table.bulkPut(rows);
    }
  });
}
