import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginAdminApi, fetchAdminProfileApi } from '../services/adminService';

const AdminAuthContext = createContext(null);

const extractAuthPayload = (res) => {
  if (!res) return { user: null, token: null };

  // Supports: res.data.data, res.data, res
  const container = res.data?.data || res.data || res;

  const rawUser =
    container.user ||
    container.admin ||
    container.adminUser ||
    res.user ||
    res.admin ||
    res.adminUser ||
    null;

  const token =
    container.token ||
    container.accessToken ||
    container.jwt ||
    res.token ||
    res.accessToken ||
    res.jwt ||
    null;

  let user = rawUser;
  if (user && typeof user === 'object') {
    user = {
      ...user,
      id: user.id || user._id,
      _id: user._id || user.id,
      role: user.role || 'SUPER_ADMIN',
    };
  }

  return { user, token };
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('craviti_admin_user') || sessionStorage.getItem('craviti_admin_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('craviti_admin_token') || sessionStorage.getItem('craviti_admin_token') || null;
  });

  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('craviti_admin_token');
    localStorage.removeItem('craviti_admin_user');
    sessionStorage.removeItem('craviti_admin_token');
    sessionStorage.removeItem('craviti_admin_user');
  }, []);

  // Verify session on mount
  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      const storedToken =
        localStorage.getItem('craviti_admin_token') || sessionStorage.getItem('craviti_admin_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchAdminProfileApi();
        if (isMounted && res && res.success !== false) {
          const { user: profile } = extractAuthPayload(res);
          if (profile) {
            setAdmin(profile);
            if (localStorage.getItem('craviti_admin_token')) {
              localStorage.setItem('craviti_admin_user', JSON.stringify(profile));
            } else if (sessionStorage.getItem('craviti_admin_token')) {
              sessionStorage.setItem('craviti_admin_user', JSON.stringify(profile));
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Session verification failed, clearing auth');
          logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [logout]);

  const login = async (email, password, rememberMe = true) => {
    const res = await loginAdminApi({ email, password });

    if (!res) {
      throw new Error('No response from authentication server');
    }

    if (res.success === false) {
      throw new Error(res.message || 'Login failed');
    }

    const { user: userObj, token: jwtToken } = extractAuthPayload(res);

    if (!userObj || !jwtToken) {
      throw new Error('Authentication response missing user credentials');
    }

    setAdmin(userObj);
    setToken(jwtToken);
    setLoading(false);

    const storageTarget = rememberMe ? localStorage : sessionStorage;
    const storageOther = rememberMe ? sessionStorage : localStorage;

    storageTarget.setItem('craviti_admin_token', jwtToken);
    storageTarget.setItem('craviti_admin_user', JSON.stringify(userObj));
    storageOther.removeItem('craviti_admin_token');
    storageOther.removeItem('craviti_admin_user');

    return userObj;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        user: admin,
        token,
        isAuthenticated: Boolean(token && admin),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

