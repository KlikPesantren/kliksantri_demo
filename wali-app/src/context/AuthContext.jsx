import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import { authApi } from '../api/auth.api';
import { storage } from '../utils/storage';
import { setLogoutCallback } from '../api/client';
import {
  registerPushTokenBackground,
  unregisterPushToken,
} from '../services/pushNotificationService';

const AuthContext = createContext(null);

const initialState = {
  isLoading: true,
  isAuthenticated: false,
  token: null,
  wali: null,
  anak: [],
  santriIds: [],
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        token: action.token,
        wali: action.wali,
        anak: action.anak,
        santriIds: action.santriIds,
      };
    case 'LOGIN':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        token: action.token,
        wali: action.wali,
        anak: action.anak,
        santriIds: action.santriIds,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.value };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const pushRegisterAttemptedRef = React.useRef(false);

  const registerPushAfterAuthReady = useCallback(async (source) => {
    if (pushRegisterAttemptedRef.current) {
      console.log('PUSH REGISTER SKIP already attempted', { source });
      return;
    }

    pushRegisterAttemptedRef.current = true;
    console.log('PUSH REGISTER START', { source });

    const result = await registerPushTokenBackground({ source });
    if (result?.ok) {
      console.log('PUSH REGISTER DONE', { source });
    } else {
      console.log('PUSH REGISTER NOT OK', { source, result });
    }
  }, []);

  const logout = useCallback(async () => {
    pushRegisterAttemptedRef.current = false;
    await unregisterPushToken();
    await storage.clearSession();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Daftarkan logout callback ke axios interceptor
  React.useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  const restoreSession = useCallback(async () => {
    try {
      const token = await storage.getToken();

      if (!token) {
        dispatch({ type: 'SET_LOADING', value: false });
        return;
      }

      // Validasi token ke server
      const res = await authApi.me();
      const wali = res.wali;
      const anak = res.anak ?? [];
      const santriIds = res.santri_ids ?? [];

      await storage.saveSession(token, wali, anak, santriIds);

      dispatch({
        type: 'RESTORE_TOKEN',
        token,
        wali,
        anak,
        santriIds,
      });
      await registerPushAfterAuthReady('restoreSession');

    } catch {
      await storage.clearSession();
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, [registerPushAfterAuthReady]);

  const login = useCallback(async (nomor_hp, pin, tenant_slug) => {
    const res = await authApi.login(nomor_hp, pin, tenant_slug);

    const {
      token,
      wali,
      anak = [],
      santri_ids: santriIds = [],
      tenant,
    } = res;

    const slug = tenant?.slug || tenant_slug || 'default';
    await storage.saveSession(token, wali, anak, santriIds, slug);

    dispatch({ type: 'LOGIN', token, wali, anak, santriIds });
    await registerPushAfterAuthReady('login');

    return { anak, santriIds, tenant };
  }, [registerPushAfterAuthReady]);

  React.useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;
    registerPushAfterAuthReady('authStateEffect');
  }, [state.isAuthenticated, state.token, registerPushAfterAuthReady]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
