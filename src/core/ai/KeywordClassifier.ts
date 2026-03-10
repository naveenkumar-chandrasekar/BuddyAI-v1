import type { ChatIntent } from '../../domain/models/Chat';

type Rule = { pattern: RegExp; intent: string; action: string; message: string };

const RULES: Rule[] = [
  {
    pattern: /\b(what|show|list).*(today|schedule|have today|do i have)\b|what('s| is) (on |my )?(today|schedule)|today'?s? (task|todo|reminder|schedule)/i,
    intent: 'QUERY_INTENT', action: 'QUERY_TODAY', message: "Let me check your schedule!",
  },
  {
    pattern: /\b(upcoming|next week|this week|coming up|what's? next|future task|future reminder)\b/i,
    intent: 'QUERY_INTENT', action: 'QUERY_UPCOMING', message: "Here's what's coming up!",
  },
  {
    pattern: /\b(birthday|birthdays|whose birthday)\b/i,
    intent: 'QUERY_INTENT', action: 'QUERY_BIRTHDAYS', message: "Checking birthdays!",
  },
  {
    pattern: /\b(add|create|new).*(task)\b|\b(task).*(add|create|new)\b/i,
    intent: 'TASK_INTENT', action: 'CREATE_TASK', message: '',
  },
  {
    pattern: /\b(add|create|new).*(todo|to-do|to do)\b|\b(todo|to-do).*(add|create|new)\b/i,
    intent: 'TODO_INTENT', action: 'CREATE_TODO', message: '',
  },
  {
    pattern: /\b(remind me|set (a )?reminder|add (a )?reminder|create (a )?reminder)\b/i,
    intent: 'REMINDER_INTENT', action: 'CREATE_REMINDER', message: '',
  },
  {
    pattern: /\b(add|create|new).*(person|contact|friend|colleague|family|brother|sister|mom|dad|mother|father|wife|husband)\b/i,
    intent: 'PEOPLE_INTENT', action: 'CREATE_PERSON', message: '',
  },
  {
    pattern: /^(hi+|hello|hey|howdy|good (morning|afternoon|evening)|sup|what'?s? up)\b/i,
    intent: 'CONVERSATION_INTENT', action: 'GENERAL_CHAT', message: 'Hello! How can I help you today?',
  },
];

export function classifyByKeyword(userText: string): ChatIntent | null {
  for (const rule of RULES) {
    if (rule.pattern.test(userText)) {
      return {
        intent: rule.intent,
        action: rule.action,
        message: rule.message,
        data: {},
      };
    }
  }
  return null;
}
