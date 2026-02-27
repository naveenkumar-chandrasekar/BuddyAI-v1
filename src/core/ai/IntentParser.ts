import type { ChatIntent } from '../../domain/models/Chat';

const FALLBACK_INTENT: ChatIntent = {
  intent: 'CONVERSATION_INTENT',
  action: 'UNKNOWN',
  message: "I'm not sure I understood that. Could you rephrase?",
  data: {},
};

export function parseIntent(rawResponse: string): ChatIntent {
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return FALLBACK_INTENT;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<ChatIntent>;

    if (
      typeof parsed.intent !== 'string' ||
      typeof parsed.action !== 'string' ||
      typeof parsed.message !== 'string'
    ) {
      return FALLBACK_INTENT;
    }

    return {
      intent: parsed.intent,
      action: parsed.action,
      message: parsed.message,
      data: parsed.data ?? {},
    };
  } catch {
    return FALLBACK_INTENT;
  }
}

export function isConversationalOnly(intent: ChatIntent): boolean {
  return (
    intent.intent === 'CONVERSATION_INTENT' ||
    intent.action === 'UNKNOWN' ||
    intent.action === 'GENERAL_CHAT'
  );
}
