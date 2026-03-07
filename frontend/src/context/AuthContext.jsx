import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Load user profile
  const loadUser = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.AUTH_PROFILE);
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      logout(); // Clear invalid token
    } finally {
      setLoading(false);
    }
  };

  // Sign up
  const signup = async (fullName, email, password, confirmPassword) => {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH_SIGNUP, {
        fullName,
        email,
        password,
        confirmPassword
      });

      if (response.data.success) {
        // Don't auto-login, just return success message
        return { success: true, message: response.data.message, requireLogin: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.'
      };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH_LOGIN, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Google OAuth
  const googleLogin = async (credential, userInfo) => {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH_GOOGLE, {
        credential,
        fullName: userInfo?.name,
        email: userInfo?.email,
        profilePicture: userInfo?.picture
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google login failed. Please try again.'
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const response = await axios.put(API_ENDPOINTS.AUTH_UPDATE_PROFILE, updates);
      
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    googleLogin,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
