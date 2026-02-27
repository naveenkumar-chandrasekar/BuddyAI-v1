import { Q } from '@nozbe/watermelondb';
import { db } from '../database/database';
import TaskModel from '../database/models/TaskModel';
import TodoModel from '../database/models/TodoModel';
import ReminderModel from '../database/models/ReminderModel';
import type { ITaskRepository, ITodoRepository, IReminderRepository } from '../../domain/repositories/ITaskRepository';
import type {
  Task, CreateTaskInput, UpdateTaskInput,
  Todo, CreateTodoInput, UpdateTodoInput,
  Reminder, CreateReminderInput, UpdateReminderInput,
} from '../../domain/models/Task';
import type { PriorityValue } from '../../shared/constants/priority';
import type { TaskStatusValue } from '../../shared/constants/taskStatus';
import { TaskStatus } from '../../shared/constants/taskStatus';

function toTask(m: TaskModel): Task {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    dueDate: m.dueDate,
    dueTime: m.dueTime,
    priority: m.priority as PriorityValue,
    status: m.status as TaskStatusValue,
    personId: m.personId,
    relationType: m.relationType,
    isMissed: m.isMissed === 1,
    missedAt: m.missedAt,
    nextRemindAt: m.nextRemindAt,
    remindCount: m.remindCount,
    isDismissed: m.isDismissed === 1,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
    completedAt: m.completedAt,
  };
}

function toTodo(m: TodoModel): Todo {
  return {
    id: m.id,
    title: m.title,
    isCompleted: m.isCompleted === 1,
    priority: m.priority as PriorityValue,
    personId: m.personId,
    relationType: m.relationType,
    dueDate: m.dueDate,
    isMissed: m.isMissed === 1,
    missedAt: m.missedAt,
    nextRemindAt: m.nextRemindAt,
    remindCount: m.remindCount,
    isDismissed: m.isDismissed === 1,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
    completedAt: m.completedAt,
  };
}

function toReminder(m: ReminderModel): Reminder {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    remindAt: m.remindAt,
    isRecurring: m.isRecurring === 1,
    recurrence: m.recurrence,
    isDone: m.isDone === 1,
    personId: m.personId,
    relationType: m.relationType,
    priority: m.priority as PriorityValue,
    isMissed: m.isMissed === 1,
    missedAt: m.missedAt,
    nextRemindAt: m.nextRemindAt,
    remindCount: m.remindCount,
    isDismissed: m.isDismissed === 1,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export class TaskRepository implements ITaskRepository {
  private collection = db.collections.get<TaskModel>('tasks');

  async getAll(): Promise<Task[]> {
    const records = await this.collection.query(Q.where('is_deleted', 0)).fetch();
    return records.map(toTask);
  }

  async getById(id: string): Promise<Task | null> {
    try {
      const r = await this.collection.find(id);
      return r.isDeleted ? null : toTask(r);
    } catch { return null; }
  }

  async getByPersonId(personId: string): Promise<Task[]> {
    const records = await this.collection
      .query(Q.where('is_deleted', 0), Q.where('person_id', personId))
      .fetch();
    return records.map(toTask);
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const record = await db.write(async () =>
      this.collection.create(r => {
        r.title = input.title;
        r.description = input.description ?? null;
        r.dueDate = input.dueDate ?? null;
        r.dueTime = input.dueTime ?? null;
        r.priority = input.priority;
        r.status = TaskStatus.PENDING;
        r.personId = input.personId ?? null;
        r.relationType = input.relationType ?? null;
        r.isMissed = 0;
        r.missedAt = null;
        r.nextRemindAt = null;
        r.remindCount = 0;
        r.isDismissed = 0;
        r.isDeleted = 0;
      }),
    );
    return toTask(record);
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const record = await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        if (input.title !== undefined) m.title = input.title;
        if (input.description !== undefined) m.description = input.description ?? null;
        if (input.dueDate !== undefined) m.dueDate = input.dueDate ?? null;
        if (input.dueTime !== undefined) m.dueTime = input.dueTime ?? null;
        if (input.priority !== undefined) m.priority = input.priority;
        if (input.status !== undefined) m.status = input.status;
        if (input.personId !== undefined) m.personId = input.personId ?? null;
        if (input.relationType !== undefined) m.relationType = input.relationType ?? null;
        if (input.isMissed !== undefined) m.isMissed = input.isMissed ? 1 : 0;
        if (input.missedAt !== undefined) m.missedAt = input.missedAt ?? null;
        if (input.nextRemindAt !== undefined) m.nextRemindAt = input.nextRemindAt ?? null;
        if (input.remindCount !== undefined) m.remindCount = input.remindCount;
        if (input.isDismissed !== undefined) m.isDismissed = input.isDismissed ? 1 : 0;
        if (input.status === TaskStatus.DONE) m.completedAt = Date.now();
      });
      return r;
    });
    return toTask(record);
  }

  async remove(id: string): Promise<void> {
    await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDeleted = 1; });
    });
  }
}

export class TodoRepository implements ITodoRepository {
  private collection = db.collections.get<TodoModel>('todos');

  async getAll(): Promise<Todo[]> {
    const records = await this.collection.query(Q.where('is_deleted', 0)).fetch();
    return records.map(toTodo);
  }

