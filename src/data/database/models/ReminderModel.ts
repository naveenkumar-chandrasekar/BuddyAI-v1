import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ReminderModel extends Model {
  static table = 'reminders';

  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('remind_at') remindAt!: number;
  @field('is_recurring') isRecurring!: number;
  @field('recurrence') recurrence!: string | null;
  @field('is_done') isDone!: number;
  @field('person_id') personId!: string | null;
  @field('relation_type') relationType!: string | null;
  @field('priority') priority!: number;
  @field('is_missed') isMissed!: number;
  @field('missed_at') missedAt!: number | null;
  @field('next_remind_at') nextRemindAt!: number | null;
  @field('remind_count') remindCount!: number;
  @field('is_dismissed') isDismissed!: number;
  @field('dismissed_at') dismissedAt!: number | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_deleted') isDeleted!: number;
}
