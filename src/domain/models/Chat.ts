export type MessageSender = 'user' | 'ai' | 'system';
export type MessageType = 'text' | 'action' | 'summary' | 'error';

export interface ChatSession {
  id: string;
  sessionDate: string;
  title: string | null;
  summary: string | null;
  isDaily: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: MessageSender;
  message: string;
  messageType: MessageType;
  actionType: string | null;
  actionPayload: string | null;
  isProcessed: boolean;
  createdAt: number;
}

export interface ChatIntent {
  intent: string;
  action: string;
  message: string;
  data: Record<string, unknown>;
}

export interface CreateChatSessionInput {
  sessionDate: string;
  title?: string;
  isDaily?: boolean;
}

export interface CreateChatMessageInput {
  sessionId: string;
  sender: MessageSender;
  message: string;
  messageType: MessageType;
  actionType?: string;
  actionPayload?: string;
}
