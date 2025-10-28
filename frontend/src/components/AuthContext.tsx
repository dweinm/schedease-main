import React, { createContext, useContext, useState, useEffect } from 'react';

// Configuration for API base URL
const getApiBaseUrl = () => {
  // Try to get from environment variables if available
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

const AuthContext = createContext<{
  user: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  // show a short landing/transition UI after successful login
  showLanding?: boolean;
  continueLanding?: () => void;
} | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        // Optionally verify token validity here
      } catch (error) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers = { ...headers, 'Authorization': `Bearer ${token}` };
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (networkError: any) {
      // Handle network errors (e.g., backend not running)
      if (networkError.name === 'TypeError' || networkError.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }
      throw networkError;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        setUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('authToken', response.token);
        // show the interim landing UI briefly
        setShowLanding(true);
        setIsLoading(false);
        return true;
      } else {
        setError(response.message || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success) {
        // If the backend returns user and token (auto-login after registration)
        if (response.user && response.token) {
          setUser(response.user);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('authToken', response.token);
          // show landing UI after successful registration/login
          setShowLanding(true);
        }
        setIsLoading(false);
        return true;
      } else {
        setError(response.message || 'Registration failed');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setShowLanding(false);
  };

  const continueLanding = () => setShowLanding(false);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error, showLanding, continueLanding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}