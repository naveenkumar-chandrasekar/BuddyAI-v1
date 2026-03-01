import {
  computeNextDueDate,
  computeFirstDueDate,
  describeRecurrence,
} from '../recurrence';

// March 4 2026 is Wednesday (day 3)
const MARCH_4_2026 = new Date(2026, 2, 4, 12, 0, 0);

describe('describeRecurrence', () => {
  it.each([
    ['weekly:0', 'Every Sunday'],
    ['weekly:1', 'Every Monday'],
    ['weekly:3', 'Every Wednesday'],
    ['weekly:6', 'Every Saturday'],
    ['monthly:1', 'Monthly · 1st'],
    ['monthly:2', 'Monthly · 2nd'],
    ['monthly:3', 'Monthly · 3rd'],
    ['monthly:5', 'Monthly · 5th'],
    ['monthly:11', 'Monthly · 11th'],
    ['monthly:22', 'Monthly · 22nd'],
    ['monthly:first:1', 'Monthly · first Monday'],
    ['monthly:first:0', 'Monthly · first Sunday'],
    ['monthly:last:6', 'Monthly · last Saturday'],
    ['monthly:last:5', 'Monthly · last Friday'],
  ])('%s → %s', (recurrence, expected) => {
    expect(describeRecurrence(recurrence)).toBe(expected);
  });
});

describe('computeNextDueDate', () => {
  // from = Wednesday March 4 2026

  it('weekly: same weekday → next week (7 days later)', () => {
    const d = new Date(computeNextDueDate('weekly:3', MARCH_4_2026));
    expect(d.getDay()).toBe(3);   // Wednesday
    expect(d.getDate()).toBe(11); // March 11
    expect(d.getMonth()).toBe(2); // March
  });

  it('weekly: future weekday this week', () => {
    const d = new Date(computeNextDueDate('weekly:5', MARCH_4_2026)); // Friday
    expect(d.getDay()).toBe(5);
    expect(d.getDate()).toBe(6); // March 6
    expect(d.getMonth()).toBe(2);
  });

  it('weekly: Sunday from Wednesday', () => {
    const d = new Date(computeNextDueDate('weekly:0', MARCH_4_2026));
    expect(d.getDay()).toBe(0);  // Sunday
    expect(d.getDate()).toBe(8); // March 8
  });

  it('monthly:date → same date next month', () => {
    const d = new Date(computeNextDueDate('monthly:5', MARCH_4_2026));
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDate()).toBe(5);
  });

  it('monthly:date clamps to last day of short month', () => {
    // From March 4, next month April has 30 days; requesting day 31 → April 30
    const d = new Date(computeNextDueDate('monthly:31', MARCH_4_2026));
    expect(d.getMonth()).toBe(3);  // April
    expect(d.getDate()).toBe(30);  // April 30 (max)
  });

  it('monthly:first:1 → first Monday of next month (April 6 2026)', () => {
    // April 1 2026 = Wednesday; first Monday = April 6
    const d = new Date(computeNextDueDate('monthly:first:1', MARCH_4_2026));
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDay()).toBe(1);   // Monday
    expect(d.getDate()).toBe(6);
  });

  it('monthly:first:0 → first Sunday of next month (April 5 2026)', () => {
    // April 1 = Wednesday, first Sunday = April 5
    const d = new Date(computeNextDueDate('monthly:first:0', MARCH_4_2026));
    expect(d.getMonth()).toBe(3);
    expect(d.getDay()).toBe(0);   // Sunday
    expect(d.getDate()).toBe(5);
  });

  it('monthly:last:6 → last Saturday of next month (April 25 2026)', () => {
    // April 30 = Thursday; last Saturday = April 25
    const d = new Date(computeNextDueDate('monthly:last:6', MARCH_4_2026));
    expect(d.getMonth()).toBe(3);
    expect(d.getDay()).toBe(6);   // Saturday
    expect(d.getDate()).toBe(25);
  });

  it('monthly:last:1 → last Monday of next month (April 27 2026)', () => {
    // April 30 = Thursday; last Monday = April 30 - 3 = April 27
    const d = new Date(computeNextDueDate('monthly:last:1', MARCH_4_2026));
    expect(d.getMonth()).toBe(3);
    expect(d.getDay()).toBe(1);   // Monday
    expect(d.getDate()).toBe(27);
  });

  it('result has time 00:00:00', () => {
    const ts = computeNextDueDate('weekly:0', MARCH_4_2026);
    const d = new Date(ts);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it('fallback: 7 days for unknown recurrence', () => {
    const ts = computeNextDueDate('unknown:x', MARCH_4_2026);
    const base = new Date(2026, 2, 4, 0, 0, 0).getTime();
    expect(ts).toBe(base + 7 * 86400000);
  });
});

describe('computeFirstDueDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // March 4 2026 noon (Wednesday)
    jest.setSystemTime(new Date(2026, 2, 4, 12, 0, 0));
  });
  afterEach(() => jest.useRealTimers());

  it('weekly: today is target weekday → today', () => {
    // Wednesday = day 3
    const d = new Date(computeFirstDueDate('weekly:3'));
    expect(d.getDay()).toBe(3);
    expect(d.getDate()).toBe(4); // March 4
  });

  it('weekly: future weekday this week', () => {
    // Friday = day 5, 2 days from Wednesday
    const d = new Date(computeFirstDueDate('weekly:5'));
    expect(d.getDay()).toBe(5);
    expect(d.getDate()).toBe(6); // March 6
  });

  it('weekly: past weekday → next week', () => {
    // Monday = day 1, from Wednesday → (1-3+7)%7 = 5 days → March 9
    const d = new Date(computeFirstDueDate('weekly:1'));
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(9); // March 9
  });

  it('monthly:date: target date still upcoming this month', () => {
    // Today is March 4, target date 15 → March 15
    const d = new Date(computeFirstDueDate('monthly:15'));
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDate()).toBe(15);
  });

  it('monthly:date: target date today', () => {
    const d = new Date(computeFirstDueDate('monthly:4'));
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(4);
  });

  it('monthly:date: target date passed this month → next month', () => {
    // Today is March 4, target date 1 → April 1
    const d = new Date(computeFirstDueDate('monthly:1'));
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDate()).toBe(1);
  });

  it('monthly:first: first Monday of March passed → April', () => {
    // March 1 = Sunday; first Monday = March 2 < March 4 → use April
    // April 1 = Wednesday; first Monday = April 6
    const d = new Date(computeFirstDueDate('monthly:first:1'));
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(6);
  });

  it('monthly:first: first Saturday of March still upcoming', () => {
    // March 1 = Sunday; first Saturday = March 7; March 7 >= March 4 ✓
    const d = new Date(computeFirstDueDate('monthly:first:6'));
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDay()).toBe(6);   // Saturday
    expect(d.getDate()).toBe(7);
  });

  it('monthly:last: last Saturday of March still upcoming', () => {
    // March 31 = Tuesday; last Saturday = March 28 >= March 4 ✓
    const d = new Date(computeFirstDueDate('monthly:last:6'));
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDay()).toBe(6);   // Saturday
    expect(d.getDate()).toBe(28);
  });

  it('returns midnight time', () => {
    const ts = computeFirstDueDate('weekly:5');
    const d = new Date(ts);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});
