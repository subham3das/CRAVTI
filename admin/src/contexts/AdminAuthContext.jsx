import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginAdminApi, fetchAdminProfileApi } from '../services/adminService';

const AdminAuthContext = createContext(null);

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

  // Verify session on mount
  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchAdminProfileApi();
        if (isMounted && res.success && res.data?.admin) {
          setAdmin(res.data.admin);
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
  }, [token]);

  const login = async (email, password, rememberMe = true) => {
    const res = await loginAdminApi({ email, password });
    if (res.success && res.data) {
      const { admin: userObj, token: jwtToken } = res.data;
      setAdmin(userObj);
      setToken(jwtToken);

      if (rememberMe) {
        localStorage.setItem('craviti_admin_token', jwtToken);
        localStorage.setItem('craviti_admin_user', JSON.stringify(userObj));
        sessionStorage.removeItem('craviti_admin_token');
        sessionStorage.removeItem('craviti_admin_user');
      } else {
        sessionStorage.setItem('craviti_admin_token', jwtToken);
        sessionStorage.setItem('craviti_admin_user', JSON.stringify(userObj));
        localStorage.removeItem('craviti_admin_token');
        localStorage.removeItem('craviti_admin_user');
      }

      return userObj;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = useCallback(() => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('craviti_admin_token');
    localStorage.removeItem('craviti_admin_user');
    sessionStorage.removeItem('craviti_admin_token');
    sessionStorage.removeItem('craviti_admin_user');
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
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

