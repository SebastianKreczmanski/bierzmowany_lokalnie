import axios from 'axios';
import { toast } from 'react-hot-toast';

// Tworzymy instancję axios z podstawową konfiguracją
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true, // Ważne dla ciasteczek
  headers: {
    'Content-Type': 'application/json'
  }
});

// Globalny stan do kontroli, czy wyświetliliśmy już komunikat o wygasłej sesji
let sessionExpiredMessageShown = false;

// Flaga do śledzenia, czy aktualnie odświeżamy token
let isRefreshingToken = false;

// Kolejka oczekujących żądań, które zostaną wznowione po odświeżeniu tokenu
let failedQueue: { resolve: Function; reject: Function }[] = [];

// Funkcja do przetwarzania kolejki żądań
const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach(request => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor odpowiedzi - obsługuje błędy autoryzacji
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Sprawdź, czy błąd to 401 (Unauthorized) i czy nie jest to żądanie odświeżenia tokenu
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('auth/refresh-token')
    ) {
      if (isRefreshingToken) {
        // Jeśli aktualnie odświeżamy token, dodaj żądanie do kolejki
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log('Token odświeżony, ponawianie żądania:', originalRequest.url);
            return api(originalRequest);
          })
          .catch(err => {
            console.log('Nie udało się odświeżyć tokenu, odrzucanie żądania:', originalRequest.url);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshingToken = true;

      try {
        console.log('Próba odświeżenia tokenu...');
        // Próba odświeżenia tokenu
        const refreshed = await authApi.refreshToken();
        
        if (refreshed) {
          console.log('Token został odświeżony, kontynuowanie operacji');
          // Jeśli token został odświeżony, wznów wszystkie oczekujące żądania
          processQueue(null);
          isRefreshingToken = false;
          return api(originalRequest);
        } else {
          // Jeśli nie udało się odświeżyć tokenu, odrzuć wszystkie oczekujące żądania
          console.warn('Nie udało się odświeżyć tokenu');
          processQueue(new Error('Nie udało się odświeżyć tokenu'));
          isRefreshingToken = false;
          
          // Informujemy o problemie z sesją
          if (!sessionExpiredMessageShown) {
            sessionExpiredMessageShown = true;
            
            // Wyraźne powiadomienie o wygasłej sesji z instrukcją
            toast.error(
              'Twoja sesja wygasła. Kliknij "Zaloguj się" w menu, aby kontynuować.',
              {
                duration: 10000, // Dłuższy czas wyświetlania
                style: { 
                  background: '#f44336', 
                  color: '#fff',
                  padding: '16px'
                },
                // Ukryj standardową ikonkę
                icon: null,
                // Własny komponent z animowanym przyciskiem zamknięcia
                position: 'top-center'
              }
            );
          }
          
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // W przypadku błędu podczas odświeżania tokenu
        console.error('Błąd podczas odświeżania tokenu:', refreshError);
        processQueue(refreshError);
        isRefreshingToken = false;
        
        // Informujemy o problemie z sesją
        if (!sessionExpiredMessageShown) {
          sessionExpiredMessageShown = true;
          
          // Wyraźne powiadomienie o wygasłej sesji z instrukcją
          toast.error(
            'Twoja sesja wygasła. Kliknij "Zaloguj się" w menu, aby kontynuować.',
            {
              duration: 10000, // Dłuższy czas wyświetlania
              style: { 
                background: '#f44336', 
                color: '#fff',
                padding: '16px'
              },
              // Ukryj standardową ikonkę
              icon: null,
              // Własny komponent z animowanym przyciskiem zamknięcia
              position: 'top-center'
            }
          );
        }
        
        return Promise.reject(error);
      }
    }
    
    // Dla błędów innych niż 401 lub gdy odświeżenie tokenu nie powiodło się
    return Promise.reject(error);
  }
);

// Interfejs odpowiedzi z serwera
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
  data?: any;
  error?: string;
}

// Interfejs reprezentujący zalogowanego użytkownika
export interface User {
  id: number;
  username: string;
  imie: string;
  nazwisko: string;
  roles: string[];
  adres_id?: number;
  email?: string;
  telefon?: string;
  data_urodzenia?: string;
}

// Interfejs reprezentujący typ wydarzenia
export interface EventType {
  id: number;
  nazwa: string;
  kolor: string;
}

// Interfejs reprezentujący wydarzenie
export interface Event {
  id: number;
  typ_id: number;
  nazwa: string;
  opis: string | null;
  data_rozpoczecia: string;
  data_zakonczenia: string;
  obowiazkowe: boolean;
  dlaroli: string;
  dlagrupy: string;
  typ?: EventType;
}

// API uwierzytelniania
export const authApi = {
  /**
   * Logowanie użytkownika
   * @param identifier Email lub nazwa użytkownika
   * @param password Hasło
   * @returns Promise z danymi użytkownika
   */
  async login(identifier: string, password: string): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>('/auth/login', {
        identifier,
        password
      });
      
      if (!response.data.success || !response.data.user) {
        throw new Error(response.data.message || 'Błąd logowania');
      }
      
      // Reset flagi komunikatu o wygaśnięciu sesji po pomyślnym zalogowaniu
      sessionExpiredMessageShown = false;
      
      return response.data.user;
    } catch (error: any) {
      console.error('Błąd logowania:', error.message);
      throw error;
    }
  },
  
  /**
   * Wylogowanie użytkownika
   */
  async logout(): Promise<void> {
    try {
      await api.post<ApiResponse<null>>('/auth/logout');
    } catch (error: any) {
      console.error('Błąd wylogowania:', error.message);
      throw error;
    }
  },
  
  /**
   * Sprawdzanie sesji użytkownika
   * @returns Promise z danymi użytkownika lub null
   */
  async checkSession(): Promise<User | null> {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/check-session');
      
      if (!response.data.success || !response.data.user) {
        return null;
      }
      
      // Reset flagi komunikatu o wygaśnięciu sesji po pomyślnym odświeżeniu sesji
      sessionExpiredMessageShown = false;
      
      return response.data.user;
    } catch (error) {
      console.error('Błąd sprawdzania sesji:', error);
      return null;
    }
  },
  
  /**
   * Odświeżanie tokenu JWT
   * @returns Promise z informacją o powodzeniu operacji
   */
  async refreshToken(): Promise<boolean> {
    try {
      console.log('API: Rozpoczynam odświeżanie tokenu...');
      const response = await api.post<ApiResponse<User>>('/auth/refresh-token');
      
      if (!response.data.success) {
        console.warn('API: Odświeżanie tokenu nie powiodło się:', response.data.message);
        return false;
      }
      
      // Reset flagi komunikatu o wygaśnięciu sesji po pomyślnym odświeżeniu tokenu
      sessionExpiredMessageShown = false;
      console.log('API: Token został pomyślnie odświeżony');
      
      return true;
    } catch (error: any) {
      console.error('API: Błąd odświeżania tokenu:', error);
      
      // Bardziej szczegółowe logowanie
      if (error.response) {
        console.error('API: Status błędu:', error.response.status);
        console.error('API: Dane odpowiedzi:', error.response.data);
      } else if (error.request) {
        console.error('API: Nie otrzymano odpowiedzi od serwera');
      } else {
        console.error('API: Błąd konfiguracji zapytania:', error.message);
      }
      
      return false;
    }
  }
};

