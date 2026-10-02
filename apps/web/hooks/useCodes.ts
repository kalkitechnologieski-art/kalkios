// == KALKI B2 ENGINES ==
// Client hook: validate + apply a code at checkout.
// -----------------------------------------------------------------------------

'use client';

import { useCallback, useState } from 'react';

export interface CodeApplication {
  code: string;
  amount: number;
  type: string;
}

export function useCodes() {
  const [applied, setApplied] = useState<CodeApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (code: string, orderAmount: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount }),
      });
      const data = (await response.json()) as {
        valid?: boolean;
        reason?: string;
        discount?: { amount: number; type: string };
      };

      if (!response.ok || !data.valid) {
        setError(data.reason ?? 'Invalid code');
        setApplied(null);
        return null;
      }

      const result: CodeApplication = {
        code: code.toUpperCase(),
        amount: data.discount?.amount ?? 0,
        type: data.discount?.type ?? 'fixed',
      };
      setApplied(result);
      return result;
    } catch {
      setError('Could not validate code');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setApplied(null);
    setError(null);
  }, []);

  return { applied, loading, error, validate, clear };
}
