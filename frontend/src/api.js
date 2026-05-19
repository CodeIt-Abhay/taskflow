// Base URL: use env var in production, fall back to relative path (proxied by Vite dev server)
const rawBase = import.meta.env.VITE_API_URL || '';
const BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

// ── Token helpers ────────────────────────────────────────────────────────────
export const token = {
  get: () => localStorage.getItem('ttm_token'),
  set: (t) => localStorage.setItem('ttm_token', t),
  clear: () => localStorage.removeItem('ttm_token'),
};

// ── Request helper ────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const t = token.get();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  register: (name, email, password, role) =>
    request('/api/auth/register', { method: 'POST', body: { name, email, password, role } }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = {
  me: () => request('/api/users/me'),
  getAll: () => request('/api/users'),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projects = {
  getAll: () => request('/api/projects'),

  create: ({ name, description, memberIds }) =>
    request('/api/projects', { method: 'POST', body: { name, description, memberIds } }),

  delete: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasks = {
  getAll: () => request('/api/tasks'),

  create: ({ title, description, projectId, status, priority, assigneeId, dueDate }) =>
    request('/api/tasks', {
      method: 'POST',
      body: { title, description, projectId, status, priority, assigneeId, dueDate },
    }),

  update: (id, changes) =>
    request(`/api/tasks/${id}`, { method: 'PUT', body: changes }),

  delete: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
};
