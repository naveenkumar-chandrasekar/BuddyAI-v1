import { completeTask } from '../CompleteTaskUseCase';
import { cancelTask } from '../CancelTaskUseCase';
import { Priority } from '../../../../shared/constants/priority';
import { TaskStatus } from '../../../../shared/constants/taskStatus';

jest.mock('../../../../data/repositories/TaskRepository', () => ({
  taskRepository: { getById: jest.fn(), update: jest.fn(), remove: jest.fn(), create: jest.fn() },
}));

jest.mock('../AddTaskUseCase', () => ({
  addTask: jest.fn(),
}));

jest.mock('../../../../core/utils/recurrence', () => ({
  computeNextDueDate: jest.fn(() => Date.now() + 7 * 86400000),
}));

const { taskRepository } = jest.requireMock('../../../../data/repositories/TaskRepository');
const { addTask } = jest.requireMock('../AddTaskUseCase');

const BASE_TASK = {
  id: 't1', title: 'Weekly report', description: null, dueDate: Date.now() - 86400000,
  dueTime: null, priority: Priority.HIGH, status: TaskStatus.PENDING,
  personId: null, relationType: null, tags: null, estimatedMinutes: null,
  isRecurring: false, recurrence: null, isMissed: false, missedAt: null,
  nextRemindAt: null, remindCount: 0, isDismissed: false,
  createdAt: 1000, updatedAt: 1000, completedAt: null,
};

describe('completeTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when task not found', async () => {
    taskRepository.getById.mockResolvedValue(null);
    await expect(completeTask('nope')).rejects.toThrow('Task not found');
  });

  it('non-recurring: updates status to DONE', async () => {
    const done = { ...BASE_TASK, status: TaskStatus.DONE, completedAt: Date.now() };
    taskRepository.getById.mockResolvedValue(BASE_TASK);
    taskRepository.update.mockResolvedValue(done);

    const result = await completeTask('t1');

    expect(taskRepository.update).toHaveBeenCalledWith('t1', { status: TaskStatus.DONE });
    expect(addTask).not.toHaveBeenCalled();
    expect(result).toEqual({ task: done });
  });

  it('recurring: creates next occurrence, removes current, returns { task, next }', async () => {
    const recurringTask = { ...BASE_TASK, isRecurring: true, recurrence: 'weekly:2' };
    const nextTask = { ...BASE_TASK, id: 't2', isRecurring: true, recurrence: 'weekly:2' };
    taskRepository.getById.mockResolvedValue(recurringTask);
    addTask.mockResolvedValue(nextTask);
    taskRepository.remove.mockResolvedValue(undefined);

    const result = await completeTask('t1');

    expect(addTask).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Weekly report',
      isRecurring: true,
      recurrence: 'weekly:2',
      dueDate: expect.any(Number),
    }));
    expect(taskRepository.remove).toHaveBeenCalledWith('t1');
    expect(taskRepository.update).not.toHaveBeenCalled();
    expect(result.task).toBe(recurringTask);
    expect(result.next).toBe(nextTask);
  });

  it('recurring: preserves tags and estimatedMinutes on next occurrence', async () => {
    const recurringTask = {
      ...BASE_TASK, isRecurring: true, recurrence: 'weekly:1',
      tags: '["work"]', estimatedMinutes: 30,
    };
    taskRepository.getById.mockResolvedValue(recurringTask);
    addTask.mockResolvedValue({ ...recurringTask, id: 't2' });
    taskRepository.remove.mockResolvedValue(undefined);

    await completeTask('t1');

    expect(addTask).toHaveBeenCalledWith(expect.objectContaining({
      tags: '["work"]',
      estimatedMinutes: 30,
    }));
  });

  it('already done non-recurring: calls update again (idempotent)', async () => {
    const doneTask = { ...BASE_TASK, status: TaskStatus.DONE };
    taskRepository.getById.mockResolvedValue(doneTask);
    taskRepository.update.mockResolvedValue(doneTask);

    const result = await completeTask('t1');

    expect(taskRepository.update).toHaveBeenCalledWith('t1', { status: TaskStatus.DONE });
    expect(result).toEqual({ task: doneTask });
  });
});

describe('cancelTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when task not found', async () => {
    taskRepository.getById.mockResolvedValue(null);
    await expect(cancelTask('nope')).rejects.toThrow('Task not found');
  });

  it('updates status to CANCELLED', async () => {
    const cancelled = { ...BASE_TASK, status: TaskStatus.CANCELLED };
    taskRepository.getById.mockResolvedValue(BASE_TASK);
    taskRepository.update.mockResolvedValue(cancelled);

    const result = await cancelTask('t1');

    expect(taskRepository.update).toHaveBeenCalledWith('t1', { status: TaskStatus.CANCELLED });
    expect(result).toEqual(cancelled);
  });
});
