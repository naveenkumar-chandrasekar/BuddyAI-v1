import { chatSessionRepository, chatMessageRepository } from '../../../data/repositories/ChatRepository';
import type { ChatSession, ChatMessage } from '../../models/Chat';

export async function getChatSessions(): Promise<ChatSession[]> {
  return chatSessionRepository.getAll();
}

export async function getOrCreateTodaySession(): Promise<ChatSession> {
  const today = new Date().toISOString().split('T')[0];
  const existing = await chatSessionRepository.getByDate(today);
  if (existing) return existing;
  return chatSessionRepository.create({ sessionDate: today, isDaily: true });
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return chatMessageRepository.getBySessionId(sessionId);
}

export async function createNewSession(): Promise<ChatSession> {
  const today = new Date().toISOString().split('T')[0];
  return chatSessionRepository.create({ sessionDate: today, isDaily: false });
}
