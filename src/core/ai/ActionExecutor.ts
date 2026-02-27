import { addPerson } from '../../domain/usecases/people/AddPersonUseCase';
import { updatePerson } from '../../domain/usecases/people/UpdatePersonUseCase';
import { deletePerson } from '../../domain/usecases/people/DeletePersonUseCase';
import { addTask, addTodo, addReminder } from '../../domain/usecases/tasks/AddTaskUseCase';
import { updateTask, toggleTodo } from '../../domain/usecases/tasks/UpdateTaskUseCase';
import { deleteTask, deleteTodo, deleteReminder } from '../../domain/usecases/tasks/DeleteTaskUseCase';
import { taskRepository, todoRepository, reminderRepository } from '../../data/repositories/TaskRepository';
import { notificationConfigRepository } from '../../data/repositories/NotificationRepository';
import { setDailyNotifTime } from '../../domain/usecases/notifications/ScheduleDailyNotificationUseCase';
import type { ChatIntent } from '../../domain/models/Chat';
import { Priority } from '../../shared/constants/priority';
import { TaskStatus } from '../../shared/constants/taskStatus';

export interface ActionResult {
  success: boolean;
  message?: string;
}

function toPriority(val: unknown): typeof Priority[keyof typeof Priority] {
  const n = Number(val);
  if (n === Priority.HIGH || n === Priority.MEDIUM || n === Priority.LOW) return n;
  return Priority.MEDIUM;
}

export async function executeAction(intent: ChatIntent): Promise<ActionResult> {
  const d = intent.data;
  try {
    switch (intent.action) {
      case 'CREATE_PERSON':
        await addPerson({
          name: String(d.name ?? ''),
          relationshipType: String(d.relationship_type ?? 'other') as never,
          priority: toPriority(d.priority),
          customRelation: d.custom_relation ? String(d.custom_relation) : undefined,
          placeId: d.place_id ? String(d.place_id) : undefined,
          birthday: d.birthday ? String(d.birthday) : undefined,
          phone: d.phone ? String(d.phone) : undefined,
          notes: d.notes ? String(d.notes) : undefined,
        });
        return { success: true };

      case 'UPDATE_PERSON':
        if (!d.id) return { success: false, message: 'Person ID required' };
        await updatePerson(String(d.id), {
          name: d.name ? String(d.name) : undefined,
          priority: d.priority !== undefined ? toPriority(d.priority) : undefined,
          birthday: d.birthday ? String(d.birthday) : undefined,
          phone: d.phone ? String(d.phone) : undefined,
          notes: d.notes ? String(d.notes) : undefined,
        });
        return { success: true };

      case 'DELETE_PERSON':
        if (!d.id) return { success: false, message: 'Person ID required' };
        await deletePerson(String(d.id));
        return { success: true };

      case 'CREATE_TASK':
        await addTask({
          title: String(d.title ?? ''),
          description: d.description ? String(d.description) : undefined,
          dueDate: d.due_date ? Number(d.due_date) : undefined,
          priority: toPriority(d.priority),
          personId: d.person_id ? String(d.person_id) : undefined,
        });
        return { success: true };

      case 'COMPLETE_TASK':
        if (!d.id) return { success: false, message: 'Task ID required' };
        await updateTask(String(d.id), { status: TaskStatus.DONE });
        return { success: true };

      case 'DELETE_TASK':
        if (!d.id) return { success: false, message: 'Task ID required' };
        await deleteTask(String(d.id));
        return { success: true };

      case 'CREATE_TODO':
        await addTodo({
          title: String(d.title ?? ''),
          priority: toPriority(d.priority),
          dueDate: d.due_date ? Number(d.due_date) : undefined,
          personId: d.person_id ? String(d.person_id) : undefined,
        });
        return { success: true };

      case 'COMPLETE_TODO':
        if (!d.id) return { success: false, message: 'Todo ID required' };
        await toggleTodo(String(d.id));
        return { success: true };

      case 'DELETE_TODO':
        if (!d.id) return { success: false, message: 'Todo ID required' };
        await deleteTodo(String(d.id));
        return { success: true };

      case 'CREATE_REMINDER':
        await addReminder({
          title: String(d.title ?? ''),
          description: d.description ? String(d.description) : undefined,
          remindAt: Number(d.remind_at ?? Date.now() + 3600000),
          priority: toPriority(d.priority),
          isRecurring: Boolean(d.is_recurring),
          recurrence: d.recurrence ? String(d.recurrence) : undefined,
          personId: d.person_id ? String(d.person_id) : undefined,
        });
        return { success: true };

      case 'DELETE_REMINDER':
        if (!d.id) return { success: false, message: 'Reminder ID required' };
        await deleteReminder(String(d.id));
        return { success: true };

      case 'DISMISS_MISSED_ITEM': {
        const type = String(d.type ?? '');
        const id = String(d.id ?? '');
        if (!id) return { success: false, message: 'Item ID required' };
        if (type === 'task') await taskRepository.update(id, { isDismissed: true });
        else if (type === 'todo') await todoRepository.update(id, { isDismissed: true });
        else if (type === 'reminder') await reminderRepository.update(id, { isDismissed: true });
        return { success: true };
      }

      case 'UPDATE_NOTIF_TIME':
        if (d.time) setDailyNotifTime(String(d.time));
        return { success: true };

      case 'UPDATE_BIRTHDAY_THRESHOLD': {
        const config = await notificationConfigRepository.get();
        if (config) {
          await notificationConfigRepository.update(config.id, {
            highPriorityDays: d.high_days ? Number(d.high_days) : undefined,
            mediumPriorityDays: d.medium_days ? Number(d.medium_days) : undefined,
            lowPriorityDays: d.low_days ? Number(d.low_days) : undefined,
          });
        }
        return { success: true };
      }

      default:
        return { success: true };
    }
  } catch (e) {
    return { success: false, message: String(e) };
  }
}
