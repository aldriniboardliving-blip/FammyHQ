import { create } from 'zustand';
import { db } from '@/database/db';
import { generateId } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  familyId: string;
  senderId: string;
  message: string;
  messageType: string;
  mediaUrl: string | null;
  createdAt: string;
  senderName?: string;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  loadMessages: (familyId: string) => Promise<void>;
  sendMessage: (familyId: string, senderId: string, message: string) => Promise<ChatMessage>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,

  loadMessages: async (familyId: string) => {
    try {
      set({ isLoading: true });
      const results = db.getAllSync<ChatMessage & { senderName: string }>(
        `SELECT cm.*, u.displayName as senderName 
         FROM chat_messages cm 
         JOIN users u ON cm.senderId = u.id 
         WHERE cm.familyId = ? 
         ORDER BY cm.createdAt ASC`,
        [familyId]
      );
      set({ messages: results, isLoading: false });
    } catch (error) {
      console.error('Error loading messages:', error);
      set({ isLoading: false });
    }
  },

  sendMessage: async (familyId: string, senderId: string, message: string) => {
    const messageId = generateId('MSG');
    const now = new Date().toISOString();

    const chatMessage: ChatMessage = {
      id: messageId,
      familyId,
      senderId,
      message,
      messageType: 'text',
      mediaUrl: null,
      createdAt: now,
    };

    db.runSync(
      `INSERT INTO chat_messages (id, familyId, senderId, message, messageType, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [messageId, familyId, senderId, message, 'text', now]
    );

    set({ messages: [...get().messages, chatMessage] });
    return chatMessage;
  },
}));