  async getById(id: string): Promise<Todo | null> {
    try {
      const r = await this.collection.find(id);
      return r.isDeleted ? null : toTodo(r);
    } catch { return null; }
  }

  async getByPersonId(personId: string): Promise<Todo[]> {
    const records = await this.collection
      .query(Q.where('is_deleted', 0), Q.where('person_id', personId))
      .fetch();
    return records.map(toTodo);
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const record = await db.write(async () =>
      this.collection.create(r => {
        r.title = input.title;
        r.isCompleted = 0;
        r.priority = input.priority;
        r.personId = input.personId ?? null;
        r.relationType = input.relationType ?? null;
        r.dueDate = input.dueDate ?? null;
        r.isMissed = 0;
        r.missedAt = null;
        r.nextRemindAt = null;
        r.remindCount = 0;
        r.isDismissed = 0;
        r.isDeleted = 0;
      }),
    );
    return toTodo(record);
  }

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    const record = await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        if (input.title !== undefined) m.title = input.title;
        if (input.priority !== undefined) m.priority = input.priority;
        if (input.personId !== undefined) m.personId = input.personId ?? null;
        if (input.relationType !== undefined) m.relationType = input.relationType ?? null;
        if (input.dueDate !== undefined) m.dueDate = input.dueDate ?? null;
        if (input.isMissed !== undefined) m.isMissed = input.isMissed ? 1 : 0;
        if (input.missedAt !== undefined) m.missedAt = input.missedAt ?? null;
        if (input.nextRemindAt !== undefined) m.nextRemindAt = input.nextRemindAt ?? null;
        if (input.remindCount !== undefined) m.remindCount = input.remindCount;
        if (input.isDismissed !== undefined) m.isDismissed = input.isDismissed ? 1 : 0;
      });
      return r;
    });
    return toTodo(record);
  }

  async toggleComplete(id: string): Promise<Todo> {
    const record = await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        m.isCompleted = m.isCompleted === 1 ? 0 : 1;
        m.completedAt = m.isCompleted === 1 ? Date.now() : null;
      });
      return r;
    });
    return toTodo(record);
  }

  async remove(id: string): Promise<void> {
    await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDeleted = 1; });
    });
  }
}

export class ReminderRepository implements IReminderRepository {
  private collection = db.collections.get<ReminderModel>('reminders');

  async getAll(): Promise<Reminder[]> {
    const records = await this.collection.query(Q.where('is_deleted', 0)).fetch();
    return records.map(toReminder);
  }

  async getById(id: string): Promise<Reminder | null> {
    try {
      const r = await this.collection.find(id);
      return r.isDeleted ? null : toReminder(r);
    } catch { return null; }
  }

  async getByPersonId(personId: string): Promise<Reminder[]> {
    const records = await this.collection
      .query(Q.where('is_deleted', 0), Q.where('person_id', personId))
      .fetch();
    return records.map(toReminder);
  }

  async getUpcoming(): Promise<Reminder[]> {
    const now = Date.now();
    const records = await this.collection
      .query(Q.where('is_deleted', 0), Q.where('is_done', 0), Q.where('remind_at', Q.gte(now)))
      .fetch();
    return records.map(toReminder);
  }

  async create(input: CreateReminderInput): Promise<Reminder> {
    const record = await db.write(async () =>
      this.collection.create(r => {
        r.title = input.title;
        r.description = input.description ?? null;
        r.remindAt = input.remindAt;
        r.isRecurring = input.isRecurring ? 1 : 0;
        r.recurrence = input.recurrence ?? null;
        r.isDone = 0;
        r.personId = input.personId ?? null;
        r.relationType = input.relationType ?? null;
        r.priority = input.priority;
        r.isMissed = 0;
        r.missedAt = null;
        r.nextRemindAt = null;
        r.remindCount = 0;
        r.isDismissed = 0;
        r.isDeleted = 0;
      }),
    );
    return toReminder(record);
  }

  async update(id: string, input: UpdateReminderInput): Promise<Reminder> {
    const record = await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        if (input.title !== undefined) m.title = input.title;
        if (input.description !== undefined) m.description = input.description ?? null;
        if (input.remindAt !== undefined) m.remindAt = input.remindAt;
        if (input.isRecurring !== undefined) m.isRecurring = input.isRecurring ? 1 : 0;
        if (input.recurrence !== undefined) m.recurrence = input.recurrence ?? null;
        if (input.isDone !== undefined) m.isDone = input.isDone ? 1 : 0;
        if (input.personId !== undefined) m.personId = input.personId ?? null;
        if (input.relationType !== undefined) m.relationType = input.relationType ?? null;
        if (input.priority !== undefined) m.priority = input.priority;
        if (input.isMissed !== undefined) m.isMissed = input.isMissed ? 1 : 0;
        if (input.missedAt !== undefined) m.missedAt = input.missedAt ?? null;
        if (input.nextRemindAt !== undefined) m.nextRemindAt = input.nextRemindAt ?? null;
        if (input.remindCount !== undefined) m.remindCount = input.remindCount;
        if (input.isDismissed !== undefined) m.isDismissed = input.isDismissed ? 1 : 0;
      });
      return r;
    });
    return toReminder(record);
  }

  async remove(id: string): Promise<void> {
    await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDeleted = 1; });
    });
  }
}

export const taskRepository = new TaskRepository();
export const todoRepository = new TodoRepository();
export const reminderRepository = new ReminderRepository();
