import Cookies from 'js-cookie';
import { 
  getUserByUsername, 
  getUserRoles, 
  verifyPassword, 
  getAllEvents, 
  getEventsByRole, 
  getEventsByGroup, 
  getAllEventTypes
} from './mockedDb';
import axios from 'axios';

// Klucz dla ciasteczka z sesją użytkownika
const SESSION_KEY = 'bierzmowancy_session';

// Czas życia sesji w dniach
const SESSION_EXPIRY = 1; // 1 dzień

/**
 * Interfejs użytkownika
 */
export interface User {
  id: number;
  username: string;
  imie: string;
  nazwisko: string;
  roles: string[];
}

// Przechowuje informacje o sesji użytkownika (dla symulowania API)
let sessionUser: User | null = null;

/**
 * Logowanie użytkownika
 * @param username Nazwa użytkownika
 * @param password Hasło
 * @returns Dane użytkownika lub null
 */
export async function login(username: string, password: string): Promise<User | null> {
  // Znajdź użytkownika po nazwie użytkownika
  const user = getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  // Weryfikuj hasło
  const isPasswordValid = verifyPassword(password, user.password_hash);
  
  if (!isPasswordValid) {
    return null;
  }
  
  // Pobierz role użytkownika
  const roles = getUserRoles(user.id);
  
  // Tworzenie obiektu użytkownika
  const userData: User = {
    id: user.id,
    username: user.username,
    imie: user.imie,
    nazwisko: user.nazwisko,
    roles
  };
  
  // Zapisz sesję
  saveSession(userData);
  
  // Ustaw użytkownika w sesji (dla symulowania API)
  sessionUser = userData;
  
  return userData;
}

/**
 * Wylogowywanie użytkownika
 */
export function logout(): void {
  // Usuń ciasteczko z sesją
  Cookies.remove(SESSION_KEY);
  
  // Wyczyść użytkownika w sesji (dla symulowania API)
  sessionUser = null;
}

/**
 * Zapisywanie sesji użytkownika
 * @param user Dane użytkownika
 */
function saveSession(user: User): void {
  Cookies.set(SESSION_KEY, JSON.stringify(user), {
    expires: SESSION_EXPIRY,
    secure: process.env.NODE_ENV === 'production'
  });
}

/**
 * Pobieranie aktualnie zalogowanego użytkownika
 * @returns Dane użytkownika lub null
 */
export function getCurrentUser(): User | null {
  const sessionData = Cookies.get(SESSION_KEY);
  
  if (!sessionData) {
    return null;
  }
  
  try {
    const user = JSON.parse(sessionData) as User;
    
    // Ustaw użytkownika w sesji (dla symulowania API)
    sessionUser = user;
    
    return user;
  } catch (error) {
    console.error('Błąd parsowania danych sesji:', error);
    return null;
  }
}

/**
 * Sprawdzanie, czy użytkownik ma określoną rolę
 * @param role Nazwa roli
 * @returns Czy użytkownik ma daną rolę
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  return user.roles.includes(role);
}

/**
 * Sprawdzanie, czy użytkownik ma którąkolwiek z określonych ról
 * @param roles Lista ról
 * @returns Czy użytkownik ma którąkolwiek z ról
 */
export function hasAnyRole(roles: string[]): boolean {
  const user = getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  return user.roles.some(role => roles.includes(role));
}

// ------ API Handling für events (symulowane) -------

/**
 * Obsługuje logowanie użytkownika (dla symulowanego API)
 * @param req Dane żądania (login i hasło)
 * @returns Odpowiedź z API
 */
export const handleLogin = (req: any) => {
  const { identifier, password } = req;
  
  // Znajdź użytkownika po nazwie użytkownika
  const user = getUserByUsername(identifier);
  
  if (!user) {
    return {
      success: false,
      message: 'Nieprawidłowa nazwa użytkownika lub hasło'
    };
  }
  
  // Weryfikuj hasło
  const isPasswordValid = verifyPassword(password, user.password_hash);
  
  if (!isPasswordValid) {
    return {
      success: false,
      message: 'Nieprawidłowa nazwa użytkownika lub hasło'
    };
  }
  
  // Pobierz role użytkownika
  const roles = getUserRoles(user.id);
  
  // Zapisz sesję użytkownika (w rzeczywistej aplikacji byłoby to JWT lub sesja na serwerze)
  sessionUser = {
    id: user.id,
    username: user.username,
    imie: user.imie,
    nazwisko: user.nazwisko,
    roles
  };
  
  return {
    success: true,
    message: 'Zalogowano pomyślnie',
    user: sessionUser
  };
};

/**
 * Obsługuje wylogowanie użytkownika (dla symulowanego API)
 * @returns Odpowiedź z API
 */
export const handleLogout = () => {
  sessionUser = null;
  
  return {
    success: true,
    message: 'Wylogowano pomyślnie'
  };
};

/**
 * Obsługuje sprawdzanie sesji użytkownika (dla symulowanego API)
 * @returns Odpowiedź z API
 */
export const handleCheckSession = () => {
  if (!sessionUser) {
    return {
      success: false,
      message: 'Brak aktywnej sesji'
    };
  }
  
  return {
    success: true,
    message: 'Sesja aktywna',
    user: sessionUser
  };
};

/**
 * Obsługuje pobieranie wszystkich wydarzeń
 * @returns Odpowiedź z API z listą wszystkich wydarzeń
 */
