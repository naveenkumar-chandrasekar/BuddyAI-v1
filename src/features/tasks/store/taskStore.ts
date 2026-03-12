import { create } from 'zustand';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../../domain/models/Task';
import type { Todo, CreateTodoInput } from '../../../domain/models/Todo';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '../../../domain/models/Reminder';
import { getTasks } from '../../../domain/usecases/tasks/GetTaskUseCase';
import { getTodos } from '../../../domain/usecases/tasks/GetTodoUseCase';
import { getReminders } from '../../../domain/usecases/tasks/GetReminderUseCase';
import { addTask } from '../../../domain/usecases/tasks/AddTaskUseCase';
import { addTodo } from '../../../domain/usecases/tasks/AddTodoUseCase';
import { addReminder } from '../../../domain/usecases/tasks/AddReminderUseCase';
import { updateTask } from '../../../domain/usecases/tasks/UpdateTaskUseCase';
import { toggleTodo } from '../../../domain/usecases/tasks/UpdateTodoUseCase';
import { updateReminder } from '../../../domain/usecases/tasks/UpdateReminderUseCase';
import { deleteTask } from '../../../domain/usecases/tasks/DeleteTaskUseCase';
import { deleteTodo } from '../../../domain/usecases/tasks/DeleteTodoUseCase';
import { deleteReminder } from '../../../domain/usecases/tasks/DeleteReminderUseCase';
import { dismissMissedItem } from '../../../domain/usecases/tasks/DismissMissedItemUseCase';

interface TaskState {
  tasks: Task[];
  todos: Todo[];
  reminders: Reminder[];
  loading: boolean;
  error: string | null;

  loadAll(): Promise<void>;
  addTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  addTodo(input: CreateTodoInput): Promise<Todo>;
  toggleTodo(id: string): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  addReminder(input: CreateReminderInput): Promise<Reminder>;
  updateReminder(id: string, input: UpdateReminderInput): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  dismissItem(type: 'task' | 'todo' | 'reminder', id: string): Promise<void>;
}

export const useTaskStore = create<TaskState>((set, _get) => ({
  tasks: [],
  todos: [],
  reminders: [],
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
