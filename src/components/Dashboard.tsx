import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SprawdzamyRole from './SprawdzamyRole';
import EventCalendar from './EventCalendar';

/**
 * Interfejs właściwości komponentu Dashboard
 * 
 * @property children - Zawartość, która zostanie wyświetlona w głównej sekcji dashboardu
 * @property requiredRole - Opcjonalna rola lub tablica ról wymaganych do dostępu do dashboardu
 */
interface DashboardProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

/**
 * Komponent Dashboard - uniwersalny layout dla stron po zalogowaniu
 * 
 * Zapewnia:
 * - Podział na sekcję główną (2/3) i kalendarz (1/3)
 * - Personalizację w zależności od roli użytkownika
 * - Wyświetlanie imienia i nazwiska zalogowanego użytkownika
 * - Responsywność (układ zmienia się na mobilnych urządzeniach)
 * 
 * @param children - Zawartość, która zostanie wyświetlona w głównej sekcji dashboardu
 * @param requiredRole - Opcjonalna rola lub tablica ról wymaganych do dostępu do dashboardu
 */
const Dashboard: React.FC<DashboardProps> = ({ children, requiredRole }) => {
  const { user, hasRole } = useAuth();

  /**
   * Funkcja zwracająca nazwę panelu na podstawie roli użytkownika
   * 
   * @returns Nazwa panelu odpowiadająca roli użytkownika
   */
  const getPanelName = (): string => {
    if (!user) return '';

    if (hasRole('administrator')) return 'Panel administratora';
    if (hasRole('duszpasterz')) return 'Panel duszpasterza';
    if (hasRole('kancelaria')) return 'Panel pracownika kancelarii';
    if (hasRole('animator')) return 'Panel animatora';
    if (hasRole('rodzic')) return 'Panel rodzica';
    if (hasRole('kandydat')) return 'Panel kandydata';
    
    return 'Panel użytkownika';
  };

  return (
    <SprawdzamyRole wymaganeRole={requiredRole}>
      {/* Główny kontener z paddingiem, aby zapewnić odstęp od nagłówka */}
      <div className="min-h-screen bg-gray-800 pt-28 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Lewa kolumna - główna część (2/3 szerokości) */}
            <div className="w-full xl:w-2/3">
              {/* Nagłówek z powitaniem i informacją o panelu */}
              <div className="mb-8 bg-gray-900/80 p-6 rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-amber-500">
                  Witaj, {user?.imie} {user?.nazwisko}!
                </h1>
                <p className="text-lg text-gray-300 mt-2">{getPanelName()}</p>
              </div>

              {/* Zawartość głównej sekcji */}
              <div className="bg-gray-900 rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6 text-amber-500">Informacje i zadania</h2>
                <div className="text-gray-300">
                  {children}
                </div>
              </div>
            </div>

            {/* Prawa kolumna - kalendarz (1/3 szerokości) */}
            <div className="w-full xl:w-1/3">
              {/* Panel kalendarza - na tej samej wysokości co nagłówek powitania */}
              <div className="bg-gray-900 rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6 text-amber-500">Kalendarz wydarzeń</h2>
                {/* Komponent kalendarza */}
                <EventCalendar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SprawdzamyRole>
  );
};

export default Dashboard; 