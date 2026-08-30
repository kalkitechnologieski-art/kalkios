const ZHIPU_BASE = 'https://api.z.ai/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';
if (!ZHIPU_API_KEY) console.warn('ZHIPU_API_KEY not set – Zhipu provider will fail.');
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
export const zhipuClient = {
  chat: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${ZHIPU_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ZHIPU_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Zhipu chat error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Zhipu chat failed: ${error.message}`);
    }
  },
  webSearch: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${ZHIPU_BASE}/web_search`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ZHIPU_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Zhipu web search error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Zhipu web search failed: ${error.message}`);
    }
  },
  webReader: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${ZHIPU_BASE}/reader`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ZHIPU_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Zhipu web reader error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Zhipu web reader failed: ${error.message}`);
    }
  },
};
