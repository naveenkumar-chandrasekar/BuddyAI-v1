import { chatMessageRepository } from '../../../data/repositories/ChatRepository';
import { llamaService } from '../../../core/ai/LlamaService';
import { buildPrompt } from '../../../core/ai/PromptBuilder';
import { parseIntent, isConversationalOnly } from '../../../core/ai/IntentParser';
import { executeAction } from '../../../core/ai/ActionExecutor';
import { buildQueryTodayMessage, buildQueryUpcomingMessage, buildBirthdayMessage } from '../../../core/ai/QueryResponseBuilder';
import { classifyByKeyword } from '../../../core/ai/KeywordClassifier';
import type { ChatMessage } from '../../models/Chat';

export async function sendMessage(
  sessionId: string,
  userText: string,
): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
  const userMessage = await chatMessageRepository.create({
    sessionId,
    sender: 'user',
    message: userText,
    messageType: 'text',
  });

  if (!llamaService.isInitialized) {
    const aiMessage = await chatMessageRepository.create({
      sessionId,
      sender: 'ai',
      message: 'AI model is not loaded yet. Please wait while it initializes.',
      messageType: 'error',
    });
    return { userMessage, aiMessage };
  }

  try {
    const keywordIntent = classifyByKeyword(userText);
    let intent = keywordIntent;

    if (!intent) {
      const prompt = await buildPrompt(sessionId, userText);
      const rawResponse = await llamaService.complete(prompt);
      intent = parseIntent(rawResponse);
    }

    let actionType: string | undefined;
    let actionPayload: string | undefined;
    let finalMessage = intent.message;

    if (intent.action === 'QUERY_TODAY') {
      finalMessage = await buildQueryTodayMessage();
    } else if (intent.action === 'QUERY_UPCOMING') {
      finalMessage = await buildQueryUpcomingMessage();
    } else if (intent.action === 'QUERY_BIRTHDAYS') {
      finalMessage = await buildBirthdayMessage();
    } else if (!isConversationalOnly(intent)) {
      const result = await executeAction(intent);
      actionType = intent.action;
      actionPayload = JSON.stringify({ ...intent.data, success: result.success });
    }

    const aiMessage = await chatMessageRepository.create({
      sessionId,
      sender: 'ai',
      message: finalMessage,
      messageType: isConversationalOnly(intent) ? 'text' : 'action',
      actionType,
      actionPayload,
    });

    return { userMessage, aiMessage };
  } catch {
    const aiMessage = await chatMessageRepository.create({
      sessionId,
      sender: 'ai',
      message: 'Something went wrong. Please try again.',
      messageType: 'error',
    });
    return { userMessage, aiMessage };
  }
}