export const handleGetEvents = () => {
  // Sprawdź, czy użytkownik jest zalogowany
  if (!sessionUser) {
    return {
      success: false,
      message: 'Nie jesteś zalogowany'
    };
  }
  
  // Pobierz wszystkie wydarzenia
  const events = getAllEvents();
  
  return {
    success: true,
    message: 'Wydarzenia pobrane pomyślnie',
    data: events
  };
};

/**
 * Obsługuje pobieranie wydarzeń dla określonej roli
 * @param role Nazwa roli
 * @returns Odpowiedź z API z listą wydarzeń dla danej roli
 */
export const handleGetEventsByRole = (role: string) => {
  // Sprawdź, czy użytkownik jest zalogowany
  if (!sessionUser) {
    return {
      success: false,
      message: 'Nie jesteś zalogowany'
    };
  }
  
  // Sprawdź, czy użytkownik ma wymaganą rolę
  if (!sessionUser.roles.includes(role)) {
    return {
      success: false,
      message: 'Brak dostępu'
    };
  }
  
  // Pobierz wydarzenia dla danej roli
  const events = getEventsByRole(role);
  
  return {
    success: true,
    message: `Wydarzenia dla roli '${role}' pobrane pomyślnie`,
    data: events
  };
};

/**
 * Obsługuje pobieranie wydarzeń dla określonej grupy
 * @param group Identyfikator grupy
 * @returns Odpowiedź z API z listą wydarzeń dla danej grupy
 */
export const handleGetEventsByGroup = (group: string) => {
  // Sprawdź, czy użytkownik jest zalogowany
  if (!sessionUser) {
    return {
      success: false,
      message: 'Nie jesteś zalogowany'
    };
  }
  
  // Pobierz wydarzenia dla danej grupy
  const events = getEventsByGroup(group);
  
  return {
    success: true,
    message: `Wydarzenia dla grupy '${group}' pobrane pomyślnie`,
    data: events
  };
};

/**
 * Obsługuje pobieranie typów wydarzeń
 * @returns Odpowiedź z API z listą typów wydarzeń
 */
export const handleGetEventTypes = () => {
  // Sprawdź, czy użytkownik jest zalogowany
  if (!sessionUser) {
    return {
      success: false,
      message: 'Nie jesteś zalogowany'
    };
  }
  
  // Pobierz wszystkie typy wydarzeń
  const eventTypes = getAllEventTypes();
  
  return {
    success: true,
    message: 'Typy wydarzeń pobrane pomyślnie',
    data: eventTypes
  };
};

// Nakładka na Axios do obsługi mockowanych endpointów
const mockApiHandler = (config: any): [number, any] => {
  const { url, method, data } = config;
  const requestData = data ? JSON.parse(data) : {};
  
  // Obsługa endpointów autentykacji
  if (url === '/auth/login' && method === 'post') {
    return [200, handleLogin(requestData)];
  }
  
  if (url === '/auth/logout' && method === 'post') {
    return [200, handleLogout()];
  }
  
  if (url === '/auth/check-session' && method === 'get') {
    return [200, handleCheckSession()];
  }
  
  // Obsługa endpointów wydarzeń
  if (url === '/events' && method === 'get') {
    return [200, handleGetEvents()];
  }
  
  if (url.startsWith('/events/role/') && method === 'get') {
    const role = url.split('/').pop() as string;
    return [200, handleGetEventsByRole(role)];
  }
  
  if (url.startsWith('/events/group/') && method === 'get') {
    const group = url.split('/').pop() as string;
    return [200, handleGetEventsByGroup(group)];
  }
  
  if (url === '/event-types' && method === 'get') {
    return [200, handleGetEventTypes()];
  }
  
  // Jeśli nie znaleziono obsługi dla danego endpointu
  return [404, { success: false, message: 'Nie znaleziono endpointu' }];
};

// Tworzenie mocka dla Axios
axios.interceptors.request.use(
  config => {
    // Ustawienie nagłówków JWT (symulacja)
    if (sessionUser) {
      config.headers['Authorization'] = `Bearer mock-jwt-token`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Przechwytywanie odpowiedzi Axios
axios.interceptors.response.use(
  response => response,
  error => {
    // Sprawdź, czy to symulowany błąd
    if (error.config && error.config.url.startsWith('/api')) {
      return Promise.reject({
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Wewnętrzny błąd serwera (symulowany)',
            error: error.message
          }
        }
      });
    }
    return Promise.reject(error);
  }
);

// Dodaj adapter do obsługi mockowanych żądań
axios.defaults.adapter = (config: any) => {
  return new Promise((resolve, reject) => {
    try {
      // Sprawdź, czy URL zaczyna się od /api/
      if (config.url.startsWith('/api/')) {
        // Usuń /api/ z URL
        config.url = config.url.substring(5);
        
        // Obsłuż mockowane żądanie
        const [status, data] = mockApiHandler(config);
        
        // Symuluj opóźnienie sieciowe
        setTimeout(() => {
          resolve({
            data,
            status,
            statusText: status === 200 ? 'OK' : 'Error',
            headers: { 'Content-Type': 'application/json' },
            config,
            request: {}
          });
        }, 300);
      } else {
        // Pozwól na wykonanie rzeczywistego żądania
        reject(new Error('Not a mocked request'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  login,
  logout,
  getCurrentUser,
  hasRole,
  hasAnyRole
}; 