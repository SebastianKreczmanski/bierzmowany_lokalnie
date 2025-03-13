import axios, { AxiosError } from 'axios';
import { DEFAULT_ERROR_MESSAGE } from '../config';

/**
 * Funkcja do obsługi błędów API
 * @param error Błąd z axios
 * @param defaultMessage Domyślna wiadomość błędu
 * @returns Obiekt odpowiedzi API z informacją o błędzie
 */
export const handleApiError = (error: unknown, defaultMessage: string = DEFAULT_ERROR_MESSAGE) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Sprawdzenie czy serwer zwrócił jakąś wiadomość błędu
    if (axiosError.response?.data?.message) {
      return {
        success: false,
        message: axiosError.response.data.message
      };
    }
    
    // Obsługa różnych kodów błędów HTTP
    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 400:
          return { success: false, message: 'Nieprawidłowe dane' };
        case 401:
          return { success: false, message: 'Brak autoryzacji. Zaloguj się ponownie.' };
        case 403:
          return { success: false, message: 'Brak uprawnień do wykonania tej operacji' };
        case 404:
          return { success: false, message: 'Nie znaleziono zasobu' };
        case 500:
          return { success: false, message: 'Błąd serwera. Spróbuj ponownie później.' };
        default:
          return { success: false, message: defaultMessage };
      }
    }
    
    // Obsługa błędów sieciowych
    if (axiosError.request) {
      return { 
        success: false, 
        message: 'Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.' 
      };
    }
  }
  
  // Obsługa innych błędów
  console.error('Nieoczekiwany błąd:', error);
  return { success: false, message: defaultMessage };
};

/**
 * Funkcja do logowania błędów
 * @param error Błąd do zalogowania
 * @param context Kontekst błędu (np. nazwa funkcji)
 */
export const logError = (error: unknown, context: string = 'API Error') => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    console.error(`${context}:`, {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message
    });
  } else if (error instanceof Error) {
    console.error(`${context}:`, error.message);
  } else {
    console.error(`${context}:`, error);
  }
}; 