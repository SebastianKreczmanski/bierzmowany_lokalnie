import { locationsApi } from '../services/api';
import { AdresFormData } from '../components/AddressForm';

/**
 * Sprawdza poprawność danych adresowych
 * @param address Dane adresowe
 * @returns Obiekt z informacją o błędach (null jeśli brak błędów)
 */
export const validateAddress = (address: AdresFormData): { isValid: boolean, errors: string[] } => {
  const errors: string[] = [];

  if (!address.miejscowosc_id) {
    errors.push('Wybierz miejscowość');
  }

  if (!address.ulica_id) {
    errors.push('Wybierz ulicę');
  }

  if (!address.nr_budynku || address.nr_budynku.trim() === '') {
    errors.push('Podaj numer budynku');
  }

  if (!address.kod_pocztowy || !/^\d{2}-\d{3}$/.test(address.kod_pocztowy)) {
    errors.push('Podaj prawidłowy kod pocztowy w formacie XX-XXX');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Tworzy nowy adres w systemie
 * @param address Dane adresowe z formularza
 * @returns ID utworzonego adresu lub null w przypadku błędu
 */
export const createAddress = async (address: AdresFormData): Promise<number | null> => {
  const validation = validateAddress(address);
  if (!validation.isValid) {
    throw new Error(`Nieprawidłowe dane adresowe: ${validation.errors.join(', ')}`);
  }

  try {
    const addressData = {
      ulica_id: address.ulica_id as number,
      nr_budynku: address.nr_budynku,
      nr_lokalu: address.nr_lokalu || undefined,
      kod_pocztowy: address.kod_pocztowy
    };

    const adresId = await locationsApi.createAddress(addressData);
    return adresId;
  } catch (error: any) {
    console.error('Błąd podczas tworzenia adresu:', error);
    return null;
  }
};

/**
 * Formatuje pełny adres jako string na podstawie danych
 * @param miejscowosc Nazwa miejscowości
 * @param ulica Nazwa ulicy
 * @param nrBudynku Numer budynku
 * @param nrLokalu Numer lokalu (opcjonalny)
 * @param kodPocztowy Kod pocztowy
 * @returns Sformatowany adres
 */
export const formatAddress = (
  miejscowosc: string,
  ulica: string,
  nrBudynku: string,
  nrLokalu?: string,
  kodPocztowy?: string
): string => {
  let formattedAddress = `ul. ${ulica} ${nrBudynku}`;
  
  if (nrLokalu && nrLokalu.trim() !== '') {
    formattedAddress += `/${nrLokalu}`;
  }
  
  formattedAddress += `, ${miejscowosc}`;
  
  if (kodPocztowy && kodPocztowy.trim() !== '') {
    formattedAddress += `, ${kodPocztowy}`;
  }
  
  return formattedAddress;
}; 