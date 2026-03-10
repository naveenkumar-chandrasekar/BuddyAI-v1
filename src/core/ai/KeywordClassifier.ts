import type { ChatIntent } from '../../domain/models/Chat';

type Rule = { pattern: RegExp; intent: string; action: string; message: string };

// Only handle intents that need NO data extraction — queries and greetings.
// CREATE_*/UPDATE_*/DELETE_* go through the LLM so it can extract names/titles/IDs.
const RULES: Rule[] = [
  {
    pattern: /\b(what|show|list).*(today|schedule|have today|do i have)\b|what('s| is) (on |my )?(today|schedule)|today'?s? (task|todo|reminder|schedule)/i,
    intent: 'QUERY_INTENT', action: 'QUERY_TODAY', message: "Let me check your schedule!",
  },
  {
    pattern: /\b(upcoming|next week|this week|coming up|what'?s? next|future task|future reminder)\b/i,
    intent: 'QUERY_INTENT', action: 'QUERY_UPCOMING', message: "Here's what's coming up!",
  },
  {
    pattern: /\b(birthday|birthdays|whose birthday)\b/i,
    intent: 'QUERY_INTENT', action: 'QUERY_BIRTHDAYS', message: "Checking birthdays!",
  },
  {
    pattern: /\b(missed|overdue|pending|incomplete).*(item|task|todo|reminder)s?\b|\bshow missed\b/i,
    intent: 'QUERY_INTENT', action: 'QUERY_TODAY', message: "Let me check your schedule!",
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
