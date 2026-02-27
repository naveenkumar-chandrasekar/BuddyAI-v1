import { taskRepository, todoRepository, reminderRepository } from '../../../data/repositories/TaskRepository';
import { cancelNotification } from '../../../core/notifications/NotifeeService';
import { NOTIF_IDS } from '../../../core/notifications/NotifeeService';

export async function dismissMissedItem(
  type: 'task' | 'todo' | 'reminder',
  id: string,
): Promise<void> {
  await cancelNotification(NOTIF_IDS.missed(type, id));
  if (type === 'task') {
    await taskRepository.update(id, { isDismissed: true });
  } else if (type === 'todo') {
    await todoRepository.update(id, { isDismissed: true });
  } else {
    await reminderRepository.update(id, { isDismissed: true });
  }
}
