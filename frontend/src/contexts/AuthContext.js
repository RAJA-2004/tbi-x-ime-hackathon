import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check for demo mode
    const isDemoMode = localStorage.getItem('demo_mode') === 'true';
    const storedToken = localStorage.getItem('token');
    
    if (isDemoMode && storedToken === 'demo-access-token') {
      const demoUser = JSON.parse(localStorage.getItem('demo_user') || '{}');
      setUser(demoUser);
      setToken(storedToken);
      setLoading(false);
    } else if (storedToken && storedToken !== 'demo-access-token') {
      setToken(storedToken);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token might be expired or invalid
        console.log('Token validation failed, logging out');
        logout();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('token', data.access_token);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const demoLogin = async () => {
    try {
      // Simple demo login without backend authentication
      const demoUser = {
        id: 'demo',
        username: 'Demo User', 
        email: 'demo@sof-extractor.com',
        full_name: 'Quick Demo Access',
        role: 'demo',
        is_active: true
      };
      
      setUser(demoUser);
      setToken('demo-access-token'); // Simple token for demo
      localStorage.setItem('demo_mode', 'true');
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      localStorage.setItem('token', 'demo-access-token');
      
      toast.success('Quick Demo Access activated! You can now process maritime documents.');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Demo access failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_user');
  };

  // Add function to force re-authentication  
  const forceReauth = () => {
    logout();
    window.location.reload();
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    demoLogin,
    logout,
    forceReauth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
