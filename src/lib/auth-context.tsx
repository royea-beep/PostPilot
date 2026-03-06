'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, businessName?: string) => Promise<void>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthState | null>(null);

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('postpilot_auth');
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((accessToken: string, rt: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const expiry = getTokenExpiry(accessToken);
    if (!expiry) return;
    const refreshIn = Math.max(expiry - Date.now() - 60_000, 5_000);

    refreshTimerRef.current = setTimeout(async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) { clearAuth(); return; }
        const data = await res.json();
        setToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        const saved = localStorage.getItem('postpilot_auth');
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem('postpilot_auth', JSON.stringify({ user: parsed.user, token: data.accessToken, refreshToken: data.refreshToken }));
        }
        scheduleRefresh(data.accessToken, data.refreshToken);
      } catch { clearAuth(); }
      finally { isRefreshingRef.current = false; }
    }, refreshIn);
  }, [clearAuth]);

  const saveAuth = useCallback((u: User, at: string, rt: string) => {
    setUser(u); setToken(at); setRefreshToken(rt);
    localStorage.setItem('postpilot_auth', JSON.stringify({ user: u, token: at, refreshToken: rt }));
    scheduleRefresh(at, rt);
  }, [scheduleRefresh]);

  useEffect(() => {
    const saved = localStorage.getItem('postpilot_auth');
    if (saved) {
      try {
        const { user: u, token: t, refreshToken: rt } = JSON.parse(saved);
        setUser(u); setToken(t); setRefreshToken(rt);
        if (t && rt) scheduleRefresh(t, rt);
      } catch { /* ignore */ }
    }
    setLoading(false);
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [scheduleRefresh]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Login failed'); }
    const d = await res.json();
    saveAuth(d.user, d.accessToken, d.refreshToken);
  };

  const register = async (email: string, password: string, name: string, businessName?: string) => {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name, businessName }) });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Registration failed'); }
    const d = await res.json();
    saveAuth(d.user, d.accessToken, d.refreshToken);
  };

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (res.status === 401 && refreshToken && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      try {
        const rr = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
        if (rr.ok) {
          const d = await rr.json();
          setToken(d.accessToken); setRefreshToken(d.refreshToken);
          const saved = localStorage.getItem('postpilot_auth');
          if (saved) { const p = JSON.parse(saved); localStorage.setItem('postpilot_auth', JSON.stringify({ user: p.user, token: d.accessToken, refreshToken: d.refreshToken })); }
          scheduleRefresh(d.accessToken, d.refreshToken);
          return fetch(url, { ...options, headers: { ...options.headers, 'Authorization': `Bearer ${d.accessToken}`, 'Content-Type': 'application/json' } });
        } else { clearAuth(); }
      } catch { clearAuth(); }
      finally { isRefreshingRef.current = false; }
    }
    return res;
  }, [token, refreshToken, clearAuth, scheduleRefresh]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout: clearAuth, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
