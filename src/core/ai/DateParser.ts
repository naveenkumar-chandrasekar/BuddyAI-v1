function extractTime(text: string): { h: number; m: number } | null {
  const ampm = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2] ? parseInt(ampm[2], 10) : 0;
    const period = ampm[3].toLowerCase();
    if (period === 'pm' && h < 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return { h, m };
  }
  const h24 = text.match(/(\d{1,2}):(\d{2})/);
  if (h24) return { h: parseInt(h24[1], 10), m: parseInt(h24[2], 10) };
  if (text.includes('midnight')) return { h: 0, m: 0 };
  if (text.includes('noon') || text.includes('midday')) return { h: 12, m: 0 };
  if (text.includes('morning')) return { h: 9, m: 0 };
  if (text.includes('afternoon')) return { h: 14, m: 0 };
  if (text.includes('evening')) return { h: 18, m: 0 };
  if (text.includes('tonight') || text.includes('night')) return { h: 20, m: 0 };
  return null;
}

export function parseDate(text: string): number | null {
  const lower = text.toLowerCase().trim();
  if (!lower || lower === 'skip' || lower === 'no date' || lower === 'no' || lower === 'none' || lower === 'later') {
    return null;
  }

  const now = new Date();

  if (lower.includes('tomorrow')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    const t = extractTime(lower);
    t ? d.setHours(t.h, t.m, 0, 0) : d.setHours(9, 0, 0, 0);
    return d.getTime();
  }

  if (lower.includes('tonight')) {
    const d = new Date(now);
    const t = extractTime(lower) ?? { h: 20, m: 0 };
    d.setHours(t.h, t.m, 0, 0);
    return d.getTime();
  }

  if (lower.includes('today')) {
    const d = new Date(now);
    const t = extractTime(lower);
    t ? d.setHours(t.h, t.m, 0, 0) : d.setHours(now.getHours() + 1, 0, 0, 0);
    return d.getTime();
  }

  const inHours = lower.match(/in\s+(\d+)\s+hours?/);
  if (inHours) return now.getTime() + parseInt(inHours[1], 10) * 3600000;

  const inMins = lower.match(/in\s+(\d+)\s+min(ute)?s?/);
  if (inMins) return now.getTime() + parseInt(inMins[1], 10) * 60000;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const d = new Date(now);
      const diff = ((i - now.getDay() + 7) % 7) || 7;
      d.setDate(d.getDate() + diff);
      const t = extractTime(lower);
      t ? d.setHours(t.h, t.m, 0, 0) : d.setHours(9, 0, 0, 0);
      return d.getTime();
    }
  }

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) {
      const dayMatch = lower.match(/(\d{1,2})/);
      if (dayMatch) {
        const d = new Date(now.getFullYear(), i, parseInt(dayMatch[1], 10));
        if (d < now) d.setFullYear(d.getFullYear() + 1);
        const t = extractTime(lower);
        t ? d.setHours(t.h, t.m, 0, 0) : d.setHours(9, 0, 0, 0);
        return d.getTime();
      }
    }
  }

  const slashDate = lower.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashDate) {
    const d = new Date(now.getFullYear(), parseInt(slashDate[1], 10) - 1, parseInt(slashDate[2], 10));
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    const t = extractTime(lower);
    t ? d.setHours(t.h, t.m, 0, 0) : d.setHours(9, 0, 0, 0);
    return d.getTime();
  }

  const standaloneTime = extractTime(lower);
  if (standaloneTime) {
    const d = new Date(now);
    d.setHours(standaloneTime.h, standaloneTime.m, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }

  return null;
}

export function hasDateInText(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    'today', 'tomorrow', 'tonight', 'morning', 'afternoon', 'evening', 'night', 'midnight', 'noon',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    'am', 'pm', ':',
  ];
  if (/in\s+\d+\s+(hour|min)/.test(lower)) return true;
  if (/\d{1,2}\/\d{1,2}/.test(lower)) return true;
  return keywords.some(k => lower.includes(k));
}
