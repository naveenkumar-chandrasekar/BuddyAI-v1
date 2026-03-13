import { create } from 'zustand';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../../domain/models/Task';
import type { Todo, CreateTodoInput } from '../../../domain/models/Todo';
import type { TodoItem, CreateTodoItemInput, UpdateTodoItemInput } from '../../../domain/models/TodoItem';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '../../../domain/models/Reminder';
import { getTasks } from '../../../domain/usecases/tasks/GetTaskUseCase';
import { getTodos } from '../../../domain/usecases/tasks/GetTodoUseCase';
import { getReminders } from '../../../domain/usecases/tasks/GetReminderUseCase';
import { addTask } from '../../../domain/usecases/tasks/AddTaskUseCase';
import { addTodo } from '../../../domain/usecases/tasks/AddTodoUseCase';
import { addReminder } from '../../../domain/usecases/tasks/AddReminderUseCase';
import { updateTask } from '../../../domain/usecases/tasks/UpdateTaskUseCase';
import { completeTask } from '../../../domain/usecases/tasks/CompleteTaskUseCase';
import { cancelTask } from '../../../domain/usecases/tasks/CancelTaskUseCase';
import { toggleTodo } from '../../../domain/usecases/tasks/UpdateTodoUseCase';
import { updateReminder } from '../../../domain/usecases/tasks/UpdateReminderUseCase';
import { deleteTask } from '../../../domain/usecases/tasks/DeleteTaskUseCase';
import { deleteTodo } from '../../../domain/usecases/tasks/DeleteTodoUseCase';
import { deleteReminder } from '../../../domain/usecases/tasks/DeleteReminderUseCase';
import { doneReminder } from '../../../domain/usecases/tasks/DoneReminderUseCase';
import { snoozeReminder } from '../../../domain/usecases/tasks/SnoozeReminderUseCase';
import { dismissMissedItem } from '../../../domain/usecases/tasks/DismissMissedItemUseCase';
import { getTodoItems } from '../../../domain/usecases/tasks/GetTodoItemsUseCase';
import { addTodoItem } from '../../../domain/usecases/tasks/AddTodoItemUseCase';
import { updateTodoItem, toggleTodoItem } from '../../../domain/usecases/tasks/UpdateTodoItemUseCase';
import { deleteTodoItem } from '../../../domain/usecases/tasks/DeleteTodoItemUseCase';

interface TaskState {
  tasks: Task[];
  todos: Todo[];
  reminders: Reminder[];
  todoItems: Record<string, TodoItem[]>;
  loading: boolean;
  error: string | null;

