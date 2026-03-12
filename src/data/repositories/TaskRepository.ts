import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import TaskModel from '../database/models/TaskModel';
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../domain/models/Task';
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
    tags: m.tags,
    estimatedMinutes: m.estimatedMinutes,
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

export class TaskRepository implements ITaskRepository {
  private get collection() { return getDb().collections.get<TaskModel>('tasks'); }

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

  async getByStatus(status: TaskStatusValue): Promise<Task[]> {
    const records = await this.collection
      .query(Q.where('is_deleted', 0), Q.where('status', status))
      .fetch();
    return records.map(toTask);
  }

  async getOverdue(): Promise<Task[]> {
    const now = Date.now();
    const records = await this.collection
      .query(
        Q.where('is_deleted', 0),
        Q.where('due_date', Q.notEq(null)),
        Q.where('due_date', Q.lt(now)),
        Q.where('status', Q.notEq(TaskStatus.DONE)),
        Q.where('status', Q.notEq(TaskStatus.CANCELLED)),
      )
      .fetch();
    return records.map(toTask);
  }

  async getMissed(): Promise<Task[]> {
    const records = await this.collection
      .query(
        Q.where('is_deleted', 0),
        Q.where('is_missed', 1),
        Q.where('is_dismissed', 0),
      )
      .fetch();
    return records.map(toTask);
  }

  async search(query: string): Promise<Task[]> {
    const q = query.toLowerCase();
    const records = await this.collection.query(Q.where('is_deleted', 0)).fetch();
    return records
      .filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q),
      )
      .map(toTask);
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const record = await getDb().write(async () =>
      this.collection.create(r => {
        r.title = input.title;
        r.description = input.description ?? null;
        r.dueDate = input.dueDate ?? null;
        r.dueTime = input.dueTime ?? null;
        r.priority = input.priority;
        r.status = TaskStatus.PENDING;
        r.personId = input.personId ?? null;
        r.relationType = input.relationType ?? null;
        r.tags = input.tags ?? null;
        r.estimatedMinutes = input.estimatedMinutes ?? null;
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
    return toTask(record);
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const record = await getDb().write(async () => {
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
        if (input.tags !== undefined) m.tags = input.tags ?? null;
        if (input.estimatedMinutes !== undefined) m.estimatedMinutes = input.estimatedMinutes ?? null;
        if (input.isRecurring !== undefined) m.isRecurring = input.isRecurring ? 1 : 0;
        if (input.recurrence !== undefined) m.recurrence = input.recurrence ?? null;
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
    await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDeleted = 1; });
    });
  }
}

export const taskRepository = new TaskRepository();
