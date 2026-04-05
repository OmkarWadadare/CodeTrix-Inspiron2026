const API_BASE = '/api';

async function fetchApi(url, options = {}) {
  console.log(`[API] ${options.method || 'GET'} ${url}`, options.body || '');
  try {
    const res = await fetch(url, options);
    console.log(`[API] Response status: ${res.status}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`[API] Error:`, errData);
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }
    const data = await res.json();
    console.log(`[API] Response data:`, data);
    return data;
  } catch (err) {
    console.error(`[API] Fetch failed for ${url}:`, err.message);
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Make sure the backend is running on http://127.0.0.1:8000');
    }
    throw err;
  }
}

export const apiService = {
  healthCheck: async () => {
    return fetchApi(`${API_BASE.replace('/api', '')}/api/`);
  },

  uploadDocument: async (file) => {
    console.log(`[API] Uploading file: ${file.name} (${file.size} bytes)`);
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi(`${API_BASE}/upload`, { method: 'POST', body: formData });
  },

  translateText: async (segments, targetLang = 'french', tone = 'neutral', sourceLang = 'english') => {
    return fetchApi(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments, target_lang: targetLang, source_lang: sourceLang, tone }),
    });
  },

  translateDocument: async (sessionId, fileType, segments, targetLang = 'french', tone = 'neutral', sourceLang = 'english') => {
    return fetchApi(`${API_BASE}/translate-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, file_type: fileType, segments, target_lang: targetLang, source_lang: sourceLang, tone }),
    });
  },

  downloadFile: async (sessionId, ext) => {
    return `${API_BASE}/download/${sessionId}/${ext}`;
  },

  validateText: async (segments) => {
    return fetchApi(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments }),
    });
  },

  getAuditLog: async (limit = 50) => {
    return fetchApi(`${API_BASE}/audit-log?limit=${limit}`);
  },

  getGlossary: async (sourceLang = 'en', targetLang = 'fr') => {
    return fetchApi(`${API_BASE}/glossary/${sourceLang}/${targetLang}`);
  },

  addGlossaryEntry: async (entry) => {
    return fetchApi(`${API_BASE}/glossary/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  },

  deleteGlossaryEntry: async (termId) => {
    return fetchApi(`${API_BASE}/glossary/${termId}`, { method: 'DELETE' });
  },

  getOrganizationData: async () => {
    const [auditRes, glossaryRes] = await Promise.all([
      fetch(`${API_BASE}/audit-log?limit=100`),
      fetch(`${API_BASE}/glossary/en/fr`),
    ]);
    const audit = auditRes.ok ? await auditRes.json() : { logs: [] };
    const glossary = glossaryRes.ok ? await glossaryRes.json() : { glossary: [] };
    return {
      orgName: 'CodeTrix',
      teamCount: 3,
      glossary: glossary.glossary.map((g, i) => ({ id: i + 1, term: g.source, definition: g.target })),
      team: [
        { id: 101, name: 'Omkar Wadadare', role: 'Owner', docs: 45, status: 'Active', access: 'Admin' },
        { id: 102, name: 'Tejaswini Bista', role: 'Editor', docs: 21, status: 'Away', access: 'Edit' },
        { id: 103, name: 'Arwa Saluji', role: 'Reviewer', docs: 14, status: 'Active', access: 'View' },
      ],
      analytics: [
        { month: 'Jan', documents: 30, characters: 15400 },
        { month: 'Feb', documents: 45, characters: 23100 },
        { month: 'Mar', documents: 38, characters: 18900 },
        { month: 'Apr', documents: 60, characters: 34500 },
      ],
      auditLogs: audit.logs || [],
    };
  },
};
