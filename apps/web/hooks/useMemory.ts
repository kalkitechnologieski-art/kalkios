// == SIDDHI v4.0 BATCH 3 v3.6 ==
// Cross-device memory: IndexedDB (fast, local) + Supabase (sync).
// Type at the boundary is intentionally permissive (any[]) so this hook
// composes cleanly with any message shape (ChatMessage, MemoryMessage, etc.).
// ---------------------------------------------------------------------------

'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useAuth';

const DB_NAME = 'SiddhiMemory';
const DB_VERSION = 2;
const STORE = 'conversations';
const DEFAULT_SESSION = 'default';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MemoryMessage = any;

interface StoredConversation {
  sessionId: string;
  messages: MemoryMessage[];
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no-indexeddb'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'sessionId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIndexedDB(sessionId: string): Promise<MemoryMessage[] | null> {
  try {
    const db = await openDB();
    return await new Promise<MemoryMessage[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const get = tx.objectStore(STORE).get(sessionId);
      get.onsuccess = () => {
        const result = get.result as StoredConversation | undefined;
        resolve(result?.messages ?? null);
      };
      get.onerror = () => reject(get.error);
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(sessionId: string, messages: MemoryMessage[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ sessionId, messages, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* silent */
  }
}

async function clearFromIndexedDB(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(sessionId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* silent */
  }
}

export function useMemory() {
  const { user } = useUser();

  const loadMemory = useCallback(
    async (sessionId: string = DEFAULT_SESSION): Promise<MemoryMessage[]> => {
      const local = await loadFromIndexedDB(sessionId);
      if (local && local.length > 0) return local;

      if (user) {
        try {
          const supabase = createClient() as unknown as {
            from: (t: string) => {
              select: (c: string) => {
                eq: (c: string, v: unknown) => {
                  eq: (c: string, v: unknown) => {
                    order: (c: string, opts: { ascending: boolean }) => {
                      limit: (n: number) => Promise<{ data?: MemoryMessage[] | null }>;
                    };
                  };
                };
              };
            };
          };
          const { data } = await supabase
            .from('siddhi_memory')
            .select('*')
            .eq('user_id', user.id)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(100);
          if (data && data.length > 0) {
            await saveToIndexedDB(sessionId, data);
            return data;
          }
        } catch {
          /* table may not exist yet */
        }
      }
      return [];
    },
    [user]
  );

  const saveMemory = useCallback(
    async (messages: MemoryMessage[], sessionId: string = DEFAULT_SESSION): Promise<void> => {
      await saveToIndexedDB(sessionId, messages);

      if (user) {
        try {
          const supabase = createClient() as unknown as {
            from: (t: string) => { upsert: (rows: unknown[]) => Promise<unknown> };
          };
          const recent = messages.slice(-20).map((m) => ({
            user_id: user.id,
            session_id: sessionId,
            role: (m && typeof m === 'object' && 'role' in m && typeof m.role === 'string')
              ? m.role
              : 'assistant',
            content: (m && typeof m === 'object' && 'content' in m && typeof m.content === 'string')
              ? m.content
              : '',
            metadata: {},
          }));
          await supabase.from('siddhi_memory').upsert(recent);
        } catch {
          /* silent */
        }
      }
    },
    [user]
  );

  const clearMemory = useCallback(
    async (sessionId: string = DEFAULT_SESSION): Promise<void> => {
      await clearFromIndexedDB(sessionId);
    },
    []
  );

  return { loadMemory, saveMemory, clearMemory };
}
