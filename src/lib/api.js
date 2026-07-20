// ── API client — replaces @supabase/supabase-js ───────────────
import { storage } from '../utils/storage';

const BASE = '/api';

async function req(path, options = {}) {
  const token = storage.get('oasis_token');
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
    if (!error && data?.token) storage.set('oasis_token', data.token);
    return { data, error };
  },

  async signUp(email, password, metadata) {
    return req('/auth/signup', { method: 'POST', body: { email, password, metadata } });
  },

  async signOut() {
    await req('/auth/logout', { method: 'POST' });
    storage.remove('oasis_token');
    return { error: null };
  },

  changePassword(current, newPassword) {
    return req('/auth/change-password', { method: 'POST', body: { current, new: newPassword } });
  },

  sendVerification() {
    return req('/auth/send-verification', { method: 'POST' });
  },

  verifyEmail(token) {
    return req(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  },

  forgotPassword(email) {
    return req('/auth/forgot-password', { method: 'POST', body: { email } });
  },

  resetPassword(token, password) {
    return req('/auth/reset-password', { method: 'POST', body: { token, password } });
  },

  async getSession() {
    const token = storage.get('oasis_token');
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
    const token = storage.get('oasis_token');
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
  getMany:      (keys)       => req(`/content?keys=${encodeURIComponent(keys.join(','))}`),
  save:         (key, value) => req(`/content/${key}`, { method: 'PUT', body: { content: value } }),
  listByPrefix: (prefix)     => req(`/content?prefix=${encodeURIComponent(prefix)}`),
  remove:       (key)        => req(`/content/${key}`, { method: 'DELETE' }),
};

// ── Users (admin) ─────────────────────────────────────────────
export const users = {
  list:   ()         => req('/users'),
  create: (data)     => req('/users', { method: 'POST', body: data }),
  update: (id, data) => req(`/users/${id}`, { method: 'PUT', body: data }),
  remove: (id)       => req(`/users/${id}`, { method: 'DELETE' }),
};

// ── Wallet ────────────────────────────────────────────────────
export const wallet = {
  transactions:    (uid)  => req(`/wallet/${uid}`),
  credit:          (data) => req('/wallet/credit',              { method: 'POST', body: data }),
  topupStripe:     (amt)  => req('/wallet/topup/stripe',        { method: 'POST', body: { amount: amt } }),
  topupConfirm:    (id)   => req('/wallet/topup/confirm',       { method: 'POST', body: { intent_id: id } }),
};

// ── Payments ─────────────────────────────────────────────────
export const payments = {
  config:              ()          => req('/payments/config'),
  settings:            ()          => req('/payments/settings'),
  saveSettings:        (data)      => req('/payments/settings', { method: 'PUT', body: data }),
  createStripeIntent:  (data)      => req('/payments/stripe/create-intent', { method: 'POST', body: data }),
};

// ── Orders ────────────────────────────────────────────────────
export const orders = {
  list:   ()         => req('/orders'),
  create: (data)     => req('/orders', { method: 'POST', body: data }),
  get:    (id)       => req(`/orders/${id}`),
  update: (id, data) => req(`/orders/${id}`, { method: 'PATCH', body: data }),
};

// ── Support notifications ──────────────────────────────────────
export const supportNotify = {
  newMessage: (subject, message) =>
    req('/support-notify/new', { method: 'POST', body: { subject, message } }),
  sendReply: (userEmail, userName, subject, message) =>
    req('/support-notify/reply', { method: 'POST', body: { user_email: userEmail, user_name: userName, subject, message } }),
};

// ── SMTP ──────────────────────────────────────────────────────
export const smtp = {
  getSettings:  ()         => req('/smtp/settings'),
  saveSettings: (data)     => req('/smtp/settings', { method: 'PUT', body: data }),
  test:         (email)    => req('/smtp/test',     { method: 'POST', body: { email } }),
};

// ── Email Templates ───────────────────────────────────────────
export const emailTemplates = {
  list:    ()             => req('/email-templates'),
  get:     (id)           => req(`/email-templates/${id}`),
  create:  (data)         => req('/email-templates', { method: 'POST', body: data }),
  update:  (id, data)     => req(`/email-templates/${id}`, { method: 'PUT', body: data }),
  remove:  (id)           => req(`/email-templates/${id}`, { method: 'DELETE' }),
  reset:   (id)           => req(`/email-templates/${id}/reset`, { method: 'POST' }),
  test:    (id, email)    => req(`/email-templates/${id}/test`, { method: 'POST', body: { email } }),
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
  saveSettings:        (data)    => req('/voip/settings', { method: 'PUT', body: data }),
  getAdminAccounts:    ()        => req('/voip/accounts'),
  updateAdminAccount:  (id, d)   => req(`/voip/accounts/${id}`, { method: 'PATCH', body: d }),
  // VoIP.ms integration
  proxy:               (method, params = {}) => req(`/voipms?method=${method}&` + new URLSearchParams(params).toString()),
  provision:           (userId)  => req('/provision', { method: 'POST', body: { user_id: userId } }),
};
