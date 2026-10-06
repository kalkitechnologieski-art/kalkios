'use client';

import { useState, useCallback, useRef } from 'react';

interface NetworkState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export function useNetworkRecovery<T>() {
  const [state, setState] = useState<NetworkState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (
      fn: (signal: AbortSignal) => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T | null> => {
      const { maxRetries = 3, backoffMs = 1000, onRetry } = options;

      // Cancel previous request if running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (controller.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        try {
          const data = await fn(controller.signal);
          setState({
            data,
            loading: false,
            error: null,
            retryCount: attempt,
          });
          return data;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          // Don't retry on client errors (4xx)
          const isClientError =
            'status' in (err as any) &&
            (err as any).status >= 400 &&
            (err as any).status < 500;

          if (isClientError || attempt === maxRetries) {
            break;
          }

          // Wait before retry with exponential backoff
          const waitTime = backoffMs * Math.pow(2, attempt);
          onRetry?.(attempt + 1, lastError);

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      setState({
        data: null,
        loading: false,
        error: lastError,
        retryCount: maxRetries,
      });

      return null;
    },
    []
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
    });
  }, []);

  const retry = useCallback(
    (fn: (signal: AbortSignal) => Promise<T>, options?: RetryOptions) => {
      return execute(fn, options);
    },
    [execute]
  );

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: !!state.error && !state.loading,
  };
}

// Helper to detect offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }

  return isOnline;
}
