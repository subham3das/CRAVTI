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
    const saved =
      localStorage.getItem('adminUser') ||
      sessionStorage.getItem('adminUser') ||
      localStorage.getItem('craviti_admin_user') ||
      sessionStorage.getItem('craviti_admin_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem('adminAccessToken') ||
      sessionStorage.getItem('adminAccessToken') ||
      localStorage.getItem('craviti_admin_token') ||
      sessionStorage.getItem('craviti_admin_token') ||
      null
    );
  });

  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setAdmin(null);
    setToken(null);
    // Strict Admin Token Isolation: remove only Admin keys
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminAccessToken');
    sessionStorage.removeItem('adminRefreshToken');
    sessionStorage.removeItem('adminUser');
    // Legacy cleanup
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
        localStorage.getItem('adminAccessToken') ||
        sessionStorage.getItem('adminAccessToken') ||
        localStorage.getItem('craviti_admin_token') ||
        sessionStorage.getItem('craviti_admin_token');

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
            const targetStorage = localStorage.getItem('adminAccessToken') || localStorage.getItem('craviti_admin_token')
              ? localStorage
              : sessionStorage;
            targetStorage.setItem('adminUser', JSON.stringify(profile));
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

  const updateAdmin = useCallback((updatedProfile) => {
    if (!updatedProfile) return;
    setAdmin((prev) => {
      const merged = { ...prev, ...updatedProfile };
      const targetStorage =
        localStorage.getItem('adminAccessToken') || localStorage.getItem('craviti_admin_token')
          ? localStorage
          : sessionStorage;
      targetStorage.setItem('adminUser', JSON.stringify(merged));
      return merged;
    });
  }, []);

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

    const refreshToken =
      res.data?.refreshToken ||
      res.refreshToken ||
      res.data?.data?.refreshToken ||
      jwtToken;

    setAdmin(userObj);
    setToken(jwtToken);
    setLoading(false);

    const storageTarget = rememberMe ? localStorage : sessionStorage;
    const storageOther = rememberMe ? sessionStorage : localStorage;

    // Strict Admin Token Keys
    storageTarget.setItem('adminAccessToken', jwtToken);
    storageTarget.setItem('adminRefreshToken', refreshToken);
    storageTarget.setItem('adminUser', JSON.stringify(userObj));

    // Legacy sync during migration
    storageTarget.setItem('craviti_admin_token', jwtToken);
    storageTarget.setItem('craviti_admin_user', JSON.stringify(userObj));

    // Clear opposite storage
    storageOther.removeItem('adminAccessToken');
    storageOther.removeItem('adminRefreshToken');
    storageOther.removeItem('adminUser');
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
        updateAdmin,
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

