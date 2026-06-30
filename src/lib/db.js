import { auth, profiles, products as productsApi, wallet, users as usersApi } from './api';

// ─── AUTH ────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signUp(email, password, metadata) {
  const { data, error } = await auth.signUp(email, password, metadata);
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data } = await auth.getSession();
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await profiles.get(userId);
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(userId, updates) {
  const current = await getProfile(userId).catch(() => ({}));
  const merged  = { ...current, ...updates };
  const { data, error } = await profiles.update(userId, merged);
  if (error) throw new Error(error.message);
  return data;
}

// ─── PRODUCTS ────────────────────────────────────────────────
export async function getProducts() {
  const { data, error } = await productsApi.list();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllProductsAdmin() {
  const { data, error } = await productsApi.listAll();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProduct(id) {
  const { error } = await productsApi.remove(id);
  if (error) throw new Error(error.message);
}

// ─── WALLET ──────────────────────────────────────────────────
export async function getWalletTransactions(userId) {
  const { data, error } = await wallet.transactions(userId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function topUpWallet(userId, amount, description) {
  const { data, error } = await wallet.credit({ user_id: userId, amount, description: description || 'Top-up' });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminCreditWallet(userId, amount, description) {
  return topUpWallet(userId, amount, description || 'Admin credit');
}

// ─── USERS (admin) ────────────────────────────────────────────
export async function getAllUsers() {
  const { data, error } = await usersApi.list();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateUserPlan(userId, plan) {
  return updateProfile(userId, { plan });
}

export async function updateUserStatus(userId, status) {
  return updateProfile(userId, { status });
}

// ─── Stubs for features not yet fully implemented ─────────────
export async function createOrder()        { throw new Error('Orders not implemented'); }
export async function getUserOrders()      { return []; }
export async function getAllOrders()       { return []; }
export async function updateOrderStatus()  { throw new Error('Orders not implemented'); }
export async function getAllTransactions()  { return []; }
export async function deductWallet()       { throw new Error('Not implemented'); }
export async function createTicket()       { throw new Error('Not implemented'); }
export async function getUserTickets()     { return []; }
export async function getAllTickets()       { return []; }
export async function addTicketMessage()   { throw new Error('Not implemented'); }
export async function updateTicketStatus() { throw new Error('Not implemented'); }
