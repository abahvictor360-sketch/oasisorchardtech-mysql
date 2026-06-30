// ── API client — replaces @supabase/supabase-js ───────────────
const BASE = '/api';

async function req(path, options = {}) {
  const token = localStorage.getItem('oasis_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...headers, ...options.headers },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  const error = res.ok ? null : { message: data?.error || 'Request failed', status: res.status };
  return { data, error };
}

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  async signInWithPassword({ email, password }) {
    const { data, error } = await req('/auth/login', { method: 'POST', body: { email, password } });
    if (!error && data?.token) localStorage.setItem('oasis_token', data.token);
    return { data, error };
  },

  async signUp(email, password, metadata) {
    return req('/auth/signup', { method: 'POST', body: { email, password, metadata } });
  },

  async signOut() {
    await req('/auth/logout', { method: 'POST' });
    localStorage.removeItem('oasis_token');
    return { error: null };
  },

  async getSession() {
    const token = localStorage.getItem('oasis_token');
    if (!token) return { data: { session: null }, error: null };
    const { data, error } = await req('/auth/me');
    if (error) return { data: { session: null }, error };
    return { data: { session: { user: data.user } }, error: null };
  },

  async getUser() {
    const { data, error } = await req('/auth/me');
    return { data: error ? { user: null } : data, error };
  },

  // Compatibility shim — immediate callback on mount, no real subscription
  onAuthStateChange(callback) {
    const token = localStorage.getItem('oasis_token');
    if (token) {
      req('/auth/me').then(({ data, error }) => {
        if (!error && data?.user) callback('SIGNED_IN', { user: data.user });
        else callback('SIGNED_OUT', null);
      });
    } else {
      callback('SIGNED_OUT', null);
    }
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ── Profiles ──────────────────────────────────────────────────
export const profiles = {
  get:    (id) => req(`/profiles/${id}`),
  update: (id, updates) => req(`/profiles/${id}`, { method: 'PUT', body: updates }),
};

// ── Products ──────────────────────────────────────────────────
export const products = {
  list:    ()         => req('/products'),
  listAll: ()         => req('/products?all=1'),
  create:  (data)     => req('/products', { method: 'POST', body: data }),
  update:  (id, data) => req(`/products/${id}`, { method: 'PUT', body: data }),
  toggle:  (id)       => req(`/products/${id}/toggle`, { method: 'PATCH' }),
  remove:  (id)       => req(`/products/${id}`, { method: 'DELETE' }),
};

// ── Content / Settings ────────────────────────────────────────
export const content = {
  get:          (key)        => req(`/content/${key}`),
  save:         (key, value) => req(`/content/${key}`, { method: 'PUT', body: { content: value } }),
  listByPrefix: (prefix)     => req(`/content?prefix=${encodeURIComponent(prefix)}`),
  remove:       (key)        => req(`/content/${key}`, { method: 'DELETE' }),
};

// ── Users (admin) ─────────────────────────────────────────────
export const users = {
  list:   ()         => req('/users'),
  update: (id, data) => req(`/users/${id}`, { method: 'PUT', body: data }),
  remove: (id)       => req(`/users/${id}`, { method: 'DELETE' }),
};

// ── Wallet ────────────────────────────────────────────────────
export const wallet = {
  transactions: (uid) => req(`/wallet/${uid}`),
  credit:       (data) => req('/wallet/credit', { method: 'POST', body: data }),
};

// ── VoIP ──────────────────────────────────────────────────────
export const voip = {
  getAccount:          ()        => req('/voip/account'),
  patchAccount:        (data)    => req('/voip/account', { method: 'PATCH', body: data }),
  getCalls:            ()        => req('/voip/calls'),
  getAdminCalls:       ()        => req('/voip/calls?all=1'),
  logCall:             (data)    => req('/voip/calls', { method: 'POST', body: data }),
  updateCall:          (id, d)   => req(`/voip/calls/${id}`, { method: 'PATCH', body: d }),
  getSettings:         ()        => req('/voip/settings'),
  getAdminAccounts:    ()        => req('/voip/accounts'),
  updateAdminAccount:  (id, d)   => req(`/voip/accounts/${id}`, { method: 'PATCH', body: d }),
};
