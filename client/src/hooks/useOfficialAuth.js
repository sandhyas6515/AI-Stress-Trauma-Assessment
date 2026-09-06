import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for official authentication state management.
 * Manages JWT token in localStorage and provides login/logout/session check.
 */
export default function useOfficialAuth() {
  const [officialUser, setOfficialUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nhaa_official_token'));
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On mount (or when token changes), verify the stored token
   * by calling GET /api/official/me. If invalid, clear it.
   */
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setOfficialUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/official/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setOfficialUser(data.official);
          } else {
            clearSession();
          }
        } else {
          clearSession();
        }
      } catch (err) {
        console.warn('Auth verification failed:', err);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('nhaa_official_token');
    setToken(null);
    setOfficialUser(null);
  }, []);

  /**
   * Login: call the backend, store the token, set user state.
   * Returns { success, error? }
   */
  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch('/api/official/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('nhaa_official_token', data.token);
        setToken(data.token);
        setOfficialUser(data.official);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed.' };
      }
    } catch (err) {
      return { success: false, error: 'Unable to reach server. Please try again.' };
    }
  }, []);

  /**
   * Logout: clear token and user state.
   */
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return {
    officialUser,
    token,
    isAuthenticated: !!officialUser && !!token,
    isLoading,
    login,
    logout
  };
}
