import { checkMissedItems } from '../MissedItemChecker';
import { Priority } from '../../../shared/constants/priority';
import { TaskStatus } from '../../../shared/constants/taskStatus';

jest.mock('../../../data/repositories/TaskRepository', () => ({
  taskRepository: { getAll: jest.fn(), update: jest.fn() },
  todoRepository: { getAll: jest.fn(), update: jest.fn() },
  reminderRepository: { getAll: jest.fn(), update: jest.fn() },
}));

jest.mock('../../../data/repositories/NotificationRepository', () => ({
  notificationConfigRepository: { get: jest.fn() },
}));

jest.mock('../../notifications/NotifeeService', () => ({
  scheduleMissedItemNotification: jest.fn().mockResolvedValue(undefined),
}));

const { taskRepository, todoRepository, reminderRepository } =
  jest.requireMock('../../../data/repositories/TaskRepository');
const { notificationConfigRepository } =
  jest.requireMock('../../../data/repositories/NotificationRepository');
const { scheduleMissedItemNotification } =
  jest.requireMock('../../notifications/NotifeeService');

const CONFIG = {
  id: 'cfg1', dailyNotifTime: '09:00', dailyNotifEnabled: true,
  birthdayNotifEnabled: true, taskNotifEnabled: true, reminderNotifEnabled: true,
  missedNotifEnabled: true, highPriorityDays: 14, mediumPriorityDays: 7, lowPriorityDays: 2,
  missedHighInterval: 1, missedMediumInterval: 2, missedLowInterval: 7,
};

const yesterday = Date.now() - 86400000;
const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();

const OVERDUE_TASK = {
  id: 't1', title: 'Buy milk', description: null, dueDate: yesterday,
  dueTime: null, priority: Priority.HIGH, status: TaskStatus.PENDING,
  personId: null, relationType: null, isMissed: false, missedAt: null,
  nextRemindAt: null, remindCount: 0, isDismissed: false,
  createdAt: 1000, updatedAt: 1000, completedAt: null,
};

const OVERDUE_TODO = {
  id: 'td1', title: 'Read book', isCompleted: false, priority: Priority.MEDIUM,
  personId: null, relationType: null, dueDate: todayStart - 1,
  isMissed: false, missedAt: null, nextRemindAt: null, remindCount: 0,
  isDismissed: false, createdAt: 1000, updatedAt: 1000, completedAt: null,
};

const OVERDUE_REMINDER = {
  id: 'r1', title: 'Call dentist', description: null, remindAt: yesterday,
  isRecurring: false, recurrence: null, isDone: false,
  personId: null, relationType: null, priority: Priority.LOW,
  isMissed: false, missedAt: null, nextRemindAt: null, remindCount: 0,
  isDismissed: false, createdAt: 1000, updatedAt: 1000,
};

describe('checkMissedItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationConfigRepository.get.mockResolvedValue(CONFIG);
  });

  it('does nothing when notifications are disabled', async () => {
    notificationConfigRepository.get.mockResolvedValue({ ...CONFIG, missedNotifEnabled: false });
    taskRepository.getAll.mockResolvedValue([OVERDUE_TASK]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);

    await checkMissedItems();

    expect(taskRepository.update).not.toHaveBeenCalled();
    expect(scheduleMissedItemNotification).not.toHaveBeenCalled();
  });

  it('marks overdue task as missed and schedules notification', async () => {
    taskRepository.getAll.mockResolvedValue([OVERDUE_TASK]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);
    taskRepository.update.mockResolvedValue({ ...OVERDUE_TASK, isMissed: true, remindCount: 1 });

    await checkMissedItems();

    expect(taskRepository.update).toHaveBeenCalledWith('t1', expect.objectContaining({
      isMissed: true,
      remindCount: 1,
    }));
    expect(scheduleMissedItemNotification).toHaveBeenCalledWith(
      'task', 't1', 'Buy milk', 1, expect.any(Number),
    );
  });

  it('skips dismissed tasks', async () => {
    taskRepository.getAll.mockResolvedValue([{ ...OVERDUE_TASK, isDismissed: true }]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);

    await checkMissedItems();

    expect(taskRepository.update).not.toHaveBeenCalled();
  });

  it('skips tasks not yet due for re-remind', async () => {
    const future = Date.now() + 86400000;
    taskRepository.getAll.mockResolvedValue([{ ...OVERDUE_TASK, nextRemindAt: future }]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);

    await checkMissedItems();

    expect(taskRepository.update).not.toHaveBeenCalled();
  });

  it('marks overdue todo as missed', async () => {
    taskRepository.getAll.mockResolvedValue([]);
    todoRepository.getAll.mockResolvedValue([OVERDUE_TODO]);
    reminderRepository.getAll.mockResolvedValue([]);
    todoRepository.update.mockResolvedValue({ ...OVERDUE_TODO, isMissed: true, remindCount: 1 });

    await checkMissedItems();

    expect(todoRepository.update).toHaveBeenCalledWith('td1', expect.objectContaining({
      isMissed: true,
      remindCount: 1,
    }));
    expect(scheduleMissedItemNotification).toHaveBeenCalledWith(
      'todo', 'td1', 'Read book', 1, expect.any(Number),
    );
  });

  it('marks overdue reminder as missed', async () => {
    taskRepository.getAll.mockResolvedValue([]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([OVERDUE_REMINDER]);
    reminderRepository.update.mockResolvedValue({ ...OVERDUE_REMINDER, isMissed: true, remindCount: 1 });

    await checkMissedItems();

    expect(reminderRepository.update).toHaveBeenCalledWith('r1', expect.objectContaining({
      isMissed: true,
      remindCount: 1,
    }));
    expect(scheduleMissedItemNotification).toHaveBeenCalledWith(
      'reminder', 'r1', 'Call dentist', 1, expect.any(Number),
    );
  });

  it('uses correct interval for high priority (1 day)', async () => {
    taskRepository.getAll.mockResolvedValue([OVERDUE_TASK]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);
    taskRepository.update.mockResolvedValue({ ...OVERDUE_TASK });

    await checkMissedItems();

    const updateCall = taskRepository.update.mock.calls[0][1];
    const expectedInterval = 1 * 86400000;
    expect(updateCall.nextRemindAt).toBeGreaterThanOrEqual(Date.now() + expectedInterval - 1000);
    expect(updateCall.nextRemindAt).toBeLessThanOrEqual(Date.now() + expectedInterval + 1000);
  });
});
