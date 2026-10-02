// == SIDDHI v4.0 BATCH 3 v4.1 ==
// Auth context provider - JSX-free (.ts file).
// AuthUser is re-exported from @supabase/supabase-js so all downstream
// consumers see the authoritative schema (created_at: string,
// user_metadata: UserMetadata, etc.).
// -----------------------------------------------------------------------------

'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// Re-export the authoritative User type. Never redefine it.
export type AuthUser = User;

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthState | null>(null);

interface SupabaseAuthClient {
  auth: {
    getUser(): Promise<{ data: { user: User | null } }>;
    onAuthStateChange(
      cb: (event: string, session: Session | null) => void
    ): { data: { subscription?: { unsubscribe?: () => void } } };
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    let supabase: SupabaseAuthClient;
    try {
      supabase = createClient() as unknown as SupabaseAuthClient;
    } catch (error) {
      setState({ user: null, loading: false, error: error as Error });
      return () => {
        mountedRef.current = false;
      };
    }

    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (mountedRef.current) setState({ user: data.user, loading: false, error: null });
      } catch (error) {
        if (mountedRef.current) setState({ user: null, loading: false, error: error as Error });
      }
    };
    void getUser();

    let listener: { data?: { subscription?: { unsubscribe?: () => void } } } | undefined;
    if (typeof supabase.auth.onAuthStateChange === 'function') {
      listener = supabase.auth.onAuthStateChange((_event, session) => {
        if (mountedRef.current) {
          setState({ user: session?.user ?? null, loading: false, error: null });
        }
      });
    }

    return () => {
      mountedRef.current = false;
      listener?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  return createElement(AuthContext.Provider, { value: state }, children);
}

export function useUser(): AuthState {
  const ctx = useContext(AuthContext);
  const [fallback, setFallback] = useState<AuthState>({ user: null, loading: true, error: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (ctx) {
      return () => {
        mountedRef.current = false;
      };
    }

    let supabase: SupabaseAuthClient | null = null;
    try {
      supabase = createClient() as unknown as SupabaseAuthClient;
    } catch (error) {
      setFallback({ user: null, loading: false, error: error as Error });
      return () => {
        mountedRef.current = false;
      };
    }

    const getUser = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase.auth.getUser();
        if (mountedRef.current) setFallback({ user: data.user, loading: false, error: null });
      } catch (error) {
        if (mountedRef.current) setFallback({ user: null, loading: false, error: error as Error });
      }
    };
    void getUser();

    let listener: { data?: { subscription?: { unsubscribe?: () => void } } } | undefined;
    if (supabase && typeof supabase.auth.onAuthStateChange === 'function') {
      listener = supabase.auth.onAuthStateChange((_event, session) => {
        if (mountedRef.current) {
          setFallback({ user: session?.user ?? null, loading: false, error: null });
        }
      });
    }

    return () => {
      mountedRef.current = false;
      listener?.data?.subscription?.unsubscribe?.();
    };
  }, [ctx]);

  return useMemo(() => ctx ?? fallback, [ctx, fallback]);
}

export function useAuthActions() {
  return {
    signOut: useCallback(async () => {
      try {
        const supabase = createClient() as unknown as {
          auth: { signOut(): Promise<void> };
        };
        await supabase.auth.signOut();
      } catch {
        /* silent */
      }
    }, []),
  };
}
