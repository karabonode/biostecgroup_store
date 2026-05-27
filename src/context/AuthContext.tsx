import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'admin';
  avatar_url?: string;
}

export interface VerificationRequired {
  requiresVerification: true;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<VerificationRequired | { requiresVerification: false }>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const normalizedEnvApiBaseUrl = envApiBaseUrl ? envApiBaseUrl.replace(/\/$/, '') : '';
const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isLoopbackApiUrl = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);

const safeEnvApiBaseUrl =
  normalizedEnvApiBaseUrl && (!isLoopbackApiUrl(normalizedEnvApiBaseUrl) || isLocalHost)
    ? normalizedEnvApiBaseUrl
    : '';

const API_BASE_URL =
  safeEnvApiBaseUrl || (isLocalHost ? 'http://127.0.0.1:8000/api' : `${window.location.origin}/api`);

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        // Attach verification metadata so Login.tsx can redirect to /verify-email
        const err = new Error(data.error || 'Login failed') as Error & {
          requiresVerification?: boolean;
          email?: string;
        };
        err.requiresVerification = data.requires_verification ?? false;
        err.email = data.email ?? '';
        throw err;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error: any) {
      const message = String(error?.message || 'Login failed');
      if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('networkerror')) {
        throw new Error('Unable to reach the API server. Please ensure the backend is running and try again.');
      }
      throw new Error(message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<VerificationRequired | { requiresVerification: false }> => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || result.errors?.join(', ') || 'Registration failed');
      }

      // Server requires email verification before issuing a token
      if (result.requires_verification) {
        return { requiresVerification: true, email: result.email as string };
      }

      // Immediate login path (fallback if server ever skips verification)
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      return { requiresVerification: false };
    } catch (error: any) {
      const message = String(error?.message || 'Registration failed');
      if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('networkerror')) {
        throw new Error('Unable to reach the API server. Please ensure the backend is running and try again.');
      }
      throw new Error(message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
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

export { API_BASE_URL };
