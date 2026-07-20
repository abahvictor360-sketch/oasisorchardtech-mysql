// Safe localStorage wrapper — some browsers (Safari/Firefox strict privacy
// modes, certain in-app browsers) throw on any localStorage access.
export const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  },
};
