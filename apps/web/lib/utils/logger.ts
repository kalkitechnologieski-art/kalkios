// ═══ SIDDHI v4.0 BATCH 1 ═══
// Isomorphic structured logger.
//
// • No static import of `node:async_hooks` — safe for Turbopack client graphs.
// • On the server, `AsyncLocalStorage` is loaded lazily at runtime for
//   correlation IDs that survive async boundaries.
// • In the browser, correlation IDs are best-effort (module-scoped stack).
// • Variadic API compatible with Pino/Winston/console call patterns.
// ─────────────────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  layer?: string;
  durationMs?: number;
  outcome?: 'success' | 'failure' | 'retry' | 'circuit-open';
  error?: { name: string; message: string; stack?: string };
  meta?: Record<string, unknown>;
}

export interface RequestContext {
  correlationId: string;
  sessionId?: string;
  userId?: string;
  startedAt: number;
  layer: string;
  path: string;
}

// ─── Async context provider (isomorphic, lazy) ───────────────────
interface ContextStore {
  run<R>(store: RequestContext, fn: () => R): R;
  getStore(): RequestContext | undefined;
}

interface AsyncHooksModule {
  AsyncLocalStorage: new <T>() => {
    run<R>(store: T, fn: () => R): R;
    getStore(): T | undefined;
  };
}

// Obfuscate the module ID so bundlers cannot statically resolve it.
const ASYNC_HOOKS_ID = ['node', 'async_hooks'].join(':');

let _store: ContextStore | null | undefined = undefined;

function getContextStore(): ContextStore | null {
  if (_store !== undefined) return _store;

  // Browser: skip ALS entirely
  if (typeof window !== 'undefined') {
    _store = null;
    return null;
  }

  // Attempt 1 — Node 22+ `process.getBuiltinModule` (ESM + CJS safe)
  try {
    const g = globalThis as unknown as {
      process?: { getBuiltinModule?: (id: string) => unknown };
    };
    const mod = g.process?.getBuiltinModule?.(ASYNC_HOOKS_ID) as AsyncHooksModule | undefined;
    if (mod?.AsyncLocalStorage) {
      _store = new mod.AsyncLocalStorage() as unknown as ContextStore;
      return _store;
    }
  } catch { /* continue */ }

  // Attempt 2 — global require (CJS runtime)
  try {
    const g = globalThis as unknown as { require?: (id: string) => unknown };
    if (typeof g.require === 'function') {
      const mod = g.require(ASYNC_HOOKS_ID) as AsyncHooksModule | undefined;
      if (mod?.AsyncLocalStorage) {
        _store = new mod.AsyncLocalStorage() as unknown as ContextStore;
        return _store;
      }
    }
  } catch { /* continue */ }

  // Attempt 3 — Function constructor (opaque to bundlers)
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const loader = new Function('id', 'try { return require(id); } catch { return null; }');
    const mod = loader(ASYNC_HOOKS_ID) as AsyncHooksModule | null;
    if (mod?.AsyncLocalStorage) {
      _store = new mod.AsyncLocalStorage() as unknown as ContextStore;
      return _store;
    }
  } catch { /* continue */ }

  // Fallback — no correlation context
  _store = null;
  return null;
}

// ─── Public context API ──────────────────────────────────────────
export function runWithContext<T>(ctx: Partial<RequestContext>, fn: () => T): T {
  const store = getContextStore();
  const full: RequestContext = {
    correlationId: ctx.correlationId ?? defaultId(),
    sessionId: ctx.sessionId,
    userId: ctx.userId,
    startedAt: ctx.startedAt ?? Date.now(),
    layer: ctx.layer ?? 'unknown',
    path: ctx.path ?? '/',
  };
  if (!store) return fn();
  return store.run(full, fn);
}

export function getContext(): RequestContext | undefined {
  return getContextStore()?.getStore();
}

export function withLayer<T>(layer: string, fn: () => T): T {
  const store = getContextStore();
  const current = store?.getStore();
  if (!store || !current) return fn();
  return store.run({ ...current, layer }, fn);
}

function defaultId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Argument normalization ──────────────────────────────────────
function toMeta(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (Array.isArray(value)) return { array: value };
  return { value };
}

function safeStringify(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
  try { return JSON.stringify(v); } catch { return String(v); }
}

interface NormalizedArgs {
  msg: string;
  meta?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
}

function normalizeArgs(args: unknown[]): NormalizedArgs {
  if (args.length === 0) return { msg: '' };

  let msg: string;
  let rest: unknown[];

  if (typeof args[0] === 'string') { msg = args[0]; rest = args.slice(1); }
  else if (args[0] instanceof Error) { msg = args[0].message; rest = args.slice(1); }
  else { msg = safeStringify(args[0]); rest = args.slice(1); }

  if (rest.length === 0) return { msg };

  let error: NormalizedArgs['error'];
  const metaAccumulator: Record<string, unknown> = {};
  let primitiveIdx = 0;

  for (const arg of rest) {
    if (arg instanceof Error && !error) {
      error = {
        name: arg.name,
        message: arg.message,
        stack: arg.stack?.split('\n').slice(0, 6).join('\n'),
      };
      continue;
    }
    if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
      Object.assign(metaAccumulator, toMeta(arg));
      continue;
    }
    primitiveIdx += 1;
    metaAccumulator[`arg${primitiveIdx}`] = arg;
  }

  const meta = Object.keys(metaAccumulator).length > 0 ? metaAccumulator : undefined;
  return { msg, meta, error };
}

// ─── Structured logger ───────────────────────────────────────────
class StructuredLogger {
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly MAX_BUFFER = 100;
  private readonly FLUSH_MS = 5_000;

  private emit(entry: LogEntry): void {
    const ctx = getContext();
    if (ctx && !entry.correlationId) {
      entry.correlationId = ctx.correlationId;
      if (ctx.sessionId && !entry.sessionId) entry.sessionId = ctx.sessionId;
      if (ctx.userId && !entry.userId) entry.userId = ctx.userId;
      if (ctx.layer && !entry.layer) entry.layer = ctx.layer;
    }

    if (process.env.NODE_ENV !== 'production') {
      const color: Record<LogLevel, string> = {
        debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m',
        error: '\x1b[31m', fatal: '\x1b[35m',
      };
      const parts: unknown[] = [entry.msg];
      if (entry.error) parts.push(entry.error);
      if (entry.meta) parts.push(entry.meta);
      // eslint-disable-next-line no-console
      console.log(`${color[entry.level]}[${entry.level.toUpperCase()}]\x1b[0m`, ...parts);
    }

    this.buffer.push(entry);
    if (this.buffer.length >= this.MAX_BUFFER) void this.flush();
    else if (!this.flushTimer) this.flushTimer = setTimeout(() => void this.flush(), this.FLUSH_MS);
  }

  async flush(): Promise<void> {
    if (this.flushTimer) { clearTimeout(this.flushTimer); this.flushTimer = null; }
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);
    if (typeof window !== 'undefined') return; // never ship from browser
    try {
      const mod = await import('@/lib/supabase/client');
      const supabase = mod.createClient() as unknown as {
        from: (t: string) => { insert: (rows: unknown[]) => Promise<unknown> };
      };
      await supabase.from('siddhi_logs').insert(batch);
    } catch { /* best-effort */ }
  }

  debug(...args: unknown[]): void {
    const n = normalizeArgs(args);
    this.emit({ ts: new Date().toISOString(), level: 'debug', msg: n.msg, error: n.error, meta: n.meta });
  }
  info(...args: unknown[]): void {
    const n = normalizeArgs(args);
    this.emit({ ts: new Date().toISOString(), level: 'info', msg: n.msg, error: n.error, meta: n.meta });
  }
  warn(...args: unknown[]): void {
    const n = normalizeArgs(args);
    this.emit({ ts: new Date().toISOString(), level: 'warn', msg: n.msg, error: n.error, meta: n.meta });
  }
  error(...args: unknown[]): void {
    const n = normalizeArgs(args);
    this.emit({ ts: new Date().toISOString(), level: 'error', msg: n.msg, error: n.error, meta: n.meta });
  }
  fatal(...args: unknown[]): void {
    const n = normalizeArgs(args);
    this.emit({ ts: new Date().toISOString(), level: 'fatal', msg: n.msg, error: n.error, meta: n.meta });
    void this.flush();
  }

  child(ctx: Partial<LogEntry>) {
    const self = this;
    const base = ctx;
    return {
      debug: (...a: unknown[]) => { const n = normalizeArgs(a); self.emit({ ts: new Date().toISOString(), level: 'debug', ...base, msg: n.msg, error: n.error, meta: n.meta }); },
      info:  (...a: unknown[]) => { const n = normalizeArgs(a); self.emit({ ts: new Date().toISOString(), level: 'info',  ...base, msg: n.msg, error: n.error, meta: n.meta }); },
      warn:  (...a: unknown[]) => { const n = normalizeArgs(a); self.emit({ ts: new Date().toISOString(), level: 'warn',  ...base, msg: n.msg, error: n.error, meta: n.meta }); },
      error: (...a: unknown[]) => { const n = normalizeArgs(a); self.emit({ ts: new Date().toISOString(), level: 'error', ...base, msg: n.msg, error: n.error, meta: n.meta }); },
      fatal: (...a: unknown[]) => { const n = normalizeArgs(a); self.emit({ ts: new Date().toISOString(), level: 'fatal', ...base, msg: n.msg, error: n.error, meta: n.meta }); },
    };
  }
}

export const logger = new StructuredLogger();

export const log = {
  debug: (...a: unknown[]) => logger.debug(...a),
  info:  (...a: unknown[]) => logger.info(...a),
  warn:  (...a: unknown[]) => logger.warn(...a),
  error: (...a: unknown[]) => logger.error(...a),
};
