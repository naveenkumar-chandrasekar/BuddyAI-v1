import { toggleTodo } from '../UpdateTaskUseCase';
import { Priority } from '../../../../shared/constants/priority';

jest.mock('../../../../data/repositories/TaskRepository', () => ({
  taskRepository: { update: jest.fn() },
  todoRepository: {
    getById: jest.fn(),
    toggleComplete: jest.fn(),
    remove: jest.fn(),
  },
  reminderRepository: { update: jest.fn() },
}));

jest.mock('../AddTaskUseCase', () => ({
  addTodo: jest.fn(),
}));

const { todoRepository } = jest.requireMock('../../../../data/repositories/TaskRepository');
const { addTodo } = jest.requireMock('../AddTaskUseCase');

const BASE_TODO = {
  id: 'td1', title: 'Read book', isCompleted: false, priority: Priority.LOW,
  personId: null, relationType: null, dueDate: null, isRecurring: false, recurrence: null,
  isMissed: false, missedAt: null, nextRemindAt: null, remindCount: 0,
  isDismissed: false, createdAt: 1000, updatedAt: 1000, completedAt: null,
};

describe('toggleTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when todo not found', async () => {
    todoRepository.getById.mockResolvedValue(null);
    await expect(toggleTodo('nope')).rejects.toThrow('Todo not found');
  });

  it('non-recurring: calls toggleComplete, returns { todo }', async () => {
    const toggled = { ...BASE_TODO, isCompleted: true };
    todoRepository.getById.mockResolvedValue(BASE_TODO);
    todoRepository.toggleComplete.mockResolvedValue(toggled);

    const result = await toggleTodo('td1');

    expect(todoRepository.toggleComplete).toHaveBeenCalledWith('td1');
    expect(addTodo).not.toHaveBeenCalled();
    expect(todoRepository.remove).not.toHaveBeenCalled();
    expect(result).toEqual({ todo: toggled });
  });

  it('non-recurring already completed: uncompletes normally', async () => {
    const completed = { ...BASE_TODO, isCompleted: true };
    const uncompleted = { ...BASE_TODO, isCompleted: false };
    todoRepository.getById.mockResolvedValue(completed);
    todoRepository.toggleComplete.mockResolvedValue(uncompleted);

    const result = await toggleTodo('td1');

    expect(todoRepository.toggleComplete).toHaveBeenCalledWith('td1');
    expect(result).toEqual({ todo: uncompleted });
  });

  it('recurring incomplete: creates next occurrence, removes current, returns { todo, next }', async () => {
    const recurringTodo = {
      ...BASE_TODO, isRecurring: true, recurrence: 'weekly:0',
      dueDate: Date.now() - 86400000,
    };
    const nextTodo = { ...BASE_TODO, id: 'td2', isRecurring: true, recurrence: 'weekly:0' };
    todoRepository.getById.mockResolvedValue(recurringTodo);
    addTodo.mockResolvedValue(nextTodo);
    todoRepository.remove.mockResolvedValue(undefined);

    const result = await toggleTodo('td1');

    expect(addTodo).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Read book',
      priority: Priority.LOW,
      isRecurring: true,
      recurrence: 'weekly:0',
      dueDate: expect.any(Number),
    }));
    expect(todoRepository.remove).toHaveBeenCalledWith('td1');
    expect(todoRepository.toggleComplete).not.toHaveBeenCalled();
    expect(result.todo).toBe(recurringTodo);
    expect(result.next).toBe(nextTodo);
  });

  it('recurring monthly:5: next due date is in the next month', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 4, 12, 0, 0)); // March 4 2026

    const recurringTodo = {
      ...BASE_TODO, isRecurring: true, recurrence: 'monthly:5',
      dueDate: new Date(2026, 2, 4).getTime(),
    };
    todoRepository.getById.mockResolvedValue(recurringTodo);
    addTodo.mockImplementation(async (input: { dueDate?: number }) => ({
      ...BASE_TODO, id: 'td-next', isRecurring: true, recurrence: 'monthly:5',
      dueDate: input.dueDate,
    }));
    todoRepository.remove.mockResolvedValue(undefined);

    const result = await toggleTodo('td1');

    const nextDue = new Date(result.next!.dueDate!);
    expect(nextDue.getMonth()).toBe(3);  // April
    expect(nextDue.getDate()).toBe(5);

    jest.useRealTimers();
  });

  it('recurring already completed: toggles normally (uncomplete path)', async () => {
    const completedRecurring = {
      ...BASE_TODO, isCompleted: true, isRecurring: true, recurrence: 'weekly:1',
    };
    const uncompleted = { ...completedRecurring, isCompleted: false };
    todoRepository.getById.mockResolvedValue(completedRecurring);
    todoRepository.toggleComplete.mockResolvedValue(uncompleted);

    const result = await toggleTodo('td1');

    expect(todoRepository.toggleComplete).toHaveBeenCalledWith('td1');
    expect(addTodo).not.toHaveBeenCalled();
    expect(result).toEqual({ todo: uncompleted });
  });

  it('recurring: next todo preserves personId and relationType', async () => {
    const recurringTodo = {
      ...BASE_TODO, isRecurring: true, recurrence: 'weekly:3',
      personId: 'p42', relationType: 'friend',
    };
    todoRepository.getById.mockResolvedValue(recurringTodo);
    addTodo.mockResolvedValue({ ...recurringTodo, id: 'td-next' });
    todoRepository.remove.mockResolvedValue(undefined);

    await toggleTodo('td1');

    expect(addTodo).toHaveBeenCalledWith(expect.objectContaining({
      personId: 'p42',
      relationType: 'friend',
    }));
  });
});
