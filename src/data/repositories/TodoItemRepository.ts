import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import TodoItemModel from '../database/models/TodoItemModel';
import type { ITodoItemRepository } from '../../domain/repositories/ITodoItemRepository';
import type { TodoItem, CreateTodoItemInput, UpdateTodoItemInput } from '../../domain/models/TodoItem';

function toTodoItem(m: TodoItemModel): TodoItem {
  return {
    id: m.id,
    todoId: m.todoId,
    title: m.title,
    isCompleted: m.isCompleted === 1,
    position: m.position,
    personId: m.personId,
    relationType: m.relationType,
    completedAt: m.completedAt,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export class TodoItemRepository implements ITodoItemRepository {
  private get collection() { return getDb().collections.get<TodoItemModel>('todo_items'); }

  async getByTodoId(todoId: string): Promise<TodoItem[]> {
    const records = await this.collection
      .query(Q.where('is_deleted', 0), Q.where('todo_id', todoId), Q.sortBy('position', Q.asc))
      .fetch();
    return records.map(toTodoItem);
  }

  async getById(id: string): Promise<TodoItem | null> {
    try {
      const r = await this.collection.find(id);
      return r.isDeleted ? null : toTodoItem(r);
    } catch { return null; }
  }

  async create(input: CreateTodoItemInput): Promise<TodoItem> {
    const existing = await this.getByTodoId(input.todoId);
    const position = input.position ?? existing.length;
    const record = await getDb().write(async () =>
      this.collection.create(r => {
        r.todoId = input.todoId;
        r.title = input.title;
        r.isCompleted = 0;
        r.position = position;
        r.personId = input.personId ?? null;
        r.relationType = input.relationType ?? null;
        r.completedAt = null;
        r.isDeleted = 0;
      }),
    );
    return toTodoItem(record);
  }

  async update(id: string, input: UpdateTodoItemInput): Promise<TodoItem> {
    const record = await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        if (input.title !== undefined) m.title = input.title;
        if (input.position !== undefined) m.position = input.position;
        if (input.personId !== undefined) m.personId = input.personId ?? null;
        if (input.relationType !== undefined) m.relationType = input.relationType ?? null;
      });
      return r;
    });
    return toTodoItem(record);
  }

  async toggleComplete(id: string): Promise<TodoItem> {
    const record = await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        m.isCompleted = m.isCompleted === 1 ? 0 : 1;
        m.completedAt = m.isCompleted === 1 ? Date.now() : null;
      });
      return r;
    });
    return toTodoItem(record);
  }

  async remove(id: string): Promise<void> {
    await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDeleted = 1; });
    });
  }

  async removeByTodoId(todoId: string): Promise<void> {
    await getDb().write(async () => {
      const records = await this.collection
        .query(Q.where('is_deleted', 0), Q.where('todo_id', todoId))
        .fetch();
      await Promise.all(records.map(r => r.update(m => { m.isDeleted = 1; })));
    });
  }
}

export const todoItemRepository = new TodoItemRepository();
