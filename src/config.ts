// Konfiguracja globalna aplikacji

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; 

export const APP_NAME = 'System Zarządzania Bierzmowaniem';

// Konfiguracja paginacji
export const ITEMS_PER_PAGE = 10;

// Wartości domyślne
export const DEFAULT_ERROR_MESSAGE = 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.';

// Konfiguracja autentykacji
export const AUTH_TOKEN_NAME = 'auth_token';
export const AUTH_EXPIRY_NAME = 'auth_expiry';

// Podstawowe role użytkowników
export const ROLES = {
  ADMIN: 'admin',
  ANIMATOR: 'animator',
  KANDYDAT: 'kandydat',
  KOORDYNATOR: 'koordynator'
};

// Konfiguracja toastów
export const TOAST_AUTO_CLOSE_TIME = 5000; 