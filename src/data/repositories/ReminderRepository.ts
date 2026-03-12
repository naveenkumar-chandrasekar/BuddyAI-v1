import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import ReminderModel from '../database/models/ReminderModel';
import type { IReminderRepository } from '../../domain/repositories/IReminderRepository';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '../../domain/models/Reminder';
import type { PriorityValue } from '../../shared/constants/priority';

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

export class ReminderRepository implements IReminderRepository {
  private get collection() { return getDb().collections.get<ReminderModel>('reminders'); }

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
    const record = await getDb().write(async () =>
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
    const record = await getDb().write(async () => {
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
    await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDeleted = 1; });
    });
  }
}

export const reminderRepository = new ReminderRepository();
