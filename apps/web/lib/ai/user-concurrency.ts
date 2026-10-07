// Per-user concurrent stream counter. Holds active AI requests in-memory
// across hot reloads via a global Symbol so a single user can't overwhelm the
// free-tier providers by spamming the same endpoint.

const ACTIVE_KEY = Symbol.for('kalkicore:ai-stream-active');
const MAX_PER_USER = 3;

type ActiveMap = Map<string, number>;
const g = globalThis as unknown as { [ACTIVE_KEY]?: ActiveMap };
const active: ActiveMap = g[ACTIVE_KEY] ?? (g[ACTIVE_KEY] = new Map<string, number>());

export interface AcquireHandle {
  release: () => void;
  active: number;
  max: number;
}

export function tryAcquireUserStream(userId: string): AcquireHandle | { busy: true; active: number; max: number } {
  const current = active.get(userId) ?? 0;
  if (current >= MAX_PER_USER) {
    return { busy: true, active: current, max: MAX_PER_USER };
  }
  active.set(userId, current + 1);
  let released = false;
  return {
    active: current + 1,
    max: MAX_PER_USER,
    release() {
      if (released) return;
        released = true;
        const next = (active.get(userId) ?? 1) - 1;
        if (next <= 0) active.delete(userId);
        else active.set(userId, next);
      },
  };
}

export const MAX_USER_STREAMS = MAX_PER_USER;