import { create } from 'zustand';
import { notificationConfigRepository } from '../../../data/repositories/NotificationRepository';
import {
  DEFAULT_NOTIFICATION_CONFIG,
  type NotificationConfig,
  type UpdateNotificationConfigInput,
} from '../../../domain/models/Notification';
import { storage } from '../../../core/storage/mmkv';
import { scheduleOrRescheduleDailyNotification } from '../../../domain/usecases/notifications/ScheduleDailyNotificationUseCase';

const LANGUAGE_KEY = 'user_language';
const AUTO_DETECT_KEY = 'auto_detect_language';

interface SettingsState {
  config: NotificationConfig | null;
  loading: boolean;
  language: string;
  autoDetectLanguage: boolean;

  loadConfig(): Promise<void>;
  updateConfig(updates: UpdateNotificationConfigInput): Promise<void>;
  setLanguage(lang: string): void;
  setAutoDetectLanguage(auto: boolean): void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  config: null,
  loading: false,
  language: storage.getString(LANGUAGE_KEY) ?? 'en',
  autoDetectLanguage: storage.getBoolean(AUTO_DETECT_KEY) ?? true,

  async loadConfig() {
    set({ loading: true });
    try {
      let config = await notificationConfigRepository.get();
      if (!config) {
        config = await notificationConfigRepository.create(DEFAULT_NOTIFICATION_CONFIG);
      }
      set({ config, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  async updateConfig(updates) {
    const { config } = get();
    if (!config) return;
    const updated = await notificationConfigRepository.update(config.id, updates);
    set({ config: updated });
    if (updates.dailyNotifTime !== undefined || updates.dailyNotifEnabled !== undefined) {
      scheduleOrRescheduleDailyNotification().catch(() => {});
    }
  },

  setLanguage(lang) {
    storage.set(LANGUAGE_KEY, lang);
    set({ language: lang });
  },

  setAutoDetectLanguage(auto) {
    storage.set(AUTO_DETECT_KEY, auto);
    set({ autoDetectLanguage: auto });
  },
}));
