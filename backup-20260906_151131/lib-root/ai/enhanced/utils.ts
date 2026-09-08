// lib/ai/enhanced/utils.ts
// SSR-safe utilities with environment detection

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export function isSSR(): boolean {
  return !isBrowser;
}

export function safeFileToBase64(file: File): Promise<string> {
  if (!isBrowser) {
    throw new Error('FileReader is only available in browser environment');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function generateId(): string {
  if (isBrowser && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Node.js fallback
  if (typeof require === 'function') {
    try {
      const crypto = require('crypto');
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  // Final fallback
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function createHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: string[],
  fieldMap: Record<string, keyof T>
): string {
  if (!data.length) return 'No data found.';
  
  const rows = data.map(item => 
    headers.map(h => {
      const key = fieldMap[h];
      const val = key ? String(item[key] ?? '') : '';
      return escapeCSVField(val);
    })
  );
  
  const bom = '\uFEFF';
  const headerRow = headers.map(h => escapeCSVField(h)).join(',');
  const dataRows = rows.map(row => row.join(','));
  
  return bom + [headerRow, ...dataRows].join('\n');
}
