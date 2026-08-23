import { db } from '../db/schema';

const BACKUP_VERSION = 1;

export async function exportAllData(): Promise<Blob> {
  const payload: Record<string, unknown> = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
  };
  for (const table of db.tables) {
    payload[table.name] = await table.toArray();
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
