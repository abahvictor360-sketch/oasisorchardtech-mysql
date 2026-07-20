import { createContext, useContext, useEffect, useReducer } from 'react';
import { auth } from '../lib/api';
import { getProfile, updateProfile, signIn, signUp, signOut } from '../lib/db';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING':     return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':return { ...state, user: action.payload, isAuthenticated: true,  loading: false, error: null };
    case 'AUTH_ERROR':  return { ...state, user: null,           isAuthenticated: false, loading: false, error: action.payload };
    case 'LOGOUT':      return { ...initialState, loading: false };
    case 'UPDATE_USER': return { ...state, user: { ...state.user, ...action.payload } };
    case 'INIT_DONE':   return { ...state, loading: false };
    default:            return state;
  }
}

function mergeUserWithProfile(apiUser, profile) {
  return {
    id:            apiUser.id,
    email:         apiUser.email,
    name:          profile?.name  || apiUser.name  || '',
    phone:         profile?.phone || apiUser.phone || '',
    address:       profile?.address || '',
    plan:          profile?.plan  || apiUser.plan  || 'basic',
    walletBalance: parseFloat(profile?.wallet_balance ?? 0),
    status:        profile?.status || 'active',
    role:          apiUser.role || profile?.role || 'user',
    user_metadata: { role: apiUser.role || 'user' },
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id).catch(() => null);
          dispatch({ type: 'AUTH_SUCCESS', payload: mergeUserWithProfile(session.user, profile) });
        } catch {
          dispatch({ type: 'INIT_DONE' });
        }
      } else {
        dispatch({ type: 'INIT_DONE' });
      }
    }).catch(() => dispatch({ type: 'INIT_DONE' }));
  }, []);

  async function login(email, password) {
    dispatch({ type: 'LOADING' });
    try {
      const data    = await signIn(email, password);
      const profile = await getProfile(data.user.id).catch(() => null);
      const merged  = mergeUserWithProfile(data.user, profile);
      dispatch({ type: 'AUTH_SUCCESS', payload: merged });
      return merged;
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', payload: err.message });
      throw err;
    }
  }

  async function signup(email, password, metadata) {
    dispatch({ type: 'LOADING' });
    try {
      await signUp(email, password, metadata);
      dispatch({ type: 'INIT_DONE' });
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', payload: err.message });
      throw err;
    }
  }

  async function logout() {
    await signOut();
    dispatch({ type: 'LOGOUT' });
  }

  async function updateUser(updates) {
    if (!state.user?.id) return;
    // NOTE: the server only lets a non-admin PUT name/phone/address on their
    // own profile (plan/wallet_balance/status are set exclusively by
    // dedicated, server-authoritative endpoints — /plan/cancel, /plan/upgrade,
    // /payments/stripe/confirm-plan, wallet top-up — to prevent a user
    // granting themselves a plan or balance for free). Use refreshUser()
    // after calling one of those endpoints to pull the real new values.
    const updated = await updateProfile(state.user.id, {
      name:    updates.name,
      phone:   updates.phone,
      address: updates.address,
    });
    dispatch({
      type: 'UPDATE_USER',
      payload: {
        name:          updated.name,
        phone:         updated.phone,
        address:       updated.address,
      },
    });
  }

  // Re-fetches the user's own profile and syncs plan/wallet/status into
  // state. Safe to call after any server-side action that changes them.
  async function refreshUser() {
    if (!state.user?.id) return;
    const fresh = await getProfile(state.user.id);
    dispatch({
      type: 'UPDATE_USER',
      payload: {
        plan:          fresh.plan,
        walletBalance: parseFloat(fresh.wallet_balance ?? 0),
        status:        fresh.status,
      },
    });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
