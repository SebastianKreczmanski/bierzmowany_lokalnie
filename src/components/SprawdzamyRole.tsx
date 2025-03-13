import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Właściwości komponentu SprawdzamyRole
 */
interface SprawdzamyRoleProps {
  /** Zawartość do wyświetlenia, gdy użytkownik ma wymagane role */
  children: ReactNode;
  
  /** 
   * Wymagane role - może być pojedyncza rola lub tablica ról 
   * Jeśli nie podano, zawartość będzie widoczna dla wszystkich użytkowników
   */
  wymaganeRole?: string | string[];
  
  /** 
   * Zawartość do wyświetlenia, gdy użytkownik nie ma wymaganych ról 
   * lub gdy nie jest zalogowany
   */
  fallback?: ReactNode;
}

/**
 * Komponent SprawdzamyRole
 * 
 * Sprawdza, czy użytkownik jest zalogowany i ma wymagane role.
 * Jeśli użytkownik nie ma wymaganych ról, wyświetla zawartość zastępczą.
 */
const SprawdzamyRole: React.FC<SprawdzamyRoleProps> = ({
  children,
  wymaganeRole,
  fallback
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();
  
  // Domyślna zawartość zastępcza, gdy użytkownik nie ma uprawnień
  const defaultFallback = (
    <div className="pt-24 p-8 bg-gray-900 text-white text-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-amber-500">Brak dostępu</h2>
      <p className="mb-4">Nie masz wymaganych uprawnień, aby zobaczyć tę zawartość.</p>
      {!isAuthenticated && (
        <p>Zaloguj się, aby uzyskać dostęp.</p>
      )}
    </div>
  );
  
  // Podczas ładowania pokazujemy loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-24 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }
  
  // Jeśli nie ma wymaganych ról, zawartość jest dostępna dla wszystkich
  if (!wymaganeRole) {
    return <>{children}</>;
  }
  
  // Jeśli użytkownik nie jest zalogowany
  if (!isAuthenticated) {
    return <>{fallback || defaultFallback}</>;
  }
  
  // Sprawdzamy uprawnienia
  const hasAccess = typeof wymaganeRole === 'string'
    ? hasRole(wymaganeRole)
    : hasAnyRole(wymaganeRole);
  
  // Zwracamy odpowiednią zawartość
  return hasAccess
    ? <>{children}</>
    : <>{fallback || defaultFallback}</>;
};

export default SprawdzamyRole; 