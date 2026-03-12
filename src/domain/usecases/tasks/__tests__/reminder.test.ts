import { doneReminder } from '../DoneReminderUseCase';
import { snoozeReminder } from '../SnoozeReminderUseCase';
import { Priority } from '../../../../shared/constants/priority';

jest.mock('../../../../data/repositories/ReminderRepository', () => ({
  reminderRepository: {
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../AddReminderUseCase', () => ({
  addReminder: jest.fn(),
}));

jest.mock('../../../../core/utils/recurrence', () => ({
  computeNextDueDate: jest.fn(() => Date.now() + 7 * 86400000),
}));

const { reminderRepository } = jest.requireMock('../../../../data/repositories/ReminderRepository');
const { addReminder } = jest.requireMock('../AddReminderUseCase');

const BASE_REMINDER = {
  id: 'r1', title: 'Call dentist', description: null,
  remindAt: Date.now() - 3600000, isRecurring: false, recurrence: null,
  isDone: false, personId: null, relationType: null, priority: Priority.HIGH,
  tags: null, snoozeUntil: null, isMissed: false, missedAt: null,
  nextRemindAt: null, remindCount: 0, isDismissed: false,
  createdAt: 1000, updatedAt: 1000,
};

describe('doneReminder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when reminder not found', async () => {
    reminderRepository.getById.mockResolvedValue(null);
    await expect(doneReminder('nope')).rejects.toThrow('Reminder not found');
  });

  it('non-recurring: marks isDone=true', async () => {
    const done = { ...BASE_REMINDER, isDone: true };
    reminderRepository.getById.mockResolvedValue(BASE_REMINDER);
    reminderRepository.update.mockResolvedValue(done);

    const result = await doneReminder('r1');

    expect(reminderRepository.update).toHaveBeenCalledWith('r1', { isDone: true });
    expect(addReminder).not.toHaveBeenCalled();
    expect(result).toEqual({ reminder: done });
  });

  it('recurring: creates next occurrence, removes current', async () => {
    const recurring = { ...BASE_REMINDER, isRecurring: true, recurrence: 'weekly:1' };
    const next = { ...BASE_REMINDER, id: 'r2', isRecurring: true };
    reminderRepository.getById.mockResolvedValue(recurring);
    addReminder.mockResolvedValue(next);
    reminderRepository.remove.mockResolvedValue(undefined);

    const result = await doneReminder('r1');

    expect(addReminder).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Call dentist',
      isRecurring: true,
      recurrence: 'weekly:1',
      remindAt: expect.any(Number),
    }));
    expect(reminderRepository.remove).toHaveBeenCalledWith('r1');
    expect(result.reminder).toBe(recurring);
    expect(result.next).toBe(next);
  });

  it('recurring: preserves tags on next occurrence', async () => {
    const recurring = { ...BASE_REMINDER, isRecurring: true, recurrence: 'weekly:0', tags: '["health"]' };
    reminderRepository.getById.mockResolvedValue(recurring);
    addReminder.mockResolvedValue({ ...recurring, id: 'r2' });
    reminderRepository.remove.mockResolvedValue(undefined);

    await doneReminder('r1');

    expect(addReminder).toHaveBeenCalledWith(expect.objectContaining({ tags: '["health"]' }));
  });
});

describe('snoozeReminder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when reminder not found', async () => {
    reminderRepository.getById.mockResolvedValue(null);
    await expect(snoozeReminder('nope', 3600000)).rejects.toThrow('Reminder not found');
  });

  it('throws on non-positive snooze', async () => {
    reminderRepository.getById.mockResolvedValue(BASE_REMINDER);
    await expect(snoozeReminder('r1', 0)).rejects.toThrow('Snooze duration must be positive');
    await expect(snoozeReminder('r1', -1000)).rejects.toThrow('Snooze duration must be positive');
  });

  it('updates remindAt and snoozeUntil', async () => {
    const snoozed = { ...BASE_REMINDER, snoozeUntil: Date.now() + 3600000, remindAt: Date.now() + 3600000 };
    reminderRepository.getById.mockResolvedValue(BASE_REMINDER);
    reminderRepository.update.mockResolvedValue(snoozed);

    const result = await snoozeReminder('r1', 3600000);

    expect(reminderRepository.update).toHaveBeenCalledWith('r1', expect.objectContaining({
      remindAt: expect.any(Number),
      snoozeUntil: expect.any(Number),
    }));
    expect(result.snoozeUntil).toBeTruthy();
  });
});
