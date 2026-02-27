import { create } from 'zustand';
import type { ChatSession, ChatMessage } from '../../../domain/models/Chat';
import { getChatSessions, getSessionMessages, getOrCreateTodaySession } from '../../../domain/usecases/chat/GetChatSessionsUseCase';
import { sendMessage } from '../../../domain/usecases/chat/SendMessageUseCase';

interface ChatState {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;

  loadSessions: () => Promise<void>;
  openSession: (sessionId: string) => Promise<void>;
  openTodaySession: () => Promise<void>;
  send: (text: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSession: null,
  messages: [],
  loading: false,
  sending: false,
  error: null,

  async loadSessions() {
    set({ loading: true, error: null });
    try {
      const sessions = await getChatSessions();
      set({ sessions, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  async openSession(sessionId: string) {
    set({ loading: true, error: null });
    try {
      const messages = await getSessionMessages(sessionId);
      const active = get().sessions.find(s => s.id === sessionId) ?? null;
      set({ activeSession: active, messages, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  async openTodaySession() {
    set({ loading: true, error: null });
    try {
      const session = await getOrCreateTodaySession();
      const messages = await getSessionMessages(session.id);
      set({ activeSession: session, messages, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  async send(text: string) {
    const { activeSession, messages } = get();
    if (!activeSession || !text.trim()) return;

    set({ sending: true, error: null });
    try {
      const { userMessage, aiMessage } = await sendMessage(activeSession.id, text.trim());
      set({ messages: [...messages, userMessage, aiMessage], sending: false });
    } catch (e) {
      set({ sending: false, error: String(e) });
    }
  },
}));
