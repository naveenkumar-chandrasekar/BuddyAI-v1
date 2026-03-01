export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  if (n % 10 === 1) return 'st';
  if (n % 10 === 2) return 'nd';
  if (n % 10 === 3) return 'rd';
  return 'th';
}

export function describeRecurrence(recurrence: string): string {
  const parts = recurrence.split(':');
  if (parts[0] === 'weekly') {
    return `Every ${WEEKDAY_FULL[Number(parts[1])]}`;
  }
  if (parts[0] === 'monthly') {
    if (parts[1] === 'first') return `Monthly · first ${WEEKDAY_FULL[Number(parts[2])]}`;
    if (parts[1] === 'last') return `Monthly · last ${WEEKDAY_FULL[Number(parts[2])]}`;
    const d = Number(parts[1]);
    return `Monthly · ${d}${ordinal(d)}`;
  }
  return recurrence;
}

export function computeNextDueDate(recurrence: string, from: Date): number {
  const parts = recurrence.split(':');
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);

  if (parts[0] === 'weekly') {
    const targetDay = Number(parts[1]);
    let daysUntil = (targetDay - d.getDay() + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    d.setDate(d.getDate() + daysUntil);
    return d.getTime();
  }

  if (parts[0] === 'monthly') {
    if (parts[1] === 'first' || parts[1] === 'last') {
      const nth = parts[1];
      const targetDay = Number(parts[2]);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      if (nth === 'first') {
        const diff = (targetDay - next.getDay() + 7) % 7;
        next.setDate(1 + diff);
        return next.getTime();
      } else {
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0);
        const diff = (lastDay.getDay() - targetDay + 7) % 7;
        lastDay.setDate(lastDay.getDate() - diff);
        return lastDay.getTime();
      }
    } else {
      const targetDate = Number(parts[1]);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(targetDate, daysInMonth));
      return next.getTime();
    }
  }

  return d.getTime() + 7 * 24 * 60 * 60 * 1000;
}

export function computeFirstDueDate(recurrence: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const parts = recurrence.split(':');

  if (parts[0] === 'weekly') {
    const targetDay = Number(parts[1]);
    const daysUntil = (targetDay - now.getDay() + 7) % 7;
    const d = new Date(now);
    d.setDate(d.getDate() + daysUntil);
    return d.getTime();
  }

  if (parts[0] === 'monthly') {
    if (parts[1] === 'first' || parts[1] === 'last') {
      const nth = parts[1];
      const targetDay = Number(parts[2]);

      const tryMonth = (year: number, month: number): Date => {
        if (nth === 'first') {
          const first = new Date(year, month, 1);
          const diff = (targetDay - first.getDay() + 7) % 7;
          return new Date(year, month, 1 + diff);
        } else {
          const last = new Date(year, month + 1, 0);
          const diff = (last.getDay() - targetDay + 7) % 7;
          return new Date(year, month, last.getDate() - diff);
        }
      };

      const candidate = tryMonth(now.getFullYear(), now.getMonth());
      if (candidate >= now) return candidate.getTime();
      const next = tryMonth(now.getFullYear(), now.getMonth() + 1);
      return next.getTime();
    } else {
      const targetDate = Number(parts[1]);
      const candidate = new Date(now.getFullYear(), now.getMonth(), targetDate);
      if (candidate >= now) return candidate.getTime();
      const daysInNext = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate();
      return new Date(now.getFullYear(), now.getMonth() + 1, Math.min(targetDate, daysInNext)).getTime();
    }
  }

  return now.getTime();
}
