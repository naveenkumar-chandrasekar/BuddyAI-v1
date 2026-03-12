import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import TodoModel from '../database/models/TodoModel';
import type { ITodoRepository } from '../../domain/repositories/ITodoRepository';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../domain/models/Todo';
import type { PriorityValue } from '../../shared/constants/priority';

function toTodo(m: TodoModel): Todo {
  return {
    id: m.id,
    title: m.title,
    isCompleted: m.isCompleted === 1,
    priority: m.priority as PriorityValue,
    personId: m.personId,
    relationType: m.relationType,
    dueDate: m.dueDate,
    isRecurring: m.isRecurring === 1,
    recurrence: m.recurrence,
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

export class TodoRepository implements ITodoRepository {
  private get collection() { return getDb().collections.get<TodoModel>('todos'); }

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
    const record = await getDb().write(async () =>
      this.collection.create(r => {
        r.title = input.title;
        r.isCompleted = 0;
        r.priority = input.priority;
        r.personId = input.personId ?? null;
        r.relationType = input.relationType ?? null;
        r.dueDate = input.dueDate ?? null;
        r.isRecurring = input.isRecurring ? 1 : 0;
        r.recurrence = input.recurrence ?? null;
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
    const record = await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        if (input.title !== undefined) m.title = input.title;
        if (input.priority !== undefined) m.priority = input.priority;
        if (input.personId !== undefined) m.personId = input.personId ?? null;
        if (input.relationType !== undefined) m.relationType = input.relationType ?? null;
        if (input.dueDate !== undefined) m.dueDate = input.dueDate ?? null;
        if (input.isRecurring !== undefined) m.isRecurring = input.isRecurring ? 1 : 0;
        if (input.recurrence !== undefined) m.recurrence = input.recurrence ?? null;
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
    const record = await getDb().write(async () => {
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
    await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDeleted = 1; });
    });
  }
}

export const todoRepository = new TodoRepository();