  loadAll(): Promise<void>;
  addTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;
  completeTask(id: string): Promise<void>;
  cancelTask(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
  addTodo(input: CreateTodoInput): Promise<Todo>;
  toggleTodo(id: string): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  loadTodoItems(todoId: string): Promise<void>;
  addTodoItem(input: CreateTodoItemInput): Promise<TodoItem>;
  updateTodoItem(id: string, input: UpdateTodoItemInput): Promise<TodoItem>;
  toggleTodoItem(id: string): Promise<void>;
  deleteTodoItem(id: string, todoId: string): Promise<void>;
  addReminder(input: CreateReminderInput): Promise<Reminder>;
  updateReminder(id: string, input: UpdateReminderInput): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  doneReminder(id: string): Promise<void>;
  snoozeReminder(id: string, snoozeMs: number): Promise<void>;
  dismissItem(type: 'task' | 'todo' | 'reminder', id: string): Promise<void>;
}

export const useTaskStore = create<TaskState>((set, _get) => ({
  tasks: [],
  todos: [],
  reminders: [],
  todoItems: {},
  loading: false,
  error: null,

  async loadAll() {
    set({ loading: true, error: null });
    try {
      const [tasks, todos, reminders] = await Promise.all([
        getTasks(),
        getTodos(),
        getReminders(),
      ]);
      set({ tasks, todos, reminders, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  async addTask(input) {
    const task = await addTask(input);
    set(s => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  async updateTask(id, input) {
    const updated = await updateTask(id, input);
    set(s => ({ tasks: s.tasks.map(t => (t.id === id ? updated : t)) }));
    return updated;
  },

  async completeTask(id) {
    const { task, next } = await completeTask(id);
    set(s => {
      if (next) {
        return { tasks: [next, ...s.tasks.filter(t => t.id !== id)] };
      }
      return { tasks: s.tasks.map(t => (t.id === id ? task : t)) };
    });
  },

  async cancelTask(id) {
    const cancelled = await cancelTask(id);
    set(s => ({ tasks: s.tasks.map(t => (t.id === id ? cancelled : t)) }));
  },

  async deleteTask(id) {
    await deleteTask(id);
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
  },

  async addTodo(input) {
    const todo = await addTodo(input);
    set(s => ({ todos: [todo, ...s.todos] }));
    return todo;
  },

  async toggleTodo(id) {
    const { todo, next } = await toggleTodo(id);
    set(s => {
      if (next) {
        return { todos: [next, ...s.todos.filter(t => t.id !== id)] };
      }
      return { todos: s.todos.map(t => (t.id === id ? todo : t)) };
    });
  },

  async deleteTodo(id) {
    await deleteTodo(id);
    set(s => ({ todos: s.todos.filter(t => t.id !== id) }));
  },

  async loadTodoItems(todoId) {
    const items = await getTodoItems(todoId);
    set(s => ({ todoItems: { ...s.todoItems, [todoId]: items } }));
  },

  async addTodoItem(input) {
    const item = await addTodoItem(input);
    set(s => ({
      todoItems: {
        ...s.todoItems,
        [input.todoId]: [...(s.todoItems[input.todoId] ?? []), item],
      },
    }));
    return item;
  },

  async updateTodoItem(id, input) {
    const updated = await updateTodoItem(id, input);
    set(s => {
      const todoId = Object.keys(s.todoItems).find(tid =>
        s.todoItems[tid].some(i => i.id === id),
      );
      if (!todoId) return s;
      return {
        todoItems: {
          ...s.todoItems,
          [todoId]: s.todoItems[todoId].map(i => (i.id === id ? updated : i)),
        },
      };
    });
    return updated;
  },

  async toggleTodoItem(id) {
    const toggled = await toggleTodoItem(id);
    set(s => {
      const todoId = Object.keys(s.todoItems).find(tid =>
        s.todoItems[tid].some(i => i.id === id),
      );
      if (!todoId) return s;
      return {
        todoItems: {
          ...s.todoItems,
          [todoId]: s.todoItems[todoId].map(i => (i.id === id ? toggled : i)),
        },
      };
    });
  },

  async deleteTodoItem(id, todoId) {
    await deleteTodoItem(id);
    set(s => ({
      todoItems: {
        ...s.todoItems,
        [todoId]: (s.todoItems[todoId] ?? []).filter(i => i.id !== id),
      },
    }));
  },

  async addReminder(input) {
    const reminder = await addReminder(input);
    set(s => ({ reminders: [reminder, ...s.reminders] }));
    return reminder;
  },

  async updateReminder(id, input) {
    const updated = await updateReminder(id, input);
    set(s => ({ reminders: s.reminders.map(r => (r.id === id ? updated : r)) }));
    return updated;
  },

  async deleteReminder(id) {
    await deleteReminder(id);
    set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
  },

  async doneReminder(id) {
    const { reminder, next } = await doneReminder(id);
    set(s => {
      if (next) {
        return { reminders: [next, ...s.reminders.filter(r => r.id !== id)] };
      }
      return { reminders: s.reminders.map(r => (r.id === id ? reminder : r)) };
    });
  },

  async snoozeReminder(id, snoozeMs) {
    const updated = await snoozeReminder(id, snoozeMs);
    set(s => ({ reminders: s.reminders.map(r => (r.id === id ? updated : r)) }));
  },

  async dismissItem(type, id) {
    await dismissMissedItem(type, id);
    if (type === 'task') {
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, isDismissed: true } : t) }));
    } else if (type === 'todo') {
      set(s => ({ todos: s.todos.map(t => t.id === id ? { ...t, isDismissed: true } : t) }));
    } else {
      set(s => ({ reminders: s.reminders.map(r => r.id === id ? { ...r, isDismissed: true } : r) }));
    }
  },
}));
