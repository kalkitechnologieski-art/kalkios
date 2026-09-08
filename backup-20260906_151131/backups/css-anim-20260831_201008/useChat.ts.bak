import { useState, useCallback } from 'react';
import { chat } from '@/lib/ai';
import { ChatMessage } from '@/lib/ai/types';

export function useChat() {
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = useCallback(async (
    text: string,
    options: {
      deep?: boolean;
      search?: boolean;
      image?: boolean;
      video?: boolean;
      sessionId?: string;
    } = {}
  ) => {
    setIsProcessing(true);
    try {
      const messages: ChatMessage[] = [
        { role: 'user', content: text }
      ];
      const response = await chat(messages, {
        deep: options.deep || false,
        stream: false,
        ...(options.sessionId && { sessionId: options.sessionId }),
      });
      return response;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { sendMessage, isProcessing };
}
