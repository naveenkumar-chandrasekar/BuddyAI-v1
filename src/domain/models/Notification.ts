export interface NotificationConfig {
  id: string;
  dailyNotifTime: string;
  dailyNotifEnabled: boolean;
  birthdayNotifEnabled: boolean;
  taskNotifEnabled: boolean;
  reminderNotifEnabled: boolean;
  missedNotifEnabled: boolean;
  highPriorityDays: number;
  mediumPriorityDays: number;
  lowPriorityDays: number;
  missedHighInterval: number;
  missedMediumInterval: number;
  missedLowInterval: number;
}

export type CreateNotificationConfigInput = Omit<NotificationConfig, 'id'>;
export type UpdateNotificationConfigInput = Partial<CreateNotificationConfigInput>;

export interface BirthdayReminder {
  id: string;
  personId: string;
  birthdayDate: string;
  remindOn: string;
  daysBefore: number;
  isNotified: boolean;
  isDismissed: boolean;
}

export const DEFAULT_NOTIFICATION_CONFIG: CreateNotificationConfigInput = {
  dailyNotifTime: '09:00',
  dailyNotifEnabled: true,
  birthdayNotifEnabled: true,
  taskNotifEnabled: true,
  reminderNotifEnabled: true,
  missedNotifEnabled: true,
  highPriorityDays: 14,
  mediumPriorityDays: 7,
  lowPriorityDays: 2,
  missedHighInterval: 1,
  missedMediumInterval: 2,
  missedLowInterval: 7,
};
