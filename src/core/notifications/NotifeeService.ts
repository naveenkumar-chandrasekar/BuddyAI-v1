import notifee, { AndroidImportance, TriggerType, AndroidVisibility } from '@notifee/react-native';
import type { Reminder } from '../../domain/models/Task';

export const CHANNEL_IDS = {
  DAILY: 'daily',
  BIRTHDAY: 'birthday',
  TASK: 'task',
  REMINDER: 'reminder',
  MISSED: 'missed',
} as const;

export const NOTIF_IDS = {
  DAILY: 'daily-summary',
  birthday: (personId: string) => `birthday-${personId}`,
  task: (taskId: string) => `task-${taskId}`,
  reminder: (reminderId: string) => `reminder-${reminderId}`,
  missed: (type: 'task' | 'todo' | 'reminder', id: string) => `missed-${type}-${id}`,
} as const;

export async function createNotificationChannels(): Promise<void> {
  await Promise.all([
    notifee.createChannel({
      id: CHANNEL_IDS.DAILY,
      name: 'Daily Summary',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    }),
    notifee.createChannel({
      id: CHANNEL_IDS.BIRTHDAY,
      name: 'Birthday Reminders',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    }),
    notifee.createChannel({
      id: CHANNEL_IDS.TASK,
      name: 'Task Reminders',
      importance: AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PRIVATE,
    }),
    notifee.createChannel({
      id: CHANNEL_IDS.REMINDER,
      name: 'Reminders',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PRIVATE,
    }),
    notifee.createChannel({
      id: CHANNEL_IDS.MISSED,
      name: 'Missed Items',
      importance: AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PRIVATE,
    }),
  ]);
}

export async function scheduleDailyNotification(
  timeHHMM: string,
  body: string,
): Promise<void> {
  await notifee.cancelNotification(NOTIF_IDS.DAILY);

  const [hours, minutes] = timeHHMM.split(':').map(Number);
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await notifee.createTriggerNotification(
    {
      id: NOTIF_IDS.DAILY,
      title: "BuddyAi — Your day's summary",
      body,
      android: {
        channelId: CHANNEL_IDS.DAILY,
        pressAction: { id: 'open-chat', launchActivity: 'default' },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: trigger.getTime(),
      alarmManager: { allowWhileIdle: true },
    },
  );
}

export async function scheduleBirthdayNotification(
  personName: string,
  personId: string,
  remindOn: Date,
): Promise<void> {
  const id = NOTIF_IDS.birthday(personId);
  await notifee.cancelNotification(id);

  if (remindOn.getTime() <= Date.now()) return;

  await notifee.createTriggerNotification(
    {
      id,
      title: `🎂 Birthday reminder`,
      body: `${personName}'s birthday is coming up!`,
      android: {
        channelId: CHANNEL_IDS.BIRTHDAY,
        pressAction: { id: 'open-person', launchActivity: 'default' },
      },
      data: { personId },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: remindOn.getTime(),
      alarmManager: { allowWhileIdle: true },
    },
  );
}

export async function scheduleReminderNotification(reminder: Reminder): Promise<void> {
  const id = NOTIF_IDS.reminder(reminder.id);
  await notifee.cancelNotification(id);

  if (reminder.remindAt <= Date.now()) return;

  await notifee.createTriggerNotification(
    {
      id,
      title: reminder.title,
      body: reminder.description ?? 'Time for your reminder',
      android: {
        channelId: CHANNEL_IDS.REMINDER,
        pressAction: { id: 'open-reminder', launchActivity: 'default' },
        actions: [
          { title: 'Dismiss', pressAction: { id: 'dismiss-reminder' } },
        ],
      },
      data: { reminderId: reminder.id },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: reminder.remindAt,
      alarmManager: { allowWhileIdle: true },
    },
  );
}

export async function scheduleMissedItemNotification(
  type: 'task' | 'todo' | 'reminder',
  id: string,
  title: string,
  remindCount: number,
  nextRemindAt: number,
): Promise<void> {
  const notifId = NOTIF_IDS.missed(type, id);
  await notifee.cancelNotification(notifId);

  if (nextRemindAt <= Date.now()) return;

  await notifee.createTriggerNotification(
    {
      id: notifId,
      title: `Missed ${type}: ${title}`,
      body: `You have been reminded ${remindCount} time${remindCount !== 1 ? 's' : ''} about this item.`,
      android: {
        channelId: CHANNEL_IDS.MISSED,
        pressAction: { id: 'open-chat', launchActivity: 'default' },
        actions: [
          { title: 'Dismiss', pressAction: { id: `dismiss-${type}-${id}` } },
        ],
      },
      data: { type, itemId: id },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: nextRemindAt,
      alarmManager: { allowWhileIdle: true },
    },
  );
}

export async function cancelNotification(id: string): Promise<void> {
  await notifee.cancelNotification(id);
}
