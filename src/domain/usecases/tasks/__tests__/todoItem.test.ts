import { addTodoItem } from '../AddTodoItemUseCase';
import { updateTodoItem, toggleTodoItem } from '../UpdateTodoItemUseCase';
import { deleteTodoItem, deleteTodoItems } from '../DeleteTodoItemUseCase';
import { getTodoItems } from '../GetTodoItemsUseCase';

jest.mock('../../../../data/repositories/TodoItemRepository', () => ({
  todoItemRepository: {
    create: jest.fn(),
    update: jest.fn(),
    toggleComplete: jest.fn(),
    remove: jest.fn(),
    removeByTodoId: jest.fn(),
    getByTodoId: jest.fn(),
    getById: jest.fn(),
  },
}));

const { todoItemRepository } = jest.requireMock('../../../../data/repositories/TodoItemRepository');

const BASE_ITEM = {
  id: 'i1', todoId: 'td1', title: 'Buy milk', personId: null, relationType: null,
  isCompleted: false, position: 0, completedAt: null,
  createdAt: 1000, updatedAt: 1000,
};

describe('addTodoItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates item', async () => {
    todoItemRepository.create.mockResolvedValue(BASE_ITEM);
    const result = await addTodoItem({ todoId: 'td1', title: 'Buy milk' });
    expect(todoItemRepository.create).toHaveBeenCalledWith({ todoId: 'td1', title: 'Buy milk' });
    expect(result).toEqual(BASE_ITEM);
  });

  it('throws on empty title', async () => {
    await expect(addTodoItem({ todoId: 'td1', title: '  ' })).rejects.toThrow('Title is required');
    expect(todoItemRepository.create).not.toHaveBeenCalled();
  });
});

describe('updateTodoItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates item', async () => {
    const updated = { ...BASE_ITEM, title: 'Buy eggs' };
    todoItemRepository.update.mockResolvedValue(updated);
    const result = await updateTodoItem('i1', { title: 'Buy eggs' });
    expect(todoItemRepository.update).toHaveBeenCalledWith('i1', { title: 'Buy eggs' });
    expect(result.title).toBe('Buy eggs');
  });
});

describe('toggleTodoItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('toggles completion', async () => {
    const toggled = { ...BASE_ITEM, isCompleted: true, completedAt: Date.now() };
    todoItemRepository.toggleComplete.mockResolvedValue(toggled);
    const result = await toggleTodoItem('i1');
    expect(todoItemRepository.toggleComplete).toHaveBeenCalledWith('i1');
    expect(result.isCompleted).toBe(true);
  });
});

describe('deleteTodoItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes single item', async () => {
    todoItemRepository.remove.mockResolvedValue(undefined);
    await deleteTodoItem('i1');
    expect(todoItemRepository.remove).toHaveBeenCalledWith('i1');
  });

  it('removes all items for a todo', async () => {
    todoItemRepository.removeByTodoId.mockResolvedValue(undefined);
    await deleteTodoItems('td1');
    expect(todoItemRepository.removeByTodoId).toHaveBeenCalledWith('td1');
  });
});

describe('getTodoItems', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns items for todo', async () => {
    todoItemRepository.getByTodoId.mockResolvedValue([BASE_ITEM]);
    const result = await getTodoItems('td1');
    expect(todoItemRepository.getByTodoId).toHaveBeenCalledWith('td1');
    expect(result).toEqual([BASE_ITEM]);
  });
});