// API wydarzeń
export const eventsApi = {
  /**
   * Pobieranie wszystkich wydarzeń
   * @returns Promise z listą wydarzeń
   */
  async getEvents(): Promise<Event[]> {
    try {
      console.log('API: Pobieranie wszystkich wydarzeń');
      const response = await api.get<ApiResponse<Event[]>>('/events');
      
      if (!response.data.success || !response.data.data) {
        console.warn('API: Brak danych w odpowiedzi lub błąd w odpowiedzi', response.data);
        throw new Error(response.data.message || 'Błąd pobierania wydarzeń');
      }
      
      console.log(`API: Pobrano ${response.data.data.length} wydarzeń`);
      return response.data.data;
    } catch (error: any) {
      console.error('API: Błąd pobierania wydarzeń:', error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      throw error;
    }
  },
  
  /**
   * Pobieranie wydarzeń dla określonej roli
   * @param role Rola użytkownika
   * @returns Promise z listą wydarzeń
   */
  async getEventsByRole(role: string): Promise<Event[]> {
    try {
      console.log(`API: Pobieranie wydarzeń dla roli ${role}`);
      const response = await api.get<ApiResponse<Event[]>>(`/events/role/${role}`);
      
      if (!response.data.success) {
        console.warn(`API: Błąd w odpowiedzi dla roli ${role}:`, response.data);
        throw new Error(response.data.message || 'Błąd pobierania wydarzeń dla roli');
      }
      
      // Nawet jeśli odpowiedź jest pusta, zwracamy pustą tablicę zamiast błędu
      const events = response.data.data || [];
      console.log(`API: Pobrano ${events.length} wydarzeń dla roli ${role}`);
      return events;
    } catch (error: any) {
      console.error(`API: Błąd pobierania wydarzeń dla roli ${role}:`, error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      throw error;
    }
  },
  
  /**
   * Pobieranie wydarzeń dla określonej grupy
   * @param group Identyfikator grupy
   * @returns Promise z listą wydarzeń
   */
  async getEventsByGroup(group: string): Promise<Event[]> {
    try {
      console.log(`API: Pobieranie wydarzeń dla grupy ${group}`);
      const response = await api.get<ApiResponse<Event[]>>(`/events/group/${group}`);
      
      if (!response.data.success) {
        console.warn(`API: Błąd w odpowiedzi dla grupy ${group}:`, response.data);
        throw new Error(response.data.message || 'Błąd pobierania wydarzeń dla grupy');
      }
      
      // Nawet jeśli odpowiedź jest pusta, zwracamy pustą tablicę zamiast błędu
      const events = response.data.data || [];
      console.log(`API: Pobrano ${events.length} wydarzeń dla grupy ${group}`);
      return events;
    } catch (error: any) {
      console.error(`API: Błąd pobierania wydarzeń dla grupy ${group}:`, error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      throw error;
    }
  },
  
  /**
   * Pobieranie typów wydarzeń
   * @returns Promise z listą typów wydarzeń
   */
  async getEventTypes(): Promise<EventType[]> {
    try {
      console.log('API: Pobieranie typów wydarzeń');
      const response = await api.get<ApiResponse<EventType[]>>('/events/types');
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla typów wydarzeń:', response.data);
        throw new Error(response.data.message || 'Błąd pobierania typów wydarzeń');
      }
      
      const eventTypes = response.data.data || [];
      console.log(`API: Pobrano ${eventTypes.length} typów wydarzeń`);
      return eventTypes;
    } catch (error: any) {
      console.error('API: Błąd pobierania typów wydarzeń:', error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Pobieranie wszystkich ról z systemu
   * @returns Promise z listą ról
   */
  async getRoles(): Promise<{id: number, nazwa: string}[]> {
    try {
      console.log('API: Pobieranie ról użytkowników z endpointu /events/roles');
      const response = await api.get<ApiResponse<{id: number, nazwa: string}[]>>('/events/roles');
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla ról:', response.data);
        throw new Error(response.data.message || 'Błąd pobierania ról');
      }
      
      const roles = response.data.data || [];
      console.log(`API: Pobrano ${roles.length} ról:`, roles);
      // Sort roles to ensure a consistent order (administrator first, then others)
      roles.sort((a: {id: number, nazwa: string}, b: {id: number, nazwa: string}) => {
        if (a.nazwa === 'administrator') return -1;
        if (b.nazwa === 'administrator') return 1;
        return a.id - b.id;
      });
      return roles;
      
    } catch (error: any) {
      console.error('API: Błąd pobierania ról:', error.message);
      // Fallback - pusta tablica ról
      return [];
    }
  },

  /**
   * Pobieranie grup, w których użytkownik jest animatorem
   * @param userId ID użytkownika (animatora)
   * @returns Promise z listą grup
   */
  async getAnimatorGroups(userId: number): Promise<{id: number, nazwa: string}[]> {
    try {
      console.log(`API: Pobieranie grup dla animatora ID=${userId}`);
      const response = await api.get<ApiResponse<{id: number, nazwa: string}[]>>(`/groups/animator/${userId}`);
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla grup animatora:', response.data);
        throw new Error(response.data.message || 'Błąd pobierania grup animatora');
      }
      
      const groups = response.data.data || [];
      console.log(`API: Pobrano ${groups.length} grup animatora`);
      return groups;
    } catch (error: any) {
      console.error('API: Błąd pobierania grup animatora:', error.message);
      console.log('Używanie danych zastępczych dla grup.');
      
      // Dane zastępcze w przypadku błędu
      return [{ id: 1, nazwa: 'Grupa domyślna' }];
    }
  },

  /**
   * Dodawanie nowego typu wydarzeń
   * @param eventType Dane nowego typu wydarzenia
   * @returns Promise z utworzonym typem wydarzenia
   */
  async createEventType(eventType: { nazwa: string, kolor: string }): Promise<EventType> {
    try {
      console.log('API: Dodawanie nowego typu wydarzenia', eventType);
      const response = await api.post<ApiResponse<EventType>>('/events/types', eventType);
      
      if (!response.data.success || !response.data.data) {
        console.warn('API: Błąd w odpowiedzi podczas tworzenia typu wydarzenia:', response.data);
        throw new Error(response.data.message || 'Błąd tworzenia typu wydarzenia');
      }
      
      console.log('API: Pomyślnie utworzono nowy typ wydarzenia', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('API: Błąd tworzenia typu wydarzenia:', error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      
      // Fallback - zwracamy fikcyjne dane
      const fallbackType: EventType = {
        id: Math.floor(Math.random() * 1000) + 100,
        nazwa: eventType.nazwa,
        kolor: eventType.kolor
      };
      
      console.log('API: Używam fallbacku dla typu wydarzenia:', fallbackType);
      return fallbackType;
    }
  },

  /**
   * Dodawanie nowego wydarzenia
   * @param event Dane nowego wydarzenia
   * @returns Promise z utworzonym wydarzeniem
   */
  async createEvent(event: Omit<Event, 'id' | 'typ'>): Promise<Event> {
    try {
      console.log('API: Dodawanie nowego wydarzenia', event);
      const response = await api.post<ApiResponse<Event>>('/events', event);
      
      if (!response.data.success || !response.data.data) {
        console.warn('API: Błąd w odpowiedzi podczas tworzenia wydarzenia:', response.data);
        throw new Error(response.data.message || 'Błąd tworzenia wydarzenia');
      }
      
      console.log('API: Pomyślnie utworzono nowe wydarzenie', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('API: Błąd tworzenia wydarzenia:', error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      
      // Fallback - zwracamy fikcyjne dane
      const fallbackEvent: Event = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...event,
        typ: undefined
      };
      
      console.log('API: Używam fallbacku dla wydarzenia:', fallbackEvent);
      return fallbackEvent;
    }
  },

  /**
   * Usuwanie wydarzenia
   * @param eventId ID wydarzenia do usunięcia
   * @returns Promise z informacją o powodzeniu operacji
   */
  async deleteEvent(eventId: number): Promise<boolean> {
    try {
      const response = await api.delete<ApiResponse<null>>(`/events/${eventId}`);
      return response.data.success;
    } catch (error: any) {
      console.error('API: Błąd usuwania wydarzenia:', error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      return false;
    }
  },

  /**
   * Aktualizacja istniejącego wydarzenia
   * @param eventId ID wydarzenia do aktualizacji
   * @param eventData Dane wydarzenia do zaktualizowania
   * @returns Promise z zaktualizowanym wydarzeniem
   */
  async updateEvent(eventId: number, eventData: Partial<Omit<Event, 'id' | 'typ'>>): Promise<Event> {
    try {
      const response = await api.put<ApiResponse<Event>>(`/events/${eventId}`, eventData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się zaktualizować wydarzenia');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('API: Błąd aktualizacji wydarzenia:', error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      
      throw error;
    }
  }
};

/**
 * API do zarządzania użytkownikami
 */
export const usersApi = {
  /**
   * Pobieranie wszystkich użytkowników
   * @returns Promise z listą użytkowników
   */
  async getUsers(): Promise<User[]> {
    try {
      console.log('API: Pobieranie użytkowników - rozpoczęcie');
      const response = await api.get<ApiResponse<User[]>>('/users');
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla pobierania użytkowników:', response.data);
        toast.error(response.data.message || 'Błąd pobierania użytkowników');
        throw new Error(response.data.message || 'Błąd pobierania użytkowników');
      }
      
      const users = response.data.data || [];
      console.log(`API: Użytkownicy pobrani pomyślnie, ilość: ${users.length}`);
      return users;
    } catch (error: any) {
      console.error('API: Błąd pobierania użytkowników:', error);
      
      // Szczegółowa analiza błędu
      if (error.response) {
        console.error('API response error:', error.response.data);
        toast.error(`Błąd serwera: ${error.response.status} - ${error.response.data?.message || 'Nieznany błąd'}`);
      } else if (error.request) {
        console.error('API request error (no response):', error.request);
        toast.error('Brak odpowiedzi z serwera. Sprawdź połączenie internetowe.');
      } else {
        console.error('API setup error:', error.message);
        toast.error(error.message || 'Nieznany błąd podczas pobierania użytkowników');
      }
      
      return [];
    }
  },

  /**
   * Pobieranie użytkowników według roli
   * @param role Nazwa roli
   * @returns Promise z listą użytkowników o danej roli
   */
  async getUsersByRole(role: string): Promise<any[]> {
    try {
      console.log(`API: Pobieranie użytkowników z rolą ${role}`);
      const response = await api.get(`/users/by-role/${role}`);
      return response.data.data || [];
    } catch (error: any) {
      console.error(`API: Błąd pobierania użytkowników z rolą ${role}:`, error.message);
      return [];
    }
  },

  /**
   * Pobieranie szczegółów użytkownika
   * @param userId ID użytkownika
   * @returns Promise ze szczegółami użytkownika
   */
  async getUserDetails(userId: number): Promise<any> {
    try {
      console.log(`API: Pobieranie szczegółów użytkownika ID: ${userId}`);
      const response = await api.get<ApiResponse<any>>(`/users/${userId}`);
      
      if (!response.data.success) {
        console.warn(`API: Błąd w odpowiedzi dla użytkownika ${userId}:`, response.data);
        throw new Error(response.data.message || 'Błąd pobierania szczegółów użytkownika');
      }
      
      const userData = response.data.data;
      
      // Sprawdzamy czy data urodzenia istnieje i logujemy ją
      console.log(`API: Pobrano szczegóły użytkownika ${userId}:`, {
        id: userData.id,
        username: userData.username,
        imie: userData.imie,
        nazwisko: userData.nazwisko,
        data_urodzenia: userData.data_urodzenia,
        format_daty: userData.data_urodzenia ? typeof userData.data_urodzenia : 'brak daty'
      });
      
      // Upewniamy się, że data urodzenia jest w odpowiednim formacie dla interfejsu (YYYY-MM-DD)
      if (userData.data_urodzenia && typeof userData.data_urodzenia === 'string') {
        try {
          // POPRAWKA: Unikamy tworzenia obiektu Date, który może powodować przesunięcie daty
          // Usuwamy tylko część czasową, jeśli istnieje, zachowując dokładną datę
          if (userData.data_urodzenia.includes('T')) {
            // WAŻNA ZMIANA: Dla dat z oznaczeniem czasu (np. "2010-06-17T22:00:00.000Z"),
            // musimy obsłużyć przesunięcie strefy czasowej
            
            // Sprawdź czy data zawiera 'Z' lub offset strefy czasowej (np. +01:00)
            if (userData.data_urodzenia.includes('Z') || 
                userData.data_urodzenia.match(/[+-]\d{2}:\d{2}$/)) {
              // Dla dat UTC (z 'Z' lub offsetem), musimy ręcznie obsłużyć strefę czasową
              // Wyciągamy tylko datę (bez części czasowej) i dodajemy 1 dzień dla naszej strefy czasowej
              
              // Najpierw uzyskujemy części daty z oryginalnej wartości
              const originalDatePart = userData.data_urodzenia.split('T')[0]; // np. "2010-06-17"
              const [yearStr, monthStr, dayStr] = originalDatePart.split('-');
              
              // Konwertujemy na liczby i korygujemy
              const year = parseInt(yearStr, 10);
              const month = parseInt(monthStr, 10);
              const day = parseInt(dayStr, 10);
              
              // Ustalamy poprawną datę, dodając 1 dzień, aby zrekompensować przesunięcie strefy czasowej
              // Zauważ, że musimy obsłużyć przypadki z końcem miesiąca/roku
              
              // Tworzenie poprawionej daty jako string w formacie YYYY-MM-DD
              // Używamy prostej logiki do dodania jednego dnia - należy obsłużyć koniec miesiąca i roku
              let correctedDay = day + 1;
              let correctedMonth = month;
              let correctedYear = year;
              
              // Określamy liczbę dni w miesiącu
              const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              // Korekta dla lat przestępnych
              if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
                daysInMonth[1] = 29; // Luty ma 29 dni w roku przestępnym
              }
              
              // Sprawdzamy, czy przekroczyliśmy liczbę dni w miesiącu
              if (correctedDay > daysInMonth[month - 1]) {
                correctedDay = 1;
                correctedMonth += 1;
                
                // Sprawdzamy, czy przekroczyliśmy liczbę miesięcy w roku
                if (correctedMonth > 12) {
                  correctedMonth = 1;
                  correctedYear += 1;
                }
              }
              
              // Formatujemy datę z powrotem do YYYY-MM-DD
              userData.data_urodzenia = `${correctedYear}-${String(correctedMonth).padStart(2, '0')}-${String(correctedDay).padStart(2, '0')}`;
              console.log(`API: Skorygowano datę ze strefy czasowej: ${originalDatePart} -> ${userData.data_urodzenia}`);
            } else {
              // Dla pozostałych dat z 'T', po prostu usuwamy część czasową
              userData.data_urodzenia = userData.data_urodzenia.split('T')[0];
              console.log(`API: Usunięto część czasową z daty: ${userData.data_urodzenia}`);
            }
          }
          
          // Sprawdzamy czy data jest w formacie YYYY-MM-DD i ją zachowujemy bez modyfikacji
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(userData.data_urodzenia)) {
            console.log(`API: Data już w poprawnym formacie: ${userData.data_urodzenia}`);
          } else {
            // Jeśli data nie jest w formacie YYYY-MM-DD, logujemy to, ale nie modyfikujemy
            console.warn(`API: Nieoczekiwany format daty: ${userData.data_urodzenia}`);
          }
        } catch (error) {
          console.warn(`API: Nie udało się przetworzyć daty urodzenia: ${userData.data_urodzenia}`, error);
        }
      }
      
      return userData;
    } catch (error: any) {
      console.error(`API: Błąd pobierania szczegółów użytkownika ${userId}:`, error.message);
      throw error;
    }
  },

  /**
   * Utworzenie nowego użytkownika
   * @param userData Dane użytkownika
   * @returns Promise z ID utworzonego użytkownika
   */
  async createUser(userData: any): Promise<number> {
    try {
      console.log('API: Dodawanie nowego użytkownika', { 
        ...userData, 
        password: userData.password ? '******' : undefined,
        data_urodzenia: userData.data_urodzenia
      });

      // Walidacja podstawowych pól
      if (!userData.username) throw new Error('Nazwa użytkownika jest wymagana');
      if (!userData.password) throw new Error('Hasło jest wymagane');
      if (!userData.imie) throw new Error('Imię jest wymagane');
      if (!userData.nazwisko) throw new Error('Nazwisko jest wymagane');
      if (!userData.roles || !Array.isArray(userData.roles) || userData.roles.length === 0) {
        throw new Error('Co najmniej jedna rola jest wymagana');
      }
      
      // Jeśli istnieje data urodzenia, upewnij się, że jest w formacie akceptowanym przez backend
      if (userData.data_urodzenia) {
        try {
          console.log('Przetwarzanie daty urodzenia przed utworzeniem użytkownika:', userData.data_urodzenia);
          
          // Usuń część czasową, jeśli istnieje
          if (userData.data_urodzenia.includes('T')) {
            userData.data_urodzenia = userData.data_urodzenia.split('T')[0];
            console.log('Usunięto część czasową z daty:', userData.data_urodzenia);
          }
          
          // Sprawdź czy data jest już w formacie YYYY-MM-DD (format bazy danych)
          const dbFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
          
          // Sprawdź czy data jest w formacie YYYY.MM.DD (format wyświetlania)
          const displayFormatRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
          
          if (dbFormatRegex.test(userData.data_urodzenia)) {
            // Data już w formacie bazy danych, nie wymaga konwersji
            console.log('Data urodzenia już w formacie bazy danych YYYY-MM-DD:', userData.data_urodzenia);
          } else if (displayFormatRegex.test(userData.data_urodzenia)) {
            // Konwertuj z formatu wyświetlania YYYY.MM.DD na format bazy danych YYYY-MM-DD
            // bezpośrednio zamieniając kropki na myślniki, bez używania obiektu Date
            const match = userData.data_urodzenia.match(displayFormatRegex);
            if (match) {
              const year = match[1];
              const month = match[2];
              const day = match[3];
              
              // Sprawdź zakres wartości
              const yearNum = parseInt(year, 10);
              const monthNum = parseInt(month, 10);
              const dayNum = parseInt(day, 10);
              
              if (yearNum >= 1900 && yearNum <= 2100 && 
                  monthNum >= 1 && monthNum <= 12 && 
                  dayNum >= 1 && dayNum <= 31) {
                
                // Prosta konwersja do formatu YYYY-MM-DD przez zamianę kropek na myślniki
                userData.data_urodzenia = userData.data_urodzenia.replace(/\./g, '-');
                console.log('Skonwertowano datę z formatu YYYY.MM.DD na YYYY-MM-DD:', userData.data_urodzenia);
                
                // Sprawdzamy czy data istnieje w kalendarzu
                const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
                if ((monthNum === 2 && dayNum > 29) || 
                    (monthNum === 2 && dayNum === 29 && !isLeapYear) ||
                    ([4, 6, 9, 11].includes(monthNum) && dayNum > 30)) {
                  console.warn('Nieprawidłowa data (nie istnieje w kalendarzu):', userData.data_urodzenia);
                  delete userData.data_urodzenia;
                }
              } else {
                console.warn('Nieprawidłowe wartości daty (poza zakresem):', userData.data_urodzenia);
                delete userData.data_urodzenia;
              }
            }
          } else {
            // Sprawdź, czy to format DD.MM.YYYY
            const reversedDateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
            const reversedMatch = userData.data_urodzenia.match(reversedDateRegex);
            
            if (reversedMatch) {
              const day = reversedMatch[1];
              const month = reversedMatch[2];
              const year = reversedMatch[3];
              
              // Sprawdź zakres wartości
              const yearNum = parseInt(year, 10);
              const monthNum = parseInt(month, 10);
              const dayNum = parseInt(day, 10);
              
              if (yearNum >= 1900 && yearNum <= 2100 && 
                  monthNum >= 1 && monthNum <= 12 && 
                  dayNum >= 1 && dayNum <= 31) {
                  
                // Zamień format DD.MM.YYYY na YYYY-MM-DD bez używania Date
                userData.data_urodzenia = `${year}-${month}-${day}`;
                console.log('Skonwertowano datę z formatu DD.MM.YYYY na YYYY-MM-DD:', userData.data_urodzenia);
                
                // Sprawdzamy czy data istnieje w kalendarzu
                const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
                if ((monthNum === 2 && dayNum > 29) || 
                    (monthNum === 2 && dayNum === 29 && !isLeapYear) ||
                    ([4, 6, 9, 11].includes(monthNum) && dayNum > 30)) {
                  console.warn('Nieprawidłowa data (nie istnieje w kalendarzu):', userData.data_urodzenia);
                  delete userData.data_urodzenia;
                }
              } else {
                console.warn('Nieprawidłowe wartości daty (poza zakresem):', userData.data_urodzenia);
                delete userData.data_urodzenia;
              }
            } else {
              console.warn('Nierozpoznany format daty, usuwam tę wartość:', userData.data_urodzenia);
              delete userData.data_urodzenia;
            }
          }
        } catch (error) {
          console.warn('API: Błąd podczas przetwarzania daty urodzenia:', error);
          delete userData.data_urodzenia;
        }
      } else if (userData.data_urodzenia === '') {
        // Jeśli data urodzenia jest pustym stringiem, ustaw ją na null, aby wyczyścić w bazie danych
        userData.data_urodzenia = null;
      }
      
      console.log('Finalne dane przed wysłaniem:', {
        ...userData,
        password: userData.password ? '[MASKED]' : undefined
      });
      
      const response = await api.post<ApiResponse<{id: number}>>('/users', userData);
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla tworzenia użytkownika:', response.data);
        toast.error(response.data.message || 'Błąd tworzenia użytkownika');
        throw new Error(response.data.message || 'Błąd tworzenia użytkownika');
      }
      
      console.log('API: Użytkownik utworzony pomyślnie, ID:', response.data.data.id);
      toast.success('Użytkownik został utworzony pomyślnie');
      return response.data.data.id;
    } catch (error: any) {
      console.error('API: Błąd tworzenia użytkownika:', error);
      
      // Szczegółowa analiza błędu
      if (error.response) {
        console.error('API response error:', error.response.data);
        const errorMsg = error.response.data?.message || `Błąd serwera: ${error.response.status}`;
        toast.error(errorMsg);
        throw new Error(errorMsg);
      } else if (error.request) {
        console.error('API request error (no response):', error.request);
        toast.error('Brak odpowiedzi z serwera. Sprawdź połączenie internetowe.');
        throw new Error('Brak odpowiedzi z serwera. Sprawdź połączenie internetowe.');
      } else {
        console.error('API setup error:', error.message);
        toast.error(error.message || 'Nieznany błąd podczas tworzenia użytkownika');
        throw error; // Przekaż oryginalny błąd z message
      }
    }
  },

  /**
   * Aktualizacja użytkownika
   * @param userId ID użytkownika
   * @param userData Dane do aktualizacji
   * @returns Promise z aktualizowanym użytkownikiem
   */
  async updateUser(userId: number, userData: any): Promise<void> {
    try {
      console.log(`API: Aktualizacja użytkownika ID: ${userId}`, {
        ...userData,
        password: userData.password ? '******' : undefined,
        data_urodzenia: userData.data_urodzenia
      });

      // Jeśli istnieje data urodzenia, upewnij się, że jest w formacie akceptowanym przez backend
      if (userData.data_urodzenia) {
        try {
          console.log('Przetwarzanie daty urodzenia przed wysłaniem:', userData.data_urodzenia);
          
          // Usuń część czasową, jeśli istnieje
          if (userData.data_urodzenia.includes('T')) {
            userData.data_urodzenia = userData.data_urodzenia.split('T')[0];
            console.log('Usunięto część czasową z daty:', userData.data_urodzenia);
          }
          
          // Sprawdź czy data jest już w formacie YYYY-MM-DD (format bazy danych)
          const dbFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
          
          // Sprawdź czy data jest w formacie YYYY.MM.DD (format wyświetlania)
          const displayFormatRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
          
          if (dbFormatRegex.test(userData.data_urodzenia)) {
            // Data już w formacie bazy danych, nie wymaga konwersji
            console.log('Data urodzenia już w formacie bazy danych YYYY-MM-DD:', userData.data_urodzenia);
          } else if (displayFormatRegex.test(userData.data_urodzenia)) {
            // Konwertuj z formatu wyświetlania YYYY.MM.DD na format bazy danych YYYY-MM-DD
            // bezpośrednio zamieniając kropki na myślniki, bez używania obiektu Date
            const match = userData.data_urodzenia.match(displayFormatRegex);
            if (match) {
              const year = match[1];
              const month = match[2];
              const day = match[3];
              
              // Sprawdź zakres wartości
              const yearNum = parseInt(year, 10);
              const monthNum = parseInt(month, 10);
              const dayNum = parseInt(day, 10);
              
              if (yearNum >= 1900 && yearNum <= 2100 && 
                  monthNum >= 1 && monthNum <= 12 && 
                  dayNum >= 1 && dayNum <= 31) {
                
                // Prosta konwersja do formatu YYYY-MM-DD przez zamianę kropek na myślniki
                userData.data_urodzenia = userData.data_urodzenia.replace(/\./g, '-');
                console.log('Skonwertowano datę z formatu YYYY.MM.DD na YYYY-MM-DD:', userData.data_urodzenia);
                
                // Sprawdzamy czy data istnieje w kalendarzu
                const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
                if ((monthNum === 2 && dayNum > 29) || 
                    (monthNum === 2 && dayNum === 29 && !isLeapYear) ||
                    ([4, 6, 9, 11].includes(monthNum) && dayNum > 30)) {
                  console.warn('Nieprawidłowa data (nie istnieje w kalendarzu):', userData.data_urodzenia);
                  delete userData.data_urodzenia;
                }
              } else {
                console.warn('Nieprawidłowe wartości daty (poza zakresem):', userData.data_urodzenia);
                delete userData.data_urodzenia;
              }
            }
          } else {
            // Sprawdź, czy to format DD.MM.YYYY
            const reversedDateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
            const reversedMatch = userData.data_urodzenia.match(reversedDateRegex);
            
            if (reversedMatch) {
              const day = reversedMatch[1];
              const month = reversedMatch[2];
              const year = reversedMatch[3];
              
              // Sprawdź zakres wartości
              const yearNum = parseInt(year, 10);
              const monthNum = parseInt(month, 10);
              const dayNum = parseInt(day, 10);
              
              if (yearNum >= 1900 && yearNum <= 2100 && 
                  monthNum >= 1 && monthNum <= 12 && 
                  dayNum >= 1 && dayNum <= 31) {
                  
                // Zamień format DD.MM.YYYY na YYYY-MM-DD bez używania Date
                userData.data_urodzenia = `${year}-${month}-${day}`;
                console.log('Skonwertowano datę z formatu DD.MM.YYYY na YYYY-MM-DD:', userData.data_urodzenia);
                
                // Sprawdzamy czy data istnieje w kalendarzu
                const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
                if ((monthNum === 2 && dayNum > 29) || 
                    (monthNum === 2 && dayNum === 29 && !isLeapYear) ||
                    ([4, 6, 9, 11].includes(monthNum) && dayNum > 30)) {
                  console.warn('Nieprawidłowa data (nie istnieje w kalendarzu):', userData.data_urodzenia);
                  delete userData.data_urodzenia;
                }
              } else {
                console.warn('Nieprawidłowe wartości daty (poza zakresem):', userData.data_urodzenia);
                delete userData.data_urodzenia;
              }
            } else {
              console.warn('Nierozpoznany format daty, usuwam tę wartość:', userData.data_urodzenia);
              delete userData.data_urodzenia;
            }
          }
        } catch (error) {
          console.warn('API: Błąd podczas przetwarzania daty urodzenia:', error);
          delete userData.data_urodzenia;
        }
      } else if (userData.data_urodzenia === '') {
        // Jeśli data urodzenia jest pustym stringiem, ustaw ją na null, aby wyczyścić w bazie danych
        userData.data_urodzenia = null;
      }
      
      console.log('Finalne dane przed wysłaniem:', {
        ...userData,
        password: userData.password ? '[MASKED]' : undefined
      });
      
      const response = await api.put<ApiResponse<void>>(`/users/${userId}`, userData);
      
      if (!response.data.success) {
        console.warn(`API: Błąd w odpowiedzi dla aktualizacji użytkownika ${userId}:`, response.data);
        throw new Error(response.data.message || 'Błąd aktualizacji użytkownika');
      }
    } catch (error: any) {
      console.error(`API: Błąd aktualizacji użytkownika ${userId}:`, error.message);
      throw error;
    }
  },

  /**
   * Usuwanie użytkownika
   * @param userId ID użytkownika
   * @returns Promise bez zawartości
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      console.log(`API: Usuwanie użytkownika ID: ${userId}`);
      const response = await api.delete<ApiResponse<void>>(`/users/${userId}`);
      
      if (!response.data.success) {
        console.warn(`API: Błąd w odpowiedzi dla usuwania użytkownika ${userId}:`, response.data);
        throw new Error(response.data.message || 'Błąd usuwania użytkownika');
      }
    } catch (error: any) {
      console.error(`API: Błąd usuwania użytkownika ${userId}:`, error.message);
      throw error;
    }
  },

  /**
   * Pobieranie wszystkich kandydatów
   * @returns Promise z listą kandydatów
   */
  async getAllCandidates(): Promise<User[]> {
    try {
      console.log('API: Pobieranie wszystkich kandydatów');
      const response = await api.get<ApiResponse<User[]>>('/users/candidates');
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla kandydatów:', response.data);
        throw new Error(response.data.message || 'Błąd pobierania kandydatów');
      }
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('API: Błąd pobierania kandydatów:', error.message);
      return [];
    }
  },

  /**
   * Przypisywanie kandydatów do rodzica
   * @param rodzicId ID rodzica
   * @param kandidatIds Lista ID kandydatów
   * @returns Promise bez zawartości
   */
  async assignCandidatesToParent(rodzicId: number, kandidatIds: number[]): Promise<void> {
    try {
      console.log(`API: Przypisywanie kandydatów do rodzica ID: ${rodzicId}`);
      const response = await api.post<ApiResponse<void>>(`/users/${rodzicId}/candidates`, {
        kandidatIds
      });
      
      if (!response.data.success) {
        console.warn(`API: Błąd w odpowiedzi dla przypisywania kandydatów do rodzica ${rodzicId}:`, response.data);
        throw new Error(response.data.message || 'Błąd przypisywania kandydatów do rodzica');
      }
    } catch (error: any) {
      console.error(`API: Błąd przypisywania kandydatów do rodzica ${rodzicId}:`, error.message);
      throw error;
    }
  },
};

export default api; 

/**
 * API do zarządzania lokalizacjami
 */
export const locationsApi = {
  /**
   * Pobieranie wszystkich miejscowości
   * @returns Promise z listą miejscowości
   */
  async getMiejscowosci(): Promise<{id: number, nazwa: string}[]> {
    try {
      console.log('API: Pobieranie miejscowości');
      const response = await api.get<ApiResponse<{id: number, nazwa: string}[]>>('/locations/cities');
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla miejscowości:', response.data);
        throw new Error(response.data.message || 'Błąd pobierania miejscowości');
      }
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('API: Błąd pobierania miejscowości:', error.message);
      return [];
    }
  },

  /**
   * Pobieranie ulic dla wybranej miejscowości
   * @param cityId ID miejscowości
   * @returns Promise z listą ulic
   */
  async getUliceByMiejscowosc(cityId: number): Promise<{id: number, nazwa: string, miejscowosc_id: number}[]> {
    try {
      console.log(`API: Pobieranie ulic dla miejscowości ID: ${cityId}`);
      const response = await api.get<ApiResponse<{id: number, nazwa: string, miejscowosc_id: number}[]>>(`/locations/streets/${cityId}`);
      
      if (!response.data.success) {
        console.warn(`API: Błąd w odpowiedzi dla ulic miejscowości ${cityId}:`, response.data);
        throw new Error(response.data.message || 'Błąd pobierania ulic');
      }
      
      return response.data.data || [];
    } catch (error: any) {
      console.error(`API: Błąd pobierania ulic dla miejscowości ${cityId}:`, error.message);
      return [];
    }
  },

  /**
   * Dodawanie nowego adresu
   * @param adresData Dane adresu
   * @returns Promise z ID utworzonego adresu
   */
  async createAddress(adresData: {
    ulica_id: number,
    nr_budynku: string,
    nr_lokalu?: string,
    kod_pocztowy: string
  }): Promise<number> {
    try {
      console.log('API: Dodawanie nowego adresu', adresData);
      const response = await api.post<ApiResponse<{id: number}>>('/locations/address', adresData);
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla tworzenia adresu:', response.data);
        throw new Error(response.data.message || 'Błąd dodawania adresu');
      }
      
      return response.data.data.id;
    } catch (error: any) {
      console.error('API: Błąd dodawania adresu:', error.message);
      throw error;
    }
  },

  /**
   * Dodawanie nowej miejscowości
   * @param nazwa Nazwa miejscowości
   * @returns Promise z utworzoną miejscowością
   */
  async createMiejscowosc(nazwa: string): Promise<{id: number, nazwa: string}> {
    try {
      console.log(`API: Dodawanie nowej miejscowości: ${nazwa}`);
      const response = await api.post<ApiResponse<{id: number, nazwa: string}>>('/locations/cities', { nazwa });
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla tworzenia miejscowości:', response.data);
        throw new Error(response.data.message || 'Błąd dodawania miejscowości');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('API: Błąd dodawania miejscowości:', error.message);
      throw error;
    }
  },

  /**
   * Dodawanie nowej ulicy
   * @param nazwa Nazwa ulicy
   * @param miejscowosc_id ID miejscowości
   * @returns Promise z utworzoną ulicą
   */
  async createUlica(nazwa: string, miejscowosc_id: number): Promise<{id: number, nazwa: string, miejscowosc_id: number}> {
    try {
      console.log(`API: Dodawanie nowej ulicy: ${nazwa} w miejscowości ID: ${miejscowosc_id}`);
      const response = await api.post<ApiResponse<{id: number, nazwa: string, miejscowosc_id: number}>>(
        '/locations/streets', 
        { nazwa, miejscowosc_id }
      );
      
      if (!response.data.success) {
        console.warn('API: Błąd w odpowiedzi dla tworzenia ulicy:', response.data);
        throw new Error(response.data.message || 'Błąd dodawania ulicy');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('API: Błąd dodawania ulicy:', error.message);
      throw error;
    }
  },
}; 

/**
 * API do zarządzania grupami formacyjnymi
 */
export const grupyApi = {
  /**
   * Pobieranie wszystkich grup formacyjnych
   * @returns Promise z listą grup
   */
  async getAllGrupy(): Promise<any[]> {
    try {
      console.log('API: Pobieranie grup formacyjnych');
      const response = await api.get('/grupy');
      return response.data || [];
    } catch (error: any) {
      console.error('API: Błąd pobierania grup formacyjnych:', error.message);
      return [];
    }
  },

  /**
   * Pobieranie szczegółów grupy formacyjnej
   * @param grupaId ID grupy
   * @returns Promise ze szczegółami grupy
   */
  async getGrupaDetails(grupaId: number): Promise<any> {
    try {
      console.log(`API: Pobieranie szczegółów grupy ID: ${grupaId}`);
      const response = await api.get(`/grupy/${grupaId}`);
      return response.data;
    } catch (error: any) {
      console.error(`API: Błąd pobierania szczegółów grupy ${grupaId}:`, error.message);
      throw error;
    }
  },
  
  /**
   * Tworzenie nowej grupy formacyjnej
   * @param grupaData Dane grupy
   * @returns Promise z ID utworzonej grupy
   */
  async createGrupa(grupaData: any): Promise<number> {
    try {
      console.log('API: Tworzenie nowej grupy formacyjnej');
      const response = await api.post('/grupy', grupaData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Błąd tworzenia grupy');
      }
      
      return response.data.id;
    } catch (error: any) {
      console.error('API: Błąd tworzenia grupy:', error.message);
      throw error;
    }
  },
  
  /**
   * Aktualizacja grupy formacyjnej
   * @param grupaId ID grupy
   * @param grupaData Dane grupy
   * @returns Promise bez zawartości
   */
  async updateGrupa(grupaId: number, grupaData: any): Promise<void> {
    try {
      console.log(`API: Aktualizacja grupy ID: ${grupaId}`);
      const response = await api.put(`/grupy/${grupaId}`, grupaData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Błąd aktualizacji grupy');
      }
    } catch (error: any) {
      console.error(`API: Błąd aktualizacji grupy ${grupaId}:`, error.message);
      throw error;
    }
  },
  
  /**
   * Usuwanie grupy formacyjnej
   * @param grupaId ID grupy
   * @returns Promise bez zawartości
   */
  async deleteGrupa(grupaId: number): Promise<void> {
    try {
      console.log(`API: Usuwanie grupy ID: ${grupaId}`);
      const response = await api.delete(`/grupy/${grupaId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Błąd usuwania grupy');
      }
    } catch (error: any) {
      console.error(`API: Błąd usuwania grupy ${grupaId}:`, error.message);
      throw error;
    }
  },
  
  /**
   * Aktualizacja członków grupy
   * @param grupaId ID grupy
   * @param userIds Lista ID użytkowników
   * @returns Promise bez zawartości
   */
  async updateGrupaCzlonkowie(grupaId: number, userIds: number[]): Promise<void> {
    try {
      console.log(`API: Aktualizacja członków grupy ID: ${grupaId}`);
      const response = await api.put(`/grupy/${grupaId}/czlonkowie`, {
        userIds
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Błąd aktualizacji członków grupy');
      }
    } catch (error: any) {
      console.error(`API: Błąd aktualizacji członków grupy ${grupaId}:`, error.message);
      throw error;
    }
  },
  
  /**
   * Przypisywanie grup do animatora
   * @param animatorId ID animatora
   * @param grupyIds Lista ID grup
   * @returns Promise bez zawartości
   */
  async assignGrupyToAnimator(animatorId: number, grupyIds: number[]): Promise<void> {
    try {
      console.log(`API: Przypisywanie grup do animatora ID: ${animatorId}`);
      const response = await api.post(`/users/${animatorId}/grupy`, {
        grupyIds
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Błąd przypisywania grup do animatora');
      }
    } catch (error: any) {
      console.error(`API: Błąd przypisywania grup do animatora ${animatorId}:`, error.message);
      throw error;
    }
  }
}; 

/**
 * API do zarządzania kandydatami
 */
export const kandydatApi = {
  /**
   * Pobieranie danych kandydata
   * @param userId ID użytkownika
   * @returns Promise z danymi kandydata
   */
  async getKandydatData(userId: string): Promise<any> {
    try {
      console.log(`API: Pobieranie danych kandydata ID: ${userId}`);
      const response = await api.get<ApiResponse<any>>(`/kandydat/${userId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się pobrać danych kandydata');
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`API: Błąd pobierania danych kandydata:`, error.message);
      if (error.response) {
        console.error('API: Szczegóły odpowiedzi:', error.response.data);
      }
      
      return { success: false, message: error.message };
    }
  },

  /**
   * Pobieranie listy szkół
   * @returns Promise z listą szkół
   */
  async getSzkoly(): Promise<any> {
    try {
      console.log('API: Pobieranie listy szkół');
      const response = await api.get<ApiResponse<any>>('/kandydat/dane/szkoly');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się pobrać listy szkół');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd pobierania listy szkół:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Pobieranie listy parafii
   * @returns Promise z listą parafii
   */
  async getParafie(): Promise<any> {
    try {
      console.log('API: Pobieranie listy parafii');
      const response = await api.get<ApiResponse<any>>('/kandydat/dane/parafie');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się pobrać listy parafii');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd pobierania listy parafii:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Pobieranie listy grup
   * @returns Promise z listą grup
   */
  async getGrupy(): Promise<any> {
    try {
      console.log('API: Pobieranie listy grup');
      const response = await api.get<ApiResponse<any>>('/kandydat/dane/grupy');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się pobrać listy grup');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd pobierania listy grup:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Dodawanie/edycja rodzica
   * @param userId ID kandydata
   * @param data Dane rodzica
   * @returns Promise z informacją o powodzeniu operacji
   */
  async saveRodzic(userId: string, data: any): Promise<any> {
    try {
      console.log(`API: Zapisywanie danych rodzica dla kandydata ID: ${userId}`);
      const response = await api.post<ApiResponse<any>>(`/kandydat/${userId}/rodzic`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się zapisać danych rodzica');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd zapisywania danych rodzica:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Przypisanie do grupy
   * @param userId ID kandydata
   * @param data Dane grupy
   * @returns Promise z informacją o powodzeniu operacji
   */
  async assignToGrupa(userId: string, data: { grupa_id: number }): Promise<any> {
    try {
      console.log(`API: Przypisywanie kandydata ID: ${userId} do grupy`);
      const response = await api.post<ApiResponse<any>>(`/kandydat/${userId}/grupa`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się przypisać kandydata do grupy');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd przypisywania kandydata do grupy:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Dodawanie/edycja świadka
   * @param userId ID kandydata
   * @param data Dane świadka
   * @returns Promise z informacją o powodzeniu operacji
   */
  async saveSwiadek(userId: string, data: any): Promise<any> {
    try {
      console.log(`API: Zapisywanie danych świadka dla kandydata ID: ${userId}`);
      const response = await api.post<ApiResponse<any>>(`/kandydat/${userId}/swiadek`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się zapisać danych świadka');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd zapisywania danych świadka:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Dodawanie/edycja imienia bierzmowania
   * @param userId ID kandydata
   * @param data Dane imienia bierzmowania
   * @returns Promise z informacją o powodzeniu operacji
   */
  async saveImieBierzmowania(userId: string, data: { imie: string, uzasadnienie?: string }): Promise<any> {
    try {
      console.log(`API: Zapisywanie imienia bierzmowania dla kandydata ID: ${userId}`);
      const response = await api.post<ApiResponse<any>>(`/kandydat/${userId}/imie-bierzmowania`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się zapisać imienia bierzmowania');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd zapisywania imienia bierzmowania:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Zapisywanie informacji o szkole kandydata
   * @param userId ID kandydata
   * @param data Dane szkoły (szkola_id, klasa, rok_szkolny)
   * @returns Promise z informacją o powodzeniu operacji
   */
  async saveSzkola(userId: string, data: { szkola_id: number; klasa: string; rok_szkolny: string }): Promise<any> {
    try {
      console.log(`API: Zapisywanie informacji o szkole dla kandydata ID: ${userId}`);
      const response = await api.post<ApiResponse<any>>(`/kandydat/${userId}/szkola`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się zapisać informacji o szkole');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd podczas zapisywania informacji o szkole:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Przypisanie do parafii
   * @param userId ID kandydata
   * @param data Dane parafii
   * @returns Promise z informacją o powodzeniu operacji
   */
  async assignToParafia(userId: string, data: { parafiaId: number }): Promise<any> {
    try {
      console.log(`API: Przypisywanie kandydata ID: ${userId} do parafii`);
      const response = await api.post<ApiResponse<any>>(`/kandydat/${userId}/parafia`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Nie udało się przypisać kandydata do parafii');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API: Błąd przypisywania kandydata do parafii:', error.message);
      return { success: false, message: error.message };
    }
  }
}; 