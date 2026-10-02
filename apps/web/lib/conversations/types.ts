// == SIDDHI F1 ==
// Conversation model — one per chat thread.
// -----------------------------------------------------------------------------

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  traces?: Array<{ id?: string; type?: string; status?: string; message?: string; duration?: number }>;
  artifacts?: Array<{ type: string; language?: string; title: string; content: string }>;
  toolCalls?: Array<{ name: string; args: unknown; result: unknown }>;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  autoTitled: boolean;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview: string;
  messages: ConversationMessage[];
}

export const STORAGE_KEY = 'siddhi_conversations_v1';
export const ACTIVE_CONVERSATION_KEY = 'siddhi_active_conversation_id';
export const MAX_TITLE_LENGTH = 60;
