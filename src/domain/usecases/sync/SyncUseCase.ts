import { storage } from '../../../core/storage/mmkv';
import { getCurrentUser } from '../../../data/firebase/FirebaseAuth';
import { getKey } from '../../../core/security/KeystoreService';
import { uploadAll, uploadIncremental } from '../../../data/firebase/FirebaseService';

const LAST_SYNC_KEY = 'last_sync_timestamp';

export function getLastSyncTime(): number | null {
  return storage.getNumber(LAST_SYNC_KEY) ?? null;
}

export function setLastSyncTime(ts: number): void {
  storage.set(LAST_SYNC_KEY, ts);
}

export async function syncToFirebase(): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser();
  if (!user) return { success: true };

  const encKey = await getKey();
  if (!encKey) return { success: false, error: 'Encryption key not found' };

  try {
    const lastSync = getLastSyncTime();
    if (lastSync === null) {
      await uploadAll(user.uid, encKey);
    } else {
      await uploadIncremental(user.uid, encKey, lastSync);
    }
    setLastSyncTime(Date.now());
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
