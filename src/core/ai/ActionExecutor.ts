import { addPerson } from '../../domain/usecases/people/AddPersonUseCase';
import { updatePerson } from '../../domain/usecases/people/UpdatePersonUseCase';
import { deletePerson } from '../../domain/usecases/people/DeletePersonUseCase';
import { personRepository } from '../../data/repositories/PeopleRepository';
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


const VALID_RELATIONSHIP_TYPES = ['family', 'friend', 'work', 'school', 'other', 'custom'];

function toRelationshipType(val: unknown): string {
  const s = String(val ?? '').toLowerCase();
  if (VALID_RELATIONSHIP_TYPES.includes(s)) return s;
  // Map common LLM synonyms to valid values
  if (s === 'college' || s === 'university') return 'friend';
  if (s === 'colleague' || s === 'coworker' || s === 'office') return 'work';
  if (s === 'classmate') return 'school';
  if (s === 'friend' || s === 'friends' || s === 'buddy') return 'friend';
  return 'other';
}

async function resolveTaskId(id: unknown, title: unknown): Promise<string | null> {
  const s = String(id ?? '').trim();
  if (s && s !== 'TASK_ID_FROM_CONTEXT') return s;
  if (!title) return null;
  const all = await taskRepository.getAll();
  const lower = String(title).toLowerCase();
  return all.find(t => t.title.toLowerCase().includes(lower))?.id ?? null;
}

async function resolveTodoId(id: unknown, title: unknown): Promise<string | null> {
  const s = String(id ?? '').trim();
  if (s && s !== 'TODO_ID_FROM_CONTEXT') return s;
  if (!title) return null;
  const all = await todoRepository.getAll();
  const lower = String(title).toLowerCase();
  return all.find(t => t.title.toLowerCase().includes(lower))?.id ?? null;
}

async function resolveReminderId(id: unknown, title: unknown): Promise<string | null> {
  const s = String(id ?? '').trim();
  if (s && s !== 'REMINDER_ID_FROM_CONTEXT') return s;
  if (!title) return null;
  const all = await reminderRepository.getAll();
  const lower = String(title).toLowerCase();
  return all.find(r => r.title.toLowerCase().includes(lower))?.id ?? null;
}

async function resolvePersonId(id: unknown, name: unknown): Promise<string | null> {
  const s = String(id ?? '').trim();
  if (s && s !== 'PERSON_ID_FROM_CONTEXT') return s;
  if (!name) return null;
  const results = await personRepository.search(String(name));
  return results[0]?.id ?? null;
}

export async function executeAction(intent: ChatIntent): Promise<ActionResult> {
  const d = intent.data;
  try {
    switch (intent.action) {
      case 'CREATE_PERSON': {
        const personName = String(d.name ?? '').trim();
        if (!personName) return { success: false, message: 'Person name is required' };
        await addPerson({
          name: personName,
          relationshipType: toRelationshipType(d.relationship_type) as never,
          priority: toPriority(d.priority),
          customRelation: d.custom_relation ? String(d.custom_relation) : undefined,
          birthday: d.birthday ? String(d.birthday) : undefined,
          phone: d.phone ? String(d.phone) : undefined,
          notes: d.notes ? String(d.notes) : undefined,
        });
        return { success: true };
      }

      case 'UPDATE_PERSON': {
        const pid = await resolvePersonId(d.id, d.name);
        if (!pid) return { success: false, message: `Person "${d.name ?? d.id}" not found` };
        await updatePerson(pid, {
          name: d.name ? String(d.name) : undefined,
          priority: d.priority !== undefined ? toPriority(d.priority) : undefined,
          birthday: d.birthday ? String(d.birthday) : undefined,
          phone: d.phone ? String(d.phone) : undefined,
          notes: d.notes ? String(d.notes) : undefined,
        });
        return { success: true };
      }

      case 'DELETE_PERSON': {
        const dpid = await resolvePersonId(d.id, d.name);
        if (!dpid) return { success: false, message: `Person "${d.name ?? d.id}" not found` };
        await deletePerson(dpid);
        return { success: true };
      }

      case 'CREATE_CONNECTION': {
        const name1 = String(d.person1_name ?? '').trim();
        const name2 = String(d.person2_name ?? '').trim();
        const connLabel = String(d.label ?? 'connected').trim();
        if (!name1 || !name2) return { success: false, message: 'Both person names required' };
        const [res1, res2] = await Promise.all([
          personRepository.search(name1),
          personRepository.search(name2),
        ]);
        if (!res1.length) return { success: false, message: `Couldn't find "${name1}" in your people.` };
        if (!res2.length) return { success: false, message: `Couldn't find "${name2}" in your people.` };
        await personRepository.addConnection({
          personId: res1[0].id,
          relatedPersonId: res2[0].id,
          label: connLabel,
        });
        return { success: true };
      }

      case 'CREATE_TASK':
        await addTask({
          title: String(d.title ?? ''),
          description: d.description ? String(d.description) : undefined,
          dueDate: d.due_date ? Number(d.due_date) : undefined,
          priority: toPriority(d.priority),
          personId: d.person_id ? String(d.person_id) : undefined,
        });
        return { success: true };

      case 'COMPLETE_TASK': {
        const ctid = await resolveTaskId(d.id, d.title);
        if (!ctid) return { success: false, message: `Task "${d.title ?? d.id}" not found` };
        await updateTask(ctid, { status: TaskStatus.DONE });
        return { success: true };
      }

      case 'DELETE_TASK': {
        const dtid = await resolveTaskId(d.id, d.title);
        if (!dtid) return { success: false, message: `Task "${d.title ?? d.id}" not found` };
        await deleteTask(dtid);
        return { success: true };
      }

      case 'CREATE_TODO': {
        const recurrence = d.recurrence ? String(d.recurrence) : undefined;
        await addTodo({
          title: String(d.title ?? ''),
          priority: toPriority(d.priority),
          dueDate: d.due_date ? Number(d.due_date) : undefined,
          personId: d.person_id ? String(d.person_id) : undefined,
          isRecurring: Boolean(d.is_recurring),
          recurrence,
        });
        return { success: true };
      }

      case 'COMPLETE_TODO': {
        const ctodoid = await resolveTodoId(d.id, d.title);
        if (!ctodoid) return { success: false, message: `Todo "${d.title ?? d.id}" not found` };
        await toggleTodo(ctodoid);
        return { success: true };
      }

      case 'DELETE_TODO': {
        const dtodoid = await resolveTodoId(d.id, d.title);
        if (!dtodoid) return { success: false, message: `Todo "${d.title ?? d.id}" not found` };
        await deleteTodo(dtodoid);
        return { success: true };
      }

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

      case 'DELETE_REMINDER': {
        const drid = await resolveReminderId(d.id, d.title);
        if (!drid) return { success: false, message: `Reminder "${d.title ?? d.id}" not found` };
        await deleteReminder(drid);
        return { success: true };
      }

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
