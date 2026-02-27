import BackgroundFetch from 'react-native-background-fetch';
import { checkMissedItems } from '../missed/MissedItemChecker';
import { checkAndScheduleBirthdayReminders } from '../../domain/usecases/notifications/BirthdayReminderUseCase';
import { scheduleOrRescheduleDailyNotification } from '../../domain/usecases/notifications/ScheduleDailyNotificationUseCase';

async function onBackgroundFetch(taskId: string): Promise<void> {
  try {
    await Promise.all([
      checkMissedItems(),
      checkAndScheduleBirthdayReminders(),
      scheduleOrRescheduleDailyNotification(),
    ]);
  } catch {
  } finally {
    BackgroundFetch.finish(taskId);
  }
}

function onTimeout(taskId: string): void {
  BackgroundFetch.finish(taskId);
}

export async function initBackgroundFetch(): Promise<void> {
  await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
    },
    onBackgroundFetch,
    onTimeout,
  );

  await BackgroundFetch.start();
}

export async function stopBackgroundFetch(): Promise<void> {
  await BackgroundFetch.stop();
}
