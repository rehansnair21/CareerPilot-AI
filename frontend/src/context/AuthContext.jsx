import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on mount & load user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('career_pilot_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('career_pilot_token');
          }
        } catch (error) {
          console.error('Failed to load user session:', error);
          localStorage.removeItem('career_pilot_token');
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  // Register action (creates account, user must then log in)
  const register = async ({ name, fullName, email, password, confirmPassword, role }) => {
    try {
      const displayName = name || fullName;
      const res = await api.post('/auth/register', {
        name: displayName,
        fullName: displayName,
        email,
        password,
        confirmPassword,
        role: role || 'student',
      });

      if (res.data && res.data.success) {
        return { success: true, message: res.data.message || 'Registration successful! Please log in.' };
      }
      return { success: false, message: res.data?.message || 'Registration failed', errors: res.data?.errors };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message, errors: error.response?.data?.errors };
    }
  };

  // Login action
  const login = async ({ email, password, role }) => {
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        role,
      });

      if (res.data.success) {
        localStorage.setItem('career_pilot_token', res.data.token);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  // Google Sign-In action (receives credential from Google GSI)
  const loginWithGoogle = async (credential, role = 'student') => {
    try {
      const res = await api.post('/auth/google/verify', { credential, role });

      if (res.data && res.data.success) {
        localStorage.setItem('career_pilot_token', res.data.token);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Google sign-in failed' };
    } catch (error) {
      console.error('Google Sign-In error:', error);
      const message = error.response?.data?.message || error.message || 'Google sign-in failed';
      return { success: false, message };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('career_pilot_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        loginWithGoogle,
        logout,
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
