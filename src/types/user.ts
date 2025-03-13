/**
 * Podstawowe informacje o użytkowniku
 */
export interface User {
  id: number;
  username: string;
  imie: string;
  nazwisko: string;
  data_urodzenia?: string;
  roles: string[];
}

/**
 * Szczegółowe informacje o użytkowniku
 */
export interface UserDetails extends User {
  emails?: {
    email: string;
    glowny: boolean;
  }[];
  phones?: {
    numer: string;
    glowny: boolean;
  }[];
  adres?: {
    id: number;
    ulica: string;
    nr_budynku: string;
    nr_lokalu?: string;
    kod_pocztowy: string;
    miejscowosc: string;
  };
  uczen?: {
    szkola: string;
    klasa: string;
    rok_szkolny: string;
  };
  rodzic?: {
    id: number;
    imie: string;
    nazwisko: string;
    dzieci?: {
      id: number;
      imie: string;
      nazwisko: string;
    }[];
  };
}

/**
 * Dane do utworzenia nowego użytkownika
 */
export interface CreateUserData {
  username: string;
  password: string;
  imie: string;
  nazwisko: string;
  data_urodzenia?: string;
  email?: string;
  telefon?: string;
  roles: string[];
  adres?: {
    ulica_id: number;
    nr_budynku: string;
    nr_lokalu?: string;
    kod_pocztowy: string;
  };
}

/**
 * Dane do aktualizacji użytkownika
 */
export interface UpdateUserData {
  username?: string;
  password?: string;
  imie?: string;
  nazwisko?: string;
  data_urodzenia?: string;
  email?: string;
  telefon?: string;
  roles?: string[];
}

/**
 * Odpowiedź API z listą użytkowników
 */
export interface UsersResponse {
  success: boolean;
  data: User[];
  message?: string;
}

/**
 * Odpowiedź API ze szczegółami użytkownika
 */
export interface UserDetailsResponse {
  success: boolean;
  data: UserDetails;
  message?: string;
}

/**
 * Odpowiedź API po utworzeniu użytkownika
 */
export interface CreateUserResponse {
  success: boolean;
  data: { id: number };
  message: string;
}

/**
 * Odpowiedź API po aktualizacji lub usunięciu użytkownika
 */
export interface UserActionResponse {
  success: boolean;
  message: string;
} 