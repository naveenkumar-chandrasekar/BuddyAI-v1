import { getLastSyncTime, setLastSyncTime, syncToFirebase } from '../SyncUseCase';

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
}));

jest.mock('../../../../core/security/KeystoreService', () => ({
  getKey: jest.fn().mockResolvedValue('a'.repeat(64)),
}));

jest.mock('../../../../data/firebase/FirebaseService', () => ({
  uploadAll: jest.fn().mockResolvedValue(undefined),
  uploadIncremental: jest.fn().mockResolvedValue(undefined),
}));

const { getCurrentUser } = jest.requireMock('../../../../data/firebase/FirebaseAuth');
const { uploadAll, uploadIncremental } = jest.requireMock('../../../../data/firebase/FirebaseService');

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

  it('syncToFirebase returns success=true without calling upload when no user', async () => {
    getCurrentUser.mockReturnValue(null);
    const result = await syncToFirebase();
    expect(result.success).toBe(true);
    expect(uploadAll).not.toHaveBeenCalled();
    expect(uploadIncremental).not.toHaveBeenCalled();
  });

  it('syncToFirebase calls uploadAll on first sync', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: 'test@test.com', displayName: null });
    const result = await syncToFirebase();
    expect(result.success).toBe(true);
    expect(uploadAll).toHaveBeenCalledWith('u1', 'a'.repeat(64));
    expect(uploadIncremental).not.toHaveBeenCalled();
  });

  it('syncToFirebase calls uploadIncremental on subsequent sync', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: 'test@test.com', displayName: null });
    const prevTs = 1700000000000;
    setLastSyncTime(prevTs);
    const result = await syncToFirebase();
    expect(result.success).toBe(true);
    expect(uploadIncremental).toHaveBeenCalledWith('u1', 'a'.repeat(64), prevTs);
    expect(uploadAll).not.toHaveBeenCalled();
  });

  it('syncToFirebase updates lastSyncTime on success', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: null, displayName: null });
    const before = Date.now();
    await syncToFirebase();
    const after = Date.now();
    const ts = getLastSyncTime();
    expect(ts).not.toBeNull();
    expect(ts!).toBeGreaterThanOrEqual(before);
    expect(ts!).toBeLessThanOrEqual(after);
  });

  it('syncToFirebase returns error on upload failure', async () => {
    getCurrentUser.mockReturnValue({ uid: 'u1', email: null, displayName: null });
    uploadAll.mockRejectedValueOnce(new Error('network error'));
    const result = await syncToFirebase();
    expect(result.success).toBe(false);
    expect(result.error).toContain('network error');
  });
});
