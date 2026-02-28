import { getLastSyncTime, setLastSyncTime, syncToDrive, restoreFromDriveBackup } from '../SyncUseCase';

jest.mock('../../../../core/storage/mmkv', () => {
  const store = new Map<string, unknown>();
  return {
    storage: {
      set: jest.fn((k: string, v: unknown): void => { store.set(k, v); }),
      getNumber: jest.fn((k: string): number | undefined => store.get(k) as number | undefined),
      getString: jest.fn((k: string): string | undefined => store.get(k) as string | undefined),
      remove: jest.fn((k: string): void => { store.delete(k); }),
    },
    _clearAll: (): void => { store.clear(); },
  };
});

jest.mock('../../../../data/firebase/FirebaseAuth', () => ({
  getCurrentUser: jest.fn(),
  getAccessToken: jest.fn().mockResolvedValue('mock-token'),
}));

jest.mock('../../../../core/security/KeystoreService', () => ({
  getKey: jest.fn().mockResolvedValue('a'.repeat(64)),
}));

jest.mock('../../../../data/google-drive/DriveBackupService', () => ({
  uploadKeyToDrive: jest.fn().mockResolvedValue(undefined),
  backupToDrive: jest.fn().mockResolvedValue(undefined),
  backupIncrementalToDrive: jest.fn().mockResolvedValue(undefined),
  restoreFromDrive: jest.fn().mockResolvedValue(true),
  downloadKeyFromDrive: jest.fn().mockResolvedValue(null),
}));

const { getCurrentUser } = jest.requireMock('../../../../data/firebase/FirebaseAuth');
const {
  uploadKeyToDrive,
  backupToDrive,
  backupIncrementalToDrive,
  restoreFromDrive,
} = jest.requireMock('../../../../data/google-drive/DriveBackupService');

function clearStore() {
  const { _clearAll } = jest.requireMock('../../../../core/storage/mmkv') as { _clearAll: () => void };
  _clearAll();
}

describe('SyncUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStore();
  });

  it('getLastSyncTime returns null when never set', () => {
    expect(getLastSyncTime()).toBeNull();
  });

  it('setLastSyncTime persists and getLastSyncTime retrieves it', () => {
    const ts = 1700000000000;
    setLastSyncTime(ts);
    expect(getLastSyncTime()).toBe(ts);
  });

  it('syncToDrive returns success=true without calling backup when no user', async () => {
    getCurrentUser.mockReturnValue(null);
    const result = await syncToDrive();
    expect(result.success).toBe(true);
    expect(backupToDrive).not.toHaveBeenCalled();
    expect(backupIncrementalToDrive).not.toHaveBeenCalled();
  });

  it('syncToDrive calls uploadKeyToDrive + backupToDrive on first sync', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: 'test@test.com', displayName: null });
    const result = await syncToDrive();
    expect(result.success).toBe(true);
    expect(uploadKeyToDrive).toHaveBeenCalledWith('a'.repeat(64), 'mock-token');
    expect(backupToDrive).toHaveBeenCalledWith('a'.repeat(64), 'mock-token');
    expect(backupIncrementalToDrive).not.toHaveBeenCalled();
  });

  it('syncToDrive calls backupIncrementalToDrive on subsequent sync', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: 'test@test.com', displayName: null });
    const prevTs = 1700000000000;
    setLastSyncTime(prevTs);
    const result = await syncToDrive();
    expect(result.success).toBe(true);
    expect(backupIncrementalToDrive).toHaveBeenCalledWith('a'.repeat(64), 'mock-token', prevTs);
    expect(backupToDrive).not.toHaveBeenCalled();
  });

  it('syncToDrive updates lastSyncTime on success', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: null, displayName: null });
    const before = Date.now();
    await syncToDrive();
    const after = Date.now();
    const ts = getLastSyncTime();
    expect(ts).not.toBeNull();
    expect(ts!).toBeGreaterThanOrEqual(before);
    expect(ts!).toBeLessThanOrEqual(after);
  });

  it('syncToDrive returns error on backup failure', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: null, displayName: null });
    backupToDrive.mockRejectedValueOnce(new Error('network error'));
    const result = await syncToDrive();
    expect(result.success).toBe(false);
    expect(result.error).toContain('network error');
  });

  it('restoreFromDriveBackup returns success when backup exists', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: null, displayName: null });
    restoreFromDrive.mockResolvedValueOnce(true);
    const result = await restoreFromDriveBackup();
    expect(result.success).toBe(true);
  });

  it('restoreFromDriveBackup returns error when no backup found', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: null, displayName: null });
    restoreFromDrive.mockResolvedValueOnce(false);
    const result = await restoreFromDriveBackup();
    expect(result.success).toBe(false);
    expect(result.error).toContain('No backup found');
  });

  it('restoreFromDriveBackup returns error when not signed in', async () => {
    getCurrentUser.mockReturnValue(null);
    const result = await restoreFromDriveBackup();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not signed in');
  });
});
