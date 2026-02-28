import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import { encrypt, decrypt } from '../../core/security/EncryptionService';
import { uploadFile, downloadFile } from './GoogleDriveService';

const TABLES = [
  'places',
  'people',
  'tasks',
  'todos',
  'reminders',
  'chat_sessions',
  'chat_messages',
] as const;


const KEY_FILE = 'buddyai_enc_key.dat';
const BACKUP_FILE = 'buddyai_backup.json.enc';

export async function uploadKeyToDrive(encKey: string, accessToken: string): Promise<void> {
  await uploadFile(KEY_FILE, encKey, accessToken);
}

export async function downloadKeyFromDrive(accessToken: string): Promise<string | null> {
  return downloadFile(KEY_FILE, accessToken);
}

async function exportAllTables(encKey: string): Promise<string> {
  const db = getDb();
  const dump: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const records = await db.get(table as string).query().fetch();
    dump[table] = records.map(r => {
      const raw = Object.assign({}, (r as unknown as { _raw: Record<string, unknown> })._raw);
      delete raw._changed;
      delete raw._status;
      return raw;
    });
  }
  return encrypt(JSON.stringify(dump), encKey);
}

async function importAllTables(encryptedData: string, encKey: string): Promise<void> {
  const dump = JSON.parse(decrypt(encryptedData, encKey)) as Record<string, unknown[]>;
  const db = getDb();
  for (const table of TABLES) {
    const rows = dump[table] ?? [];
    if (rows.length === 0) continue;
    const collection = db.get(table as string);
    await db.write(async () => {
      for (const raw of rows as Record<string, unknown>[]) {
        const id = raw.id as string;
        try {
          const existing = await collection.find(id);
          await existing.update(r => {
            Object.assign((r as unknown as { _raw: Record<string, unknown> })._raw, raw);
          });
        } catch {
          await collection.create(r => {
            Object.assign((r as unknown as { _raw: Record<string, unknown> })._raw, raw);
          });
        }
      }
    });
  }
}

export async function backupToDrive(encKey: string, accessToken: string): Promise<void> {
  const encrypted = await exportAllTables(encKey);
  await uploadFile(BACKUP_FILE, encrypted, accessToken);
}

export async function restoreFromDrive(
  encKey: string,
  accessToken: string,
): Promise<boolean> {
  const encrypted = await downloadFile(BACKUP_FILE, accessToken);
  if (!encrypted) return false;
  await importAllTables(encrypted, encKey);
  return true;
}

export async function backupIncrementalToDrive(
  encKey: string,
  accessToken: string,
  since: number,
): Promise<void> {
  const db = getDb();
  const dump: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const records = await db
      .get(table as string)
      .query(Q.where('updated_at', Q.gte(since)))
      .fetch();
    dump[table] = records.map(r => {
      const raw = Object.assign({}, (r as unknown as { _raw: Record<string, unknown> })._raw);
      delete raw._changed;
      delete raw._status;
      return raw;
    });
  }
  const hasData = Object.values(dump).some(rows => rows.length > 0);
  if (!hasData) return;
  const encrypted = encrypt(JSON.stringify(dump), encKey);
  await uploadFile(BACKUP_FILE, encrypted, accessToken);
}
