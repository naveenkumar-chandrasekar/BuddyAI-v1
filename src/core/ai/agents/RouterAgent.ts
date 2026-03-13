import { llamaService } from '../LlamaService';

export type Domain =
  | 'task'
  | 'todo'
  | 'reminder'
  | 'people'
  | 'query_today'
  | 'query_upcoming'
  | 'query_birthdays'
  | 'chat';

const RULES: { domain: Domain; pattern: RegExp }[] = [
  { domain: 'query_today',     pattern: /\b(what|show|list).*(today|schedule|have today)\b|today'?s?\s*(task|todo|reminder|schedule)|\bwhat'?s?\s*(on\s*)?(today|my schedule)\b/i },
  { domain: 'query_upcoming',  pattern: /\b(upcoming|next week|this week|coming up|what'?s? next)\b/i },
  { domain: 'query_birthdays', pattern: /\bbirthday\b/i },
  { domain: 'reminder',        pattern: /\bremind(er|ers|ed|ing)?\b|\balert\s+me\b|\bnotify\s+me\b/i },
  { domain: 'todo',            pattern: /\btodo(s|item|list)?\b|\bchecklist\b|\bcheck[\s-]?off\b/i },
  { domain: 'task',            pattern: /\btask(s)?\b/i },
  { domain: 'people',          pattern: /\b(person|people|contact|relate|sibling|colleague|friend|family|work|relative)\b|\badd\s+\w+(\s+to)?\s+(family|friend|work|school)\b/i },
  { domain: 'chat',            pattern: /^(hi+|hello|hey|howdy|thanks|thank you|what can you|help me|good (morning|afternoon|evening))\b/i },
];

const ROUTER_SYSTEM = `Classify the user message into exactly one category. Reply with ONLY the category word, nothing else.
Categories: task, todo, reminder, people, query_today, query_upcoming, query_birthdays, chat
Examples:
"add buy milk" → task
"add buy milk todo" → todo
"remind me to call mom" → reminder
"add john as family" → people
"what do I have today" → query_today
"upcoming items" → query_upcoming
"any birthdays?" → query_birthdays
"hi" → chat`;

export async function routeMessage(userText: string): Promise<Domain> {
  for (const rule of RULES) {
    if (rule.pattern.test(userText)) return rule.domain;
  }

  if (!llamaService.isInitialized) return 'chat';

  try {
    const prompt = `<|im_start|>system\n${ROUTER_SYSTEM}<|im_end|>\n<|im_start|>user\n"${userText}"<|im_end|>\n<|im_start|>assistant\n`;
    const raw = await llamaService.complete(prompt);
    const word = raw.trim().toLowerCase().split(/\s+/)[0] as Domain;
    const valid: Domain[] = ['task', 'todo', 'reminder', 'people', 'query_today', 'query_upcoming', 'query_birthdays', 'chat'];
    return valid.includes(word) ? word : 'chat';
  } catch {
    return 'chat';
  }
}
