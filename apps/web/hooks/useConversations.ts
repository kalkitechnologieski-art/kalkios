// == SIDDHI F1 ==
// React hook: conversation list, active conversation, CRUD, auto-titling.
// -----------------------------------------------------------------------------

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Conversation, ConversationMessage } from '@/lib/conversations/types';
import {
  loadLocalConversations,
  saveLocalConversations,
  getActiveConversationId,
  setActiveConversationId,
  createConversation,
  upsertConversation,
  deleteConversation as removeFromList,
  renameConversation as renameInList,
  findConversation,
  computePreview,
  pushConversationToSupabase,
  deleteConversationFromSupabase,
} from '@/lib/conversations/store';
import { generateConversationTitle } from '@/lib/conversations/auto-title';

export interface UseConversationsReturn {
  ready: boolean;
  list: Conversation[];
  active: Conversation | null;
  createNew: () => Conversation;
  selectConversation: (id: string) => Conversation | null;
  renameActive: (title: string) => void;
  deleteActive: () => void;
  deleteById: (id: string) => void;
  appendMessages: (messages: ConversationMessage[]) => void;
  replaceMessages: (messages: ConversationMessage[]) => void;
  maybeAutoTitle: () => Promise<void>;
  clearActive: () => void;
}

export function useConversations(): UseConversationsReturn {
  const [ready, setReady] = useState(false);
  const [list, setList] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const titleInFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loaded = loadLocalConversations();
    const storedId = getActiveConversationId();

    if (loaded.length === 0) {
      const first = createConversation();
      setList([first]);
      setActiveId(first.id);
      setActiveConversationId(first.id);
      saveLocalConversations([first]);
    } else {
      setList(loaded);
      const target = storedId && findConversation(loaded, storedId) ? storedId : loaded[0]!.id;
      setActiveId(target);
      setActiveConversationId(target);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveLocalConversations(list);
  }, [list, ready]);

  useEffect(() => {
    if (!ready) return;
    setActiveConversationId(activeId);
  }, [activeId, ready]);

  const active = useMemo(
    () => (activeId ? findConversation(list, activeId) ?? null : null),
    [list, activeId]
  );

  const createNew = useCallback((): Conversation => {
    const convo = createConversation();
    setList((prev) => upsertConversation(prev, convo));
    setActiveId(convo.id);
    return convo;
  }, []);

  const selectConversation = useCallback(
    (id: string): Conversation | null => {
      const found = findConversation(list, id);
      if (!found) return null;
      setActiveId(id);
      return found;
    },
    [list]
  );

  const renameActive = useCallback(
    (title: string) => {
      if (!activeId) return;
      const trimmed = title.trim() || 'Untitled';
      setList((prev) => {
        const next = renameInList(prev, activeId, trimmed);
        const convo = findConversation(next, activeId);
        if (convo) void pushConversationToSupabase(convo);
        return next;
      });
    },
    [activeId]
  );

  const deleteActive = useCallback(() => {
    if (!activeId) return;
    const id = activeId;
    setList((prev) => {
      const next = removeFromList(prev, id);
      if (next.length === 0) {
        const fresh = createConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      setActiveId(next[0]!.id);
      return next;
    });
    void deleteConversationFromSupabase(id);
  }, [activeId]);

  const deleteById = useCallback(
    (id: string) => {
      if (id === activeId) { deleteActive(); return; }
      setList((prev) => removeFromList(prev, id));
      void deleteConversationFromSupabase(id);
    },
    [activeId, deleteActive]
  );

  const appendMessages = useCallback(
    (messages: ConversationMessage[]) => {
      if (!activeId) return;
      setList((prev) => {
        const convo = findConversation(prev, activeId);
        if (!convo) return prev;
        const merged = [...convo.messages, ...messages];
        const updated: Conversation = {
          ...convo,
          messages: merged,
          messageCount: merged.length,
          preview: computePreview(merged),
          updatedAt: Date.now(),
        };
        void pushConversationToSupabase(updated);
        return upsertConversation(prev, updated);
      });
    },
    [activeId]
  );

  const replaceMessages = useCallback(
    (messages: ConversationMessage[]) => {
      if (!activeId) return;
      setList((prev) => {
        const convo = findConversation(prev, activeId);
        if (!convo) return prev;
        const updated: Conversation = {
          ...convo,
          messages,
          messageCount: messages.length,
          preview: computePreview(messages),
          updatedAt: Date.now(),
        };
        void pushConversationToSupabase(updated);
        return upsertConversation(prev, updated);
      });
    },
    [activeId]
  );

  const maybeAutoTitle = useCallback(async () => {
    if (!activeId) return;
    const current = findConversation(list, activeId);
    if (!current) return;
    if (current.autoTitled) return;
    if (titleInFlight.current.has(activeId)) return;

    const firstUser = current.messages.find((m) => m.role === 'user');
    const firstAssistant = current.messages.find((m) => m.role === 'assistant');
    if (!firstUser || !firstAssistant) return;

    titleInFlight.current.add(activeId);
    try {
      const { title, autoTitled } = await generateConversationTitle({
        userMessage: firstUser.content,
        assistantReply: firstAssistant.content,
      });

      setList((prev) => {
        const convo = findConversation(prev, activeId);
        if (!convo) return prev;
        if (!convo.autoTitled && convo.title !== 'New chat') return prev;
        const updated: Conversation = { ...convo, title, autoTitled, updatedAt: Date.now() };
        void pushConversationToSupabase(updated);
        return upsertConversation(prev, updated);
      });
    } finally {
      titleInFlight.current.delete(activeId);
    }
  }, [activeId, list]);

  const clearActive = useCallback(() => {
    if (!activeId) return;
    setList((prev) => {
      const convo = findConversation(prev, activeId);
      if (!convo) return prev;
      const updated: Conversation = {
        ...convo, messages: [], messageCount: 0, preview: '', updatedAt: Date.now(),
      };
      return upsertConversation(prev, updated);
    });
  }, [activeId]);

  return {
    ready, list, active,
    createNew, selectConversation, renameActive, deleteActive, deleteById,
    appendMessages, replaceMessages, maybeAutoTitle, clearActive,
  };
}
