import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/api';

/**
 * Interfejs kontekstu uwierzytelniania
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

/**
 * Kontekst uwierzytelniania
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  hasRole: () => false,
  hasAnyRole: () => false
});

/**
 * Właściwości dostawcy kontekstu uwierzytelniania
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Dostawca kontekstu uwierzytelniania
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Sprawdzanie sesji przy inicjalizacji
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await authApi.checkSession();
        setUser(userData);
      } catch (error) {
        console.error('Błąd sprawdzania sesji:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  /**
   * Logowanie użytkownika
   */
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await authApi.login(username, password);
      setUser(userData);
    } catch (error) {
      console.error('Błąd logowania:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Wylogowanie użytkownika
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Błąd wylogowania:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sprawdzanie, czy użytkownik ma określoną rolę
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  /**
   * Sprawdzanie, czy użytkownik ma którąkolwiek z określonych ról
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return user.roles.some(role => roles.includes(role));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasAnyRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook do używania kontekstu uwierzytelniania
 */
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 