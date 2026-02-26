import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class TaskModel extends Model {
  static table = 'tasks';

  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('due_date') dueDate!: number | null;
  @field('due_time') dueTime!: number | null;
  @field('priority') priority!: number;
  @field('status') status!: string;
  @field('person_id') personId!: string | null;
  @field('relation_type') relationType!: string | null;
  @field('is_missed') isMissed!: number;
  @field('missed_at') missedAt!: number | null;
  @field('next_remind_at') nextRemindAt!: number | null;
  @field('remind_count') remindCount!: number;
  @field('is_dismissed') isDismissed!: number;
  @field('dismissed_at') dismissedAt!: number | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('completed_at') completedAt!: number | null;
  @field('is_deleted') isDeleted!: number;
}
