import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import { ChatSessionModel, ChatMessageModel } from '../database/models/ChatModel';
import type {
  ChatSession,
  ChatMessage,
  CreateChatSessionInput,
  CreateChatMessageInput,
  MessageSender,
  MessageType,
} from '../../domain/models/Chat';

function toSession(m: ChatSessionModel): ChatSession {
  return {
    id: m.id,
    sessionDate: m.sessionDate,
    title: m.title,
    summary: m.summary,
    isDaily: m.isDaily === 1,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

function toMessage(m: ChatMessageModel): ChatMessage {
  return {
    id: m.id,
    sessionId: m.sessionId,
    sender: m.sender as MessageSender,
    message: m.message,
    messageType: m.messageType as MessageType,
    actionType: m.actionType,
    actionPayload: m.actionPayload,
    isProcessed: m.isProcessed === 1,
    createdAt: m.createdAt.getTime(),
  };
}

export class ChatSessionRepository {
  private get collection() { return getDb().collections.get<ChatSessionModel>('chat_sessions'); }

  async getAll(): Promise<ChatSession[]> {
    const records = await this.collection
      .query(Q.sortBy('created_at', Q.desc))
      .fetch();
    return records.map(toSession);
  }

  async getByDate(date: string): Promise<ChatSession | null> {
    const records = await this.collection
      .query(Q.where('session_date', date))
      .fetch();
    return records.length > 0 ? toSession(records[0]) : null;
  }

  async getById(id: string): Promise<ChatSession | null> {
    try {
      const r = await this.collection.find(id);
      return toSession(r);
    } catch { return null; }
  }

  async create(input: CreateChatSessionInput): Promise<ChatSession> {
    const record = await getDb().write(async () =>
      this.collection.create(r => {
        r.sessionDate = input.sessionDate;
        r.title = input.title ?? null;
        r.summary = null;
        r.isDaily = input.isDaily ? 1 : 0;
      }),
    );
    return toSession(record);
  }

  async updateSummary(id: string, summary: string): Promise<void> {
    await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.summary = summary; });
    });
  }
}

export class ChatMessageRepository {
  private get collection() { return getDb().collections.get<ChatMessageModel>('chat_messages'); }

  async getBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const records = await this.collection
      .query(Q.where('session_id', sessionId), Q.sortBy('created_at', Q.asc))
      .fetch();
    return records.map(toMessage);
  }

  async getRecentBySessionId(sessionId: string, limit: number): Promise<ChatMessage[]> {
    const records = await this.collection
      .query(
        Q.where('session_id', sessionId),
        Q.sortBy('created_at', Q.desc),
        Q.take(limit),
      )
      .fetch();
    return records.map(toMessage).reverse();
  }

  async create(input: CreateChatMessageInput): Promise<ChatMessage> {
    const record = await getDb().write(async () =>
      this.collection.create(r => {
        r.sessionId = input.sessionId;
        r.sender = input.sender;
        r.message = input.message;
        r.messageType = input.messageType;
        r.actionType = input.actionType ?? null;
        r.actionPayload = input.actionPayload ?? null;
        r.isProcessed = 0;
      }),
    );
    return toMessage(record);
  }
}

export const chatSessionRepository = new ChatSessionRepository();
export const chatMessageRepository = new ChatMessageRepository();
