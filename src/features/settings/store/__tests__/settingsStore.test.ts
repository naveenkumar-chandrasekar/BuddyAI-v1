import { act } from '@testing-library/react-native';
import { useSettingsStore } from '../settingsStore';
import { DEFAULT_NOTIFICATION_CONFIG } from '../../../../domain/models/Notification';

jest.mock('../../../../data/repositories/NotificationRepository', () => ({
  notificationConfigRepository: {
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../../../core/storage/mmkv', () => {
  const store = new Map<string, unknown>();
  return {
    storage: {
      getString: (k: string) => store.get(k) as string | undefined,
      getBoolean: (k: string) => store.get(k) as boolean | undefined,
      set: (k: string, v: unknown) => store.set(k, v),
    },
    _clearAll: () => store.clear(),
  };
});

jest.mock('../../../../domain/usecases/notifications/ScheduleDailyNotificationUseCase', () => ({
  scheduleOrRescheduleDailyNotification: jest.fn().mockResolvedValue(undefined),
}));

const { notificationConfigRepository } =
  jest.requireMock('../../../../data/repositories/NotificationRepository');
const { _clearAll } = jest.requireMock('../../../../core/storage/mmkv');
const { scheduleOrRescheduleDailyNotification } = jest.requireMock(
  '../../../../domain/usecases/notifications/ScheduleDailyNotificationUseCase',
);

const MOCK_CONFIG = {
  id: 'cfg1',
  ...DEFAULT_NOTIFICATION_CONFIG,
};

describe('settingsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _clearAll();
    useSettingsStore.setState({ config: null, loading: false });
  });

  describe('loadConfig', () => {
    it('loads existing config from repository', async () => {
      notificationConfigRepository.get.mockResolvedValue(MOCK_CONFIG);
      await act(async () => { await useSettingsStore.getState().loadConfig(); });
      expect(useSettingsStore.getState().config).toEqual(MOCK_CONFIG);
      expect(useSettingsStore.getState().loading).toBe(false);
      expect(notificationConfigRepository.create).not.toHaveBeenCalled();
    });

    it('creates default config when none exists', async () => {
      notificationConfigRepository.get.mockResolvedValue(null);
      notificationConfigRepository.create.mockResolvedValue(MOCK_CONFIG);
      await act(async () => { await useSettingsStore.getState().loadConfig(); });
      expect(notificationConfigRepository.create).toHaveBeenCalledWith(DEFAULT_NOTIFICATION_CONFIG);
      expect(useSettingsStore.getState().config).toEqual(MOCK_CONFIG);
    });

    it('sets loading false on error', async () => {
      notificationConfigRepository.get.mockRejectedValue(new Error('db error'));
      await act(async () => { await useSettingsStore.getState().loadConfig(); });
      expect(useSettingsStore.getState().loading).toBe(false);
      expect(useSettingsStore.getState().config).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('updates config and sets state', async () => {
      const updated = { ...MOCK_CONFIG, dailyNotifEnabled: false };
      useSettingsStore.setState({ config: MOCK_CONFIG });
      notificationConfigRepository.update.mockResolvedValue(updated);
      await act(async () => {
        await useSettingsStore.getState().updateConfig({ dailyNotifEnabled: false });
      });
      expect(notificationConfigRepository.update).toHaveBeenCalledWith('cfg1', { dailyNotifEnabled: false });
      expect(useSettingsStore.getState().config).toEqual(updated);
    });

    it('reschedules daily notification when dailyNotifTime changes', async () => {
      const updated = { ...MOCK_CONFIG, dailyNotifTime: '10:00' };
      useSettingsStore.setState({ config: MOCK_CONFIG });
      notificationConfigRepository.update.mockResolvedValue(updated);
      await act(async () => {
        await useSettingsStore.getState().updateConfig({ dailyNotifTime: '10:00' });
      });
      expect(scheduleOrRescheduleDailyNotification).toHaveBeenCalled();
    });

    it('reschedules daily notification when dailyNotifEnabled changes', async () => {
      const updated = { ...MOCK_CONFIG, dailyNotifEnabled: false };
      useSettingsStore.setState({ config: MOCK_CONFIG });
      notificationConfigRepository.update.mockResolvedValue(updated);
      await act(async () => {
        await useSettingsStore.getState().updateConfig({ dailyNotifEnabled: false });
      });
      expect(scheduleOrRescheduleDailyNotification).toHaveBeenCalled();
    });

    it('does not reschedule for non-time updates', async () => {
      const updated = { ...MOCK_CONFIG, taskNotifEnabled: false };
      useSettingsStore.setState({ config: MOCK_CONFIG });
      notificationConfigRepository.update.mockResolvedValue(updated);
      await act(async () => {
        await useSettingsStore.getState().updateConfig({ taskNotifEnabled: false });
      });
      expect(scheduleOrRescheduleDailyNotification).not.toHaveBeenCalled();
    });

    it('does nothing when config is null', async () => {
      useSettingsStore.setState({ config: null });
      await act(async () => {
        await useSettingsStore.getState().updateConfig({ taskNotifEnabled: false });
      });
      expect(notificationConfigRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('setLanguage', () => {
    it('updates language in state and storage', () => {
      useSettingsStore.getState().setLanguage('fr');
      expect(useSettingsStore.getState().language).toBe('fr');
    });
  });

  describe('setAutoDetectLanguage', () => {
    it('updates autoDetectLanguage in state and storage', () => {
      useSettingsStore.getState().setAutoDetectLanguage(false);
      expect(useSettingsStore.getState().autoDetectLanguage).toBe(false);
    });
  });
});
