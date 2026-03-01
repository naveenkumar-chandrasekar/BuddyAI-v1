import { getTasks, getTodos, getReminders } from '../GetTasksUseCase';
import { addTask, addTodo, addReminder } from '../AddTaskUseCase';
import { deleteTask, deleteTodo, deleteReminder } from '../DeleteTaskUseCase';
import { Priority } from '../../../../shared/constants/priority';
import { TaskStatus } from '../../../../shared/constants/taskStatus';

jest.mock('../../../../data/repositories/TaskRepository', () => ({
  taskRepository: { getAll: jest.fn(), getByPersonId: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
  todoRepository: { getAll: jest.fn(), getByPersonId: jest.fn(), create: jest.fn(), toggleComplete: jest.fn(), remove: jest.fn() },
  reminderRepository: { getAll: jest.fn(), getByPersonId: jest.fn(), getUpcoming: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

const { taskRepository, todoRepository, reminderRepository } =
  jest.requireMock('../../../../data/repositories/TaskRepository');

const MOCK_TASK = {
  id: 't1', title: 'Buy milk', description: null, dueDate: null, dueTime: null,
  priority: Priority.MEDIUM, status: TaskStatus.PENDING, personId: null,
  relationType: null, isMissed: false, remindCount: 0, isDismissed: false,
  createdAt: 1000, updatedAt: 1000, completedAt: null,
};

const MOCK_TODO = {
  id: 'td1', title: 'Read book', isCompleted: false, priority: Priority.LOW,
  personId: null, relationType: null, dueDate: null, isRecurring: false, recurrence: null,
  isMissed: false, missedAt: null, nextRemindAt: null, remindCount: 0,
  isDismissed: false, createdAt: 1000, updatedAt: 1000, completedAt: null,
};

const MOCK_REMINDER = {
  id: 'r1', title: 'Call dentist', description: null, remindAt: 9999999999,
  isRecurring: false, recurrence: null, isDone: false, personId: null,
  relationType: null, priority: Priority.HIGH, isMissed: false,
  remindCount: 0, isDismissed: false, createdAt: 1000, updatedAt: 1000,
};

describe('GetTasksUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches tasks', async () => {
    taskRepository.getAll.mockResolvedValue([MOCK_TASK]);
    expect(await getTasks()).toEqual([MOCK_TASK]);
  });

  it('fetches todos', async () => {
    todoRepository.getAll.mockResolvedValue([MOCK_TODO]);
    expect(await getTodos()).toEqual([MOCK_TODO]);
  });

  it('fetches reminders', async () => {
    reminderRepository.getAll.mockResolvedValue([MOCK_REMINDER]);
    expect(await getReminders()).toEqual([MOCK_REMINDER]);
  });
});

describe('AddTaskUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a task', async () => {
    taskRepository.create.mockResolvedValue(MOCK_TASK);
    const result = await addTask({ title: 'Buy milk', priority: Priority.MEDIUM });
    expect(result).toEqual(MOCK_TASK);
  });

  it('throws on empty task title', async () => {
    await expect(addTask({ title: '', priority: Priority.MEDIUM })).rejects.toThrow('Title is required');
    expect(taskRepository.create).not.toHaveBeenCalled();
  });

  it('creates a todo', async () => {
    todoRepository.create.mockResolvedValue(MOCK_TODO);
    const result = await addTodo({ title: 'Read book', priority: Priority.LOW });
    expect(result).toEqual(MOCK_TODO);
  });

  it('throws on empty todo title', async () => {
    await expect(addTodo({ title: '  ', priority: Priority.LOW })).rejects.toThrow('Title is required');
  });

  it('creates a reminder', async () => {
    reminderRepository.create.mockResolvedValue(MOCK_REMINDER);
    const result = await addReminder({ title: 'Call dentist', remindAt: 9999999999, priority: Priority.HIGH });
    expect(result).toEqual(MOCK_REMINDER);
  });

  it('throws on empty reminder title', async () => {
    await expect(addReminder({ title: '', remindAt: 9999999999, priority: Priority.HIGH })).rejects.toThrow('Title is required');
  });

  it('throws when remindAt is 0', async () => {
    await expect(addReminder({ title: 'Test', remindAt: 0, priority: Priority.HIGH })).rejects.toThrow('Remind time is required');
  });

  it('creates a recurring todo with recurrence fields', async () => {
    const recurringTodo = { ...MOCK_TODO, isRecurring: true, recurrence: 'weekly:0', dueDate: Date.now() + 86400000 };
    todoRepository.create.mockResolvedValue(recurringTodo);
    const result = await addTodo({ title: 'Read book', priority: Priority.LOW, isRecurring: true, recurrence: 'weekly:0', dueDate: Date.now() + 86400000 });
    expect(todoRepository.create).toHaveBeenCalledWith(expect.objectContaining({ isRecurring: true, recurrence: 'weekly:0' }));
    expect(result.isRecurring).toBe(true);
    expect(result.recurrence).toBe('weekly:0');
  });

  it('creates a non-recurring todo without recurrence', async () => {
    todoRepository.create.mockResolvedValue(MOCK_TODO);
    await addTodo({ title: 'Read book', priority: Priority.LOW });
    expect(todoRepository.create).toHaveBeenCalledWith(expect.not.objectContaining({ isRecurring: true }));
  });
});

describe('DeleteTaskUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes a task', async () => {
    taskRepository.remove.mockResolvedValue(undefined);
    await deleteTask('t1');
    expect(taskRepository.remove).toHaveBeenCalledWith('t1');
  });

  it('removes a todo', async () => {
    todoRepository.remove.mockResolvedValue(undefined);
    await deleteTodo('td1');
    expect(todoRepository.remove).toHaveBeenCalledWith('td1');
  });

  it('removes a reminder', async () => {
    reminderRepository.remove.mockResolvedValue(undefined);
    await deleteReminder('r1');
    expect(reminderRepository.remove).toHaveBeenCalledWith('r1');
  });
});
