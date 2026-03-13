import { chatMessageRepository } from '../../../data/repositories/ChatRepository';
import { processMessage } from '../../../core/ai/AgentOrchestrator';
import type { ChatMessage } from '../../models/Chat';

export async function sendMessage(
  sessionId: string,
  userText: string,
): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
  const userMessage = await chatMessageRepository.create({
    sessionId, sender: 'user', message: userText, messageType: 'text',
  });

  try {
    const result = await processMessage(userText);

    const aiMessage = await chatMessageRepository.create({
      sessionId,
      sender: 'ai',
      message: result.message,
      messageType: result.type === 'error' ? 'error' : (result.type === 'reply' && result.actionType) ? 'action' : 'text',
      actionType: result.type === 'reply' ? result.actionType : undefined,
      actionPayload: result.type === 'reply' && result.actionType
        ? JSON.stringify({ action: result.actionType })
        : undefined,
    });

    return { userMessage, aiMessage };
  } catch (e) {
    const aiMessage = await chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: 'Something went wrong. Please try again.',
      messageType: 'error',
    });
    return { userMessage, aiMessage };
  }
}
