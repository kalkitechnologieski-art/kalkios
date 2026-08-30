const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
if (!GROQ_API_KEY) console.warn('GROQ_API_KEY not set – Groq provider will fail.');
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
export const groqClient = {
  chat: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, model: 'llama-3.3-70b-versatile' }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Groq error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Groq chat failed: ${error.message}`);
    }
  },
  chatStream: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, model: 'llama-3.3-70b-versatile', stream: true }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Groq stream error ${resp.status}: ${text}`);
      }
      return resp.body;
    } catch (error) {
      throw new Error(`Groq stream failed: ${error.message}`);
    }
  },
};
