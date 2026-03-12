import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class TodoItemModel extends Model {
  static table = 'todo_items';

  @field('todo_id') todoId!: string;
  @field('title') title!: string;
  @field('is_completed') isCompleted!: number;
  @field('position') position!: number;
  @field('person_id') personId!: string | null;
  @field('relation_type') relationType!: string | null;
  @field('completed_at') completedAt!: number | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_deleted') isDeleted!: number;
}
