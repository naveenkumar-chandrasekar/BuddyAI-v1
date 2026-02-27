import { Priority, PRIORITY_LABELS } from '../priority';
import { RelationshipType, RELATIONSHIP_LABELS } from '../relationships';
import { PlaceType, PLACE_TYPE_LABELS } from '../places';
import { TaskStatus, TaskItemType } from '../taskStatus';

describe('Priority constants', () => {
  it('defines HIGH=1, MEDIUM=2, LOW=3', () => {
    expect(Priority.HIGH).toBe(1);
    expect(Priority.MEDIUM).toBe(2);
    expect(Priority.LOW).toBe(3);
  });

  it('has a label for every priority value', () => {
    for (const v of Object.values(Priority)) {
      expect(PRIORITY_LABELS[v]).toBeTruthy();
    }
  });
});

describe('RelationshipType constants', () => {
  it('defines all 6 types', () => {
    const types = Object.values(RelationshipType);
    expect(types).toContain('family');
    expect(types).toContain('college');
    expect(types).toContain('school');
    expect(types).toContain('office');
    expect(types).toContain('other');
    expect(types).toContain('custom');
  });

  it('has a label for every relationship type', () => {
    for (const v of Object.values(RelationshipType)) {
      expect(RELATIONSHIP_LABELS[v]).toBeTruthy();
    }
  });
});

describe('PlaceType constants', () => {
  it('defines all 4 types', () => {
    const types = Object.values(PlaceType);
    expect(types).toHaveLength(4);
    expect(types).toContain('custom');
  });

  it('has a label for every place type', () => {
    for (const v of Object.values(PlaceType)) {
      expect(PLACE_TYPE_LABELS[v]).toBeTruthy();
    }
  });
});

describe('TaskStatus constants', () => {
  it('defines 5 statuses', () => {
    const statuses = Object.values(TaskStatus);
    expect(statuses).toHaveLength(5);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('done');
    expect(statuses).toContain('missed');
  });
});

describe('TaskItemType constants', () => {
  it('defines task, todo, reminder', () => {
    expect(TaskItemType.TASK).toBe('task');
    expect(TaskItemType.TODO).toBe('todo');
    expect(TaskItemType.REMINDER).toBe('reminder');
  });
});
