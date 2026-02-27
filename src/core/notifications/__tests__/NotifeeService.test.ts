import {
  createNotificationChannels,
  scheduleDailyNotification,
  scheduleBirthdayNotification,
  scheduleReminderNotification,
  scheduleMissedItemNotification,
  cancelNotification,
  CHANNEL_IDS,
  NOTIF_IDS,
} from '../NotifeeService';
import notifee from '@notifee/react-native';

describe('NotifeeService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createNotificationChannels', () => {
    it('creates all 5 channels', async () => {
      await createNotificationChannels();
      expect(notifee.createChannel).toHaveBeenCalledTimes(5);
      const ids = (notifee.createChannel as jest.Mock).mock.calls.map(c => c[0].id);
      expect(ids).toContain(CHANNEL_IDS.DAILY);
      expect(ids).toContain(CHANNEL_IDS.BIRTHDAY);
      expect(ids).toContain(CHANNEL_IDS.TASK);
      expect(ids).toContain(CHANNEL_IDS.REMINDER);
      expect(ids).toContain(CHANNEL_IDS.MISSED);
    });
  });

  describe('scheduleDailyNotification', () => {
    it('cancels existing and creates trigger', async () => {
      await scheduleDailyNotification('09:00', 'Today summary');
      expect(notifee.cancelNotification).toHaveBeenCalledWith(NOTIF_IDS.DAILY);
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: NOTIF_IDS.DAILY }),
        expect.objectContaining({ type: 0 }),
      );
    });

    it('schedules for next day if time is in the past', async () => {
      await scheduleDailyNotification('00:00', 'Summary');
      const trigger = (notifee.createTriggerNotification as jest.Mock).mock.calls[0][1];
      expect(trigger.timestamp).toBeGreaterThan(Date.now());
    });
  });

  describe('scheduleBirthdayNotification', () => {
    it('schedules a birthday notification for future date', async () => {
      const future = new Date(Date.now() + 86400000 * 7);
      await scheduleBirthdayNotification('Alice', 'p1', future);
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: NOTIF_IDS.birthday('p1'),
          data: expect.objectContaining({ personId: 'p1' }),
        }),
        expect.objectContaining({ timestamp: future.getTime() }),
      );
    });

    it('skips scheduling if date is in the past', async () => {
      const past = new Date(Date.now() - 1000);
      await scheduleBirthdayNotification('Bob', 'p2', past);
      expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    });
  });

  describe('scheduleReminderNotification', () => {
    it('schedules for future reminder', async () => {
      const reminder = {
        id: 'r1', title: 'Call dentist', description: 'Important',
        remindAt: Date.now() + 3600000, isRecurring: false, recurrence: null,
        isDone: false, personId: null, relationType: null, priority: 1 as const,
        isMissed: false, missedAt: null, nextRemindAt: null, remindCount: 0,
        isDismissed: false, createdAt: 1000, updatedAt: 1000,
      };
      await scheduleReminderNotification(reminder);
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: NOTIF_IDS.reminder('r1'), title: 'Call dentist' }),
        expect.any(Object),
      );
    });

    it('skips past reminders', async () => {
      const reminder = {
        id: 'r2', title: 'Old reminder', description: null,
        remindAt: Date.now() - 1000, isRecurring: false, recurrence: null,
        isDone: false, personId: null, relationType: null, priority: 2 as const,
        isMissed: false, missedAt: null, nextRemindAt: null, remindCount: 0,
        isDismissed: false, createdAt: 1000, updatedAt: 1000,
      };
      await scheduleReminderNotification(reminder);
      expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    });
  });

  describe('scheduleMissedItemNotification', () => {
    it('schedules for future nextRemindAt', async () => {
      const nextRemindAt = Date.now() + 86400000;
      await scheduleMissedItemNotification('task', 't1', 'Buy milk', 2, nextRemindAt);
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: NOTIF_IDS.missed('task', 't1'),
          title: 'Missed task: Buy milk',
        }),
        expect.objectContaining({ timestamp: nextRemindAt }),
      );
    });
  });

  describe('cancelNotification', () => {
    it('calls notifee cancel', async () => {
      await cancelNotification('some-id');
      expect(notifee.cancelNotification).toHaveBeenCalledWith('some-id');
    });
  });
});
