import { dismissMissedItem } from '../DismissMissedItemUseCase';

jest.mock('../../../../data/repositories/TaskRepository', () => ({
  taskRepository: { update: jest.fn() },
}));

jest.mock('../../../../data/repositories/TodoRepository', () => ({
  todoRepository: { update: jest.fn() },
}));

jest.mock('../../../../data/repositories/ReminderRepository', () => ({
  reminderRepository: { update: jest.fn() },
}));

jest.mock('../../../../core/notifications/NotifeeService', () => ({
  cancelNotification: jest.fn(),
  NOTIF_IDS: { missed: (type: string, id: string) => `missed-${type}-${id}` },
}));

const { taskRepository } = jest.requireMock('../../../../data/repositories/TaskRepository');
const { todoRepository } = jest.requireMock('../../../../data/repositories/TodoRepository');
const { reminderRepository } = jest.requireMock('../../../../data/repositories/ReminderRepository');
const { cancelNotification } = jest.requireMock('../../../../core/notifications/NotifeeService');

describe('dismissMissedItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cancels notification and marks task dismissed', async () => {
    taskRepository.update.mockResolvedValue(undefined);
    await dismissMissedItem('task', 't1');
    expect(cancelNotification).toHaveBeenCalledWith('missed-task-t1');
    expect(taskRepository.update).toHaveBeenCalledWith('t1', { isDismissed: true });
    expect(todoRepository.update).not.toHaveBeenCalled();
    expect(reminderRepository.update).not.toHaveBeenCalled();
  });

  it('cancels notification and marks todo dismissed', async () => {
    todoRepository.update.mockResolvedValue(undefined);
    await dismissMissedItem('todo', 'td1');
    expect(cancelNotification).toHaveBeenCalledWith('missed-todo-td1');
    expect(todoRepository.update).toHaveBeenCalledWith('td1', { isDismissed: true });
    expect(taskRepository.update).not.toHaveBeenCalled();
    expect(reminderRepository.update).not.toHaveBeenCalled();
  });

  it('cancels notification and marks reminder dismissed', async () => {
    reminderRepository.update.mockResolvedValue(undefined);
    await dismissMissedItem('reminder', 'r1');
    expect(cancelNotification).toHaveBeenCalledWith('missed-reminder-r1');
    expect(reminderRepository.update).toHaveBeenCalledWith('r1', { isDismissed: true });
    expect(taskRepository.update).not.toHaveBeenCalled();
    expect(todoRepository.update).not.toHaveBeenCalled();
  });
});
