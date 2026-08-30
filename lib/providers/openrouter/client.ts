const OR_BASE = 'https://openrouter.ai/api/v1';
const OR_API_KEY = process.env.OPENROUTER_API_KEY || '';
if (!OR_API_KEY) console.warn('OPENROUTER_API_KEY not set – OpenRouter provider will fail.');
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
export const openRouterClient = {
  chat: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${OR_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OR_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, model: 'meta-llama/llama-3.2-3b-instruct:free' }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OpenRouter error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`OpenRouter chat failed: ${error.message}`);
    }
  },
  chatStream: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${OR_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OR_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, model: 'meta-llama/llama-3.2-3b-instruct:free', stream: true }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OpenRouter stream error ${resp.status}: ${text}`);
      }
      return resp.body;
    } catch (error) {
      throw new Error(`OpenRouter stream failed: ${error.message}`);
    }
  },
};
