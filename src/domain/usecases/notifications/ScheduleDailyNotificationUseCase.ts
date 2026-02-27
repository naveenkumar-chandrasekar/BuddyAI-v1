import { storage } from '../../../core/storage/mmkv';
import { scheduleDailyNotification } from '../../../core/notifications/NotifeeService';
import { generateDailySummary, formatDailySummaryBody } from './GenerateDailySummaryUseCase';

const DAILY_TIME_KEY = 'daily_notif_time';
const DEFAULT_TIME = '09:00';

export function getDailyNotifTime(): string {
  return storage.getString(DAILY_TIME_KEY) ?? DEFAULT_TIME;
}

export function setDailyNotifTime(timeHHMM: string): void {
  storage.set(DAILY_TIME_KEY, timeHHMM);
}

export async function scheduleOrRescheduleDailyNotification(): Promise<void> {
  const time = getDailyNotifTime();
  const summary = await generateDailySummary();
  const body = formatDailySummaryBody(summary);
  await scheduleDailyNotification(time, body);
}
