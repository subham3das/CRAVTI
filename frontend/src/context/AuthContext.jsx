import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signupApi, loginApi, getMeApi } from '../services/authService';
import { getMyRestaurantApi } from '../services/restaurantService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    // STRICT TOKEN ISOLATION: Restaurant Panel only uses restaurantAccessToken
    const token =
      localStorage.getItem('restaurantAccessToken') ||
      localStorage.getItem('craviti_token');

    if (!token) {
      setUser(null);
      setRestaurant(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getMeApi();
      if (res.success && res.data) {
        setUser(res.data.user);
        setRestaurant(res.data.restaurant);
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      // ONLY clear storage if server explicitly rejected authentication (401)
      // Network errors, cold-start delays, or 500s must never wipe user session
      if (err.response?.status === 401) {
        localStorage.removeItem('restaurantAccessToken');
        localStorage.removeItem('restaurantRefreshToken');
        localStorage.removeItem('craviti_token');
        setUser(null);
        setRestaurant(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const signup = async (userData) => {
    const res = await signupApi(userData);
    if (res.success && res.data) {
      const token = res.data.token || res.data.accessToken;
      const refreshToken = res.data.refreshToken || token;
      localStorage.setItem('restaurantAccessToken', token);
      localStorage.setItem('restaurantRefreshToken', refreshToken);
      localStorage.setItem('craviti_token', token);
      setUser(res.data.user);
      setRestaurant(null);
      return res.data;
    }
    throw new Error(res.message || 'Signup failed');
  };

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    if (res.success && res.data) {
      const token = res.data.token || res.data.accessToken;
      const refreshToken = res.data.refreshToken || token;
      localStorage.setItem('restaurantAccessToken', token);
      localStorage.setItem('restaurantRefreshToken', refreshToken);
      localStorage.setItem('craviti_token', token);
      setUser(res.data.user);
      setRestaurant(res.data.restaurant || null);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('restaurantAccessToken');
    localStorage.removeItem('restaurantRefreshToken');
    localStorage.removeItem('craviti_token');
    localStorage.removeItem('craviti_user');
    setUser(null);
    setRestaurant(null);
  };

  const refreshRestaurant = async () => {
    try {
      const res = await getMyRestaurantApi();
      if (res.success && res.data) {
        setRestaurant(res.data);
      }
    } catch (error) {
      console.error('Failed to refresh restaurant:', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        loading,
        isAuthenticated: !!user,
        hasRestaurant: !!(user?.restaurantId || restaurant?._id),
        signup,
        login,
        logout,
        setRestaurant,
        refreshRestaurant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
