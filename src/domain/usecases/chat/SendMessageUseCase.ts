import { chatMessageRepository } from '../../../data/repositories/ChatRepository';
import { llamaService } from '../../../core/ai/LlamaService';
import { buildPrompt } from '../../../core/ai/PromptBuilder';
import { parseIntent, isConversationalOnly } from '../../../core/ai/IntentParser';
import { executeAction } from '../../../core/ai/ActionExecutor';
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
    const prompt = await buildPrompt(sessionId, userText);
    const rawResponse = await llamaService.complete(prompt);
    const intent = parseIntent(rawResponse);

    let actionType: string | undefined;
    let actionPayload: string | undefined;

    if (!isConversationalOnly(intent)) {
      const result = await executeAction(intent);
      actionType = intent.action;
      actionPayload = JSON.stringify({ ...intent.data, success: result.success });
    }

    const aiMessage = await chatMessageRepository.create({
      sessionId,
      sender: 'ai',
      message: intent.message,
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
