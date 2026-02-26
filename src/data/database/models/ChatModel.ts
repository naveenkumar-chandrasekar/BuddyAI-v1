import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class ChatSessionModel extends Model {
  static table = 'chat_sessions';

  @field('session_date') sessionDate!: string;
  @field('title') title!: string | null;
  @field('summary') summary!: string | null;
  @field('is_daily') isDaily!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

export class ChatMessageModel extends Model {
  static table = 'chat_messages';

  @field('session_id') sessionId!: string;
  @field('sender') sender!: string;
  @field('message') message!: string;
  @field('message_type') messageType!: string;
  @field('action_type') actionType!: string | null;
  @field('action_payload') actionPayload!: string | null;
  @field('is_processed') isProcessed!: number;
  @readonly @date('created_at') createdAt!: Date;
}

export class ChatSessionPersonModel extends Model {
  static table = 'chat_session_people';

  @field('session_id') sessionId!: string;
  @field('person_id') personId!: string;
  @readonly @date('created_at') createdAt!: Date;
}

export class ChatSessionTaskModel extends Model {
  static table = 'chat_session_tasks';

  @field('session_id') sessionId!: string;
  @field('task_id') taskId!: string;
  @readonly @date('created_at') createdAt!: Date;
}

export class ChatSessionTodoModel extends Model {
  static table = 'chat_session_todos';

  @field('session_id') sessionId!: string;
  @field('todo_id') todoId!: string;
  @readonly @date('created_at') createdAt!: Date;
}

export class ChatSessionReminderModel extends Model {
  static table = 'chat_session_reminders';

  @field('session_id') sessionId!: string;
  @field('reminder_id') reminderId!: string;
  @readonly @date('created_at') createdAt!: Date;
}
