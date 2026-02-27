import firestore from '@react-native-firebase/firestore';
import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import { encrypt, decrypt } from '../../core/security/EncryptionService';

const TABLES = [
  'places',
  'people',
  'tasks',
  'todos',
  'reminders',
  'chat_sessions',
  'chat_messages',
] as const;

type TableName = (typeof TABLES)[number];

function userCollection(userId: string, table: TableName) {
  return firestore().collection('users').doc(userId).collection(table);
}

async function uploadTable(
  userId: string,
  table: TableName,
  encKey: string,
  since?: number,
): Promise<void> {
  const collection = getDb().get(table);
  const query =
    since !== undefined
      ? collection.query(Q.where('updated_at', Q.gte(since)))
      : collection.query();
  const records = await query.fetch();
  if (records.length === 0) return;

  const batch = firestore().batch();
  const colRef = userCollection(userId, table);
  for (const record of records) {
    const raw = Object.assign({}, record._raw) as Record<string, unknown>;
    delete raw._changed;
    delete raw._status;
    const data = encrypt(JSON.stringify(raw), encKey);
    batch.set(colRef.doc(record.id), { data, updatedAt: Date.now() });
  }
  await batch.commit();
}

async function downloadTable(
  userId: string,
  table: TableName,
  encKey: string,
): Promise<void> {
  const snapshot = await userCollection(userId, table).get();
  if (snapshot.empty) return;

  const db = getDb();
  const collection = db.get(table);
  await db.write(async () => {
    for (const doc of snapshot.docs) {
      const { data } = doc.data() as { data: string };
      const raw = JSON.parse(decrypt(data, encKey)) as Record<string, unknown>;
      try {
        const existing = await collection.find(doc.id);
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

export async function uploadAll(userId: string, encKey: string): Promise<void> {
  for (const table of TABLES) {
    await uploadTable(userId, table, encKey);
  }
}

export async function uploadIncremental(
  userId: string,
  encKey: string,
  since: number,
): Promise<void> {
  for (const table of TABLES) {
    await uploadTable(userId, table, encKey, since);
  }
}

export async function downloadAll(userId: string, encKey: string): Promise<void> {
  for (const table of TABLES) {
    await downloadTable(userId, table, encKey);
  }
}
