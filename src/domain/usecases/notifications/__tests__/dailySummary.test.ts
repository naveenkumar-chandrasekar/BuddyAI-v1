import { generateDailySummary, formatDailySummaryBody } from '../GenerateDailySummaryUseCase';
import { Priority } from '../../../../shared/constants/priority';
import { TaskStatus } from '../../../../shared/constants/taskStatus';

jest.mock('../../../../data/repositories/TaskRepository', () => ({
  taskRepository: { getAll: jest.fn() },
  todoRepository: { getAll: jest.fn() },
  reminderRepository: { getAll: jest.fn() },
}));

jest.mock('../../../../data/repositories/PeopleRepository', () => ({
  peopleRepository: { getAll: jest.fn() },
}));

const { taskRepository, todoRepository, reminderRepository } =
  jest.requireMock('../../../../data/repositories/TaskRepository');
const { peopleRepository } =
  jest.requireMock('../../../../data/repositories/PeopleRepository');

function todayTs(offsetHours = 0): number {
  const d = new Date();
  d.setHours(12 + offsetHours, 0, 0, 0);
  return d.getTime();
}

function todayStartTs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const BASE_TASK = {
  id: 't1', title: 'Task', description: null, dueDate: null, dueTime: null,
  priority: Priority.MEDIUM, status: TaskStatus.PENDING, personId: null,
  relationType: null, isMissed: false, missedAt: null, nextRemindAt: null,
  remindCount: 0, isDismissed: false, createdAt: 1000, updatedAt: 1000, completedAt: null,
};

const BASE_REMINDER = {
  id: 'r1', title: 'Reminder', description: null, remindAt: todayTs(),
  isRecurring: false, recurrence: null, isDone: false, personId: null,
  relationType: null, priority: Priority.HIGH, isMissed: false,
  missedAt: null, nextRemindAt: null, remindCount: 0, isDismissed: false,
  createdAt: 1000, updatedAt: 1000,
};

describe('generateDailySummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty summary when no data', async () => {
    taskRepository.getAll.mockResolvedValue([]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);
    peopleRepository.getAll.mockResolvedValue([]);

    const summary = await generateDailySummary();

    expect(summary.todaysTasks).toHaveLength(0);
    expect(summary.todaysTodos).toHaveLength(0);
    expect(summary.todaysReminders).toHaveLength(0);
    expect(summary.missedItems.tasks).toHaveLength(0);
    expect(summary.missedItems.todos).toHaveLength(0);
    expect(summary.missedItems.reminders).toHaveLength(0);
    expect(summary.upcomingBirthdays).toHaveLength(0);
  });

  it('includes tasks due today', async () => {
    const task = { ...BASE_TASK, dueDate: todayTs() };
    taskRepository.getAll.mockResolvedValue([task]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);
    peopleRepository.getAll.mockResolvedValue([]);

    const summary = await generateDailySummary();
    expect(summary.todaysTasks).toHaveLength(1);
    expect(summary.todaysTasks[0].id).toBe('t1');
  });

  it('excludes done tasks from today', async () => {
    const task = { ...BASE_TASK, dueDate: todayTs(), status: TaskStatus.DONE };
    taskRepository.getAll.mockResolvedValue([task]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);
    peopleRepository.getAll.mockResolvedValue([]);

    const summary = await generateDailySummary();
    expect(summary.todaysTasks).toHaveLength(0);
  });

  it('classifies overdue tasks as missed', async () => {
    const yesterday = todayStartTs() - 86400000;
    const task = { ...BASE_TASK, dueDate: yesterday };
    taskRepository.getAll.mockResolvedValue([task]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);
    peopleRepository.getAll.mockResolvedValue([]);

    const summary = await generateDailySummary();
    expect(summary.todaysTasks).toHaveLength(0);
    expect(summary.missedItems.tasks).toHaveLength(1);
  });

  it('includes reminder due today', async () => {
    taskRepository.getAll.mockResolvedValue([]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([BASE_REMINDER]);
    peopleRepository.getAll.mockResolvedValue([]);

    const summary = await generateDailySummary();
    expect(summary.todaysReminders).toHaveLength(1);
  });

  it('classifies past reminder as missed', async () => {
    const reminder = { ...BASE_REMINDER, remindAt: Date.now() - 86400000 };
    taskRepository.getAll.mockResolvedValue([]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([reminder]);
    peopleRepository.getAll.mockResolvedValue([]);

    const summary = await generateDailySummary();
    expect(summary.todaysReminders).toHaveLength(0);
    expect(summary.missedItems.reminders).toHaveLength(1);
  });

  it('includes upcoming birthday within 14 days', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const bd = `1990-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const person = {
      id: 'p1', name: 'Alice', relationshipType: 'family', customRelation: null,
      placeId: null, priority: Priority.HIGH, birthday: bd, phone: null, notes: null,
      createdAt: 1000, updatedAt: 1000,
    };

    taskRepository.getAll.mockResolvedValue([]);
    todoRepository.getAll.mockResolvedValue([]);
    reminderRepository.getAll.mockResolvedValue([]);
    peopleRepository.getAll.mockResolvedValue([person]);

    const summary = await generateDailySummary();
    expect(summary.upcomingBirthdays).toHaveLength(1);
    expect(summary.upcomingBirthdays[0].person.name).toBe('Alice');
    expect(summary.upcomingBirthdays[0].daysUntil).toBeLessThanOrEqual(14);
  });
});

describe('formatDailySummaryBody', () => {
  it('returns nothing-due message for empty summary', () => {
    const body = formatDailySummaryBody({
      todaysTasks: [], todaysTodos: [], todaysReminders: [],
      missedItems: { tasks: [], todos: [], reminders: [] },
      upcomingBirthdays: [],
    });
    expect(body).toContain('Nothing due today');
  });

  it('mentions items due count', () => {
    const body = formatDailySummaryBody({
      todaysTasks: [BASE_TASK],
      todaysTodos: [],
      todaysReminders: [],
      missedItems: { tasks: [], todos: [], reminders: [] },
      upcomingBirthdays: [],
    });
    expect(body).toContain('1 item due today');
  });

  it('mentions missed count', () => {
    const body = formatDailySummaryBody({
      todaysTasks: [],
      todaysTodos: [],
      todaysReminders: [],
      missedItems: { tasks: [BASE_TASK, BASE_TASK], todos: [], reminders: [] },
      upcomingBirthdays: [],
    });
    expect(body).toContain('2 missed items');
  });
});
