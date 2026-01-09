'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials, UserRole } from '@/types';
import { config } from '@/lib/config';
import { authApi } from '@/lib/api-client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      // Call real login API
      const response = await authApi.login({
        email: credentials.username, // API expects email field
        password: credentials.password,
      });

      // Create user object from response
      const authenticatedUser: User = {
        id: response.user.id,
        username: response.user.name,
        email: response.user.email,
        role: UserRole.ADMIN, // All logged-in users are admins
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const authData = {
        user: authenticatedUser,
        token: response.token,
        expiresAt: new Date(Date.now() + config.auth.tokenExpiry), // 1 hour
      };

      // Store in localStorage
      localStorage.setItem(config.auth.sessionKey, JSON.stringify(authData));
      setUser(authenticatedUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('邮箱或密码错误');
    }
  };

  const logout = () => {
    localStorage.removeItem(config.auth.sessionKey);
    setUser(null);
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem(config.auth.sessionKey);
        if (stored) {
          const authData = JSON.parse(stored);
          const expiresAt = new Date(authData.expiresAt);
          
          if (expiresAt > new Date()) {
            setUser(authData.user);
          } else {
            localStorage.removeItem(config.auth.sessionKey);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem(config.auth.sessionKey);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}