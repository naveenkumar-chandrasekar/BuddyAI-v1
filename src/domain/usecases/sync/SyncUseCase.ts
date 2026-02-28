import { storage } from '../../../core/storage/mmkv';
import { getCurrentUser, getAccessToken } from '../../../data/firebase/FirebaseAuth';
import { getKey } from '../../../core/security/KeystoreService';
import {
  backupToDrive,
  backupIncrementalToDrive,
  restoreFromDrive,
  uploadKeyToDrive,
  downloadKeyFromDrive,
} from '../../../data/google-drive/DriveBackupService';

const LAST_SYNC_KEY = 'last_sync_timestamp';

export function getLastSyncTime(): number | null {
  return storage.getNumber(LAST_SYNC_KEY) ?? null;
}

export function setLastSyncTime(ts: number): void {
  storage.set(LAST_SYNC_KEY, ts);
}

export async function syncToDrive(): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser();
  if (!user) return { success: true };

  const encKey = await getKey(user.uid);
  if (!encKey) return { success: false, error: 'Encryption key not found' };

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not signed in to Google' };

  try {
    const lastSync = getLastSyncTime();
    if (lastSync === null) {
      await uploadKeyToDrive(encKey, token);
      await backupToDrive(encKey, token);
    } else {
      await backupIncrementalToDrive(encKey, token, lastSync);
    }
    setLastSyncTime(Date.now());
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function restoreFromDriveBackup(): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'Not signed in' };

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not signed in to Google' };

  const encKey = await getKey(user.uid);
  if (!encKey) return { success: false, error: 'Encryption key not found' };

  try {
    const restored = await restoreFromDrive(encKey, token);
    if (!restored) return { success: false, error: 'No backup found on Drive' };
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function fetchDriveKey(token: string): Promise<string | null> {
  return downloadKeyFromDrive(token);
}
