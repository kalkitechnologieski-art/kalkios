const AGNES_BASE = 'https://apihub.agnes-ai.com/v1';
const AGNES_API_KEY = process.env.AGNES_API_KEY || '';
if (!AGNES_API_KEY) console.warn('AGNES_API_KEY not set – Agnes provider will fail.');
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
export const agnesClient = {
  chat: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${AGNES_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AGNES_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Agnes chat error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Agnes chat failed: ${error.message}`);
    }
  },
  chatStream: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${AGNES_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AGNES_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, stream: true }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Agnes stream error ${resp.status}: ${text}`);
      }
      return resp.body;
    } catch (error) {
      throw new Error(`Agnes stream failed: ${error.message}`);
    }
  },
  image: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${AGNES_BASE}/images/generations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AGNES_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Agnes image error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Agnes image failed: ${error.message}`);
    }
  },
  video: async (body: any) => {
    try {
      const resp = await fetchWithTimeout(`${AGNES_BASE}/videos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AGNES_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Agnes video error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Agnes video failed: ${error.message}`);
    }
  },
  videoStatus: async (videoId: string, modelName: string) => {
    try {
      const resp = await fetchWithTimeout(`${AGNES_BASE}/agnesapi?video_id=${videoId}&model_name=${modelName}`, {
        headers: { 'Authorization': `Bearer ${AGNES_API_KEY}` },
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Agnes video status error ${resp.status}: ${text}`);
      }
      return resp.json();
    } catch (error) {
      throw new Error(`Agnes video status failed: ${error.message}`);
    }
  },
};
