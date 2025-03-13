/**
 * Symulowana baza danych użytkowników i ról
 * Ten plik zastępuje rzeczywistą bazę danych na potrzeby demonstracji i testów
 */

// Symulowane role
export const roles = [
  { id: 1, nazwa: 'administrator' },
  { id: 2, nazwa: 'duszpasterz' },
  { id: 3, nazwa: 'kancelaria' },
  { id: 4, nazwa: 'animator' },
  { id: 5, nazwa: 'rodzic' },
  { id: 6, nazwa: 'kandydat' }
];

// Symulowani użytkownicy
export const users = [
  {
    id: 1,
    username: 'admin',
    password_hash: 'admin123', // W rzeczywistej aplikacji byłby to zahaszowany ciąg
    imie: 'Administrator',
    nazwisko: 'Systemu',
    data_urodzenia: '1990-01-01',
    adres_id: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    deleted_at: null
  },
  {
    id: 2,
    username: 'ksiadz',
    password_hash: 'ksiadz123',
    imie: 'Jan',
    nazwisko: 'Kowalski',
    data_urodzenia: '1980-05-15',
    adres_id: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    deleted_at: null
  },
  {
    id: 3,
    username: 'kancelaria',
    password_hash: 'kancelaria123',
    imie: 'Anna',
    nazwisko: 'Kowalska',
    data_urodzenia: '1985-10-20',
    adres_id: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    deleted_at: null
  },
  {
    id: 4,
    username: 'animator',
    password_hash: 'animator123',
    imie: 'Tomasz',
    nazwisko: 'Nowak',
    data_urodzenia: '1995-03-10',
    adres_id: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    deleted_at: null
  },
  {
    id: 5,
    username: 'rodzic',
    password_hash: 'rodzic123',
    imie: 'Maria',
    nazwisko: 'Wiśniewska',
    data_urodzenia: '1978-12-05',
    adres_id: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    deleted_at: null
  },
  {
    id: 6,
    username: 'kandydat',
    password_hash: 'kandydat123',
    imie: 'Piotr',
    nazwisko: 'Kowalczyk',
    data_urodzenia: '2007-07-25',
    adres_id: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    deleted_at: null
  }
];

// Symulowane przypisania ról
export const userRoles = [
  { user_id: 1, role_id: 1 }, // admin - administrator
  { user_id: 2, role_id: 2 }, // ksiadz - duszpasterz
  { user_id: 3, role_id: 3 }, // kancelaria - kancelaria
  { user_id: 4, role_id: 4 }, // animator - animator
  { user_id: 5, role_id: 5 }, // rodzic - rodzic
  { user_id: 6, role_id: 6 }, // kandydat - kandydat
  { user_id: 1, role_id: 2 }  // admin ma też rolę duszpasterza
];

// Symulowane typy wydarzeń
export const eventTypes = [
  { id: 1, nazwa: 'Msza święta', kolor: '#ffa629' },
  { id: 2, nazwa: 'Droga Krzyżowa', kolor: '#ff0000' },
  { id: 3, nazwa: 'Spotkanie formacyjne', kolor: '#008000' },
  { id: 4, nazwa: 'Rekolekcje', kolor: '#800080' },
  { id: 5, nazwa: 'Spotkanie organizacyjne', kolor: '#0000ff' }
];

// Funkcja pomocnicza do generowania dat
function getDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0): string {
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

// Funkcja pomocnicza do uzyskania aktualnego roku
function getCurrentYear(): number {
  return new Date().getFullYear();
}

// Funkcja pomocnicza do uzyskania aktualnego miesiąca
function getCurrentMonth(): number {
  return new Date().getMonth() + 1; // Miesiące są indeksowane od 0
}

// Symulowane wydarzenia
export const events = [
  {
    id: 1,
    typ_id: 1,
    nazwa: 'Msza św. inaugurująca przygotowanie do bierzmowania',
    opis: 'Uroczysta msza święta inaugurująca przygotowanie do sakramentu bierzmowania.',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), 15, 18, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), 15, 19, 30),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[0] // Msza święta
  },
  {
    id: 2,
    typ_id: 2,
    nazwa: 'Droga Krzyżowa',
    opis: 'Nabożeństwo Drogi Krzyżowej dla kandydatów do bierzmowania',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), 18, 16, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), 18, 17, 30),
    obowiazkowe: false,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[1] // Droga Krzyżowa
  },
  {
    id: 3,
    typ_id: 3,
    nazwa: 'Spotkanie formacyjne - grupa 1',
    opis: 'Spotkanie formacyjne dla kandydatów z grupy 1',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), 20, 17, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), 20, 18, 30),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '1',
    typ: eventTypes[2] // Spotkanie formacyjne
  },
  {
    id: 4,
    typ_id: 3,
    nazwa: 'Spotkanie formacyjne - grupa 2',
    opis: 'Spotkanie formacyjne dla kandydatów z grupy 2',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), 21, 17, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), 21, 18, 30),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '2',
    typ: eventTypes[2] // Spotkanie formacyjne
  },
  {
    id: 5,
    typ_id: 4,
    nazwa: 'Rekolekcje wielkopostne',
    opis: 'Trzydniowe rekolekcje wielkopostne dla kandydatów do bierzmowania',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), 25, 16, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), 27, 18, 0),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[3] // Rekolekcje
  },
  {
    id: 6,
    typ_id: 5,
    nazwa: 'Spotkanie organizacyjne dla rodziców',
    opis: 'Spotkanie organizacyjne dla rodziców kandydatów do bierzmowania',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), 10, 19, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), 10, 20, 30),
    obowiazkowe: true,
    dlaroli: '5', // dla rodziców
    dlagrupy: '',
    typ: eventTypes[4] // Spotkanie organizacyjne
  },
  {
    id: 7,
    typ_id: 5,
    nazwa: 'Zebranie animatorów',
    opis: 'Zebranie organizacyjne dla animatorów grup',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), 5, 19, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), 5, 20, 30),
    obowiazkowe: true,
    dlaroli: '4', // dla animatorów
    dlagrupy: '',
    typ: eventTypes[4] // Spotkanie organizacyjne
  },
  {
    id: 8,
    typ_id: 5,
    nazwa: 'Rada duszpasterska',
    opis: 'Zebranie rady duszpasterskiej dotyczące przygotowania do bierzmowania',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth() + 1, 2, 19, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth() + 1, 2, 21, 0),
    obowiazkowe: true,
    dlaroli: '2', // dla duszpasterzy
    dlagrupy: '',
    typ: eventTypes[4] // Spotkanie organizacyjne
  },
  {
    id: 9,
    typ_id: 1,
    nazwa: 'Msza św. z przekazaniem modlitwy Pańskiej',
    opis: 'Uroczysta msza święta z przekazaniem modlitwy Pańskiej dla kandydatów do bierzmowania',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth() + 1, 12, 18, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth() + 1, 12, 19, 30),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[0] // Msza święta
  },
  {
    id: 10,
    typ_id: 3,
    nazwa: 'Dzień skupienia przed bierzmowaniem',
    opis: 'Dzień skupienia dla wszystkich kandydatów przed sakramentem bierzmowania',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth() + 1, 20, 9, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth() + 1, 20, 16, 0),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[2] // Spotkanie formacyjne
  },
  // Dodatkowe wydarzenia w bieżącym miesiącu
  {
    id: 11,
    typ_id: 1,
    nazwa: 'Msza św. niedzielna',
    opis: 'Obowiązkowa msza św. niedzielna dla kandydatów',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), new Date().getDate() + 3, 10, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), new Date().getDate() + 3, 11, 30),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[0] // Msza święta
  },
  {
    id: 12,
    typ_id: 3,
    nazwa: 'Przygotowanie liturgiczne',
    opis: 'Przygotowanie do liturgii bierzmowania',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), new Date().getDate() + 1, 17, 30),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), new Date().getDate() + 1, 19, 0),
    obowiazkowe: true,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[2] // Spotkanie formacyjne
  },
  {
    id: 13,
    typ_id: 4,
    nazwa: 'Czuwanie modlitewne',
    opis: 'Czuwanie modlitewne przed bierzmowaniem',
    data_rozpoczecia: getDate(getCurrentYear(), getCurrentMonth(), new Date().getDate() + 5, 20, 0),
    data_zakonczenia: getDate(getCurrentYear(), getCurrentMonth(), new Date().getDate() + 5, 22, 0),
    obowiazkowe: false,
    dlaroli: '6', // dla kandydatów
    dlagrupy: '',
    typ: eventTypes[3] // Rekolekcje
  }
];

/**
 * Pobiera użytkownika na podstawie nazwy użytkownika
 * @param username Nazwa użytkownika
 * @returns Dane użytkownika lub null
 */
export function getUserByUsername(username: string): any | null {
  return users.find(user => user.username === username) || null;
}

/**
 * Pobiera role użytkownika na podstawie jego ID
 * @param userId ID użytkownika
 * @returns Lista nazw ról użytkownika
 */
export function getUserRoles(userId: number): string[] {
  // Pobierz ID ról użytkownika
  const roleIds = userRoles
    .filter(ur => ur.user_id === userId)
    .map(ur => ur.role_id);
  
  // Pobierz nazwy ról
  return roles
    .filter(role => roleIds.includes(role.id))
    .map(role => role.nazwa);
}

/**
 * Weryfikuje hasło użytkownika
 * @param plainPassword Wprowadzone hasło
 * @param storedPassword Zapisane hasło
 * @returns Czy hasło jest poprawne
 */
export function verifyPassword(plainPassword: string, storedPassword: string): boolean {
  // W rzeczywistej aplikacji używalibyśmy bcrypt.compare
  // Na potrzeby symulacji porównujemy tekstowo
  return plainPassword === storedPassword;
}

/**
 * Pobiera wszystkie wydarzenia
 * @returns Lista wszystkich wydarzeń
 * @deprecated Użyj eventsApi.getEvents() zamiast tej funkcji
 */
export function getAllEvents(): any[] {
  console.warn('DEPRECATED: Używanie zaimplementowanej funkcji getAllEvents() z mockedDb. Użyj eventsApi.getEvents() z API!');
  return [];
}

/**
 * Pobiera wydarzenia dla określonej roli
 * @param role Nazwa roli
 * @returns Lista wydarzeń dla danej roli
 * @deprecated Użyj eventsApi.getEventsByRole() zamiast tej funkcji
 */
export function getEventsByRole(role: string): any[] {
  console.warn('DEPRECATED: Używanie zaimplementowanej funkcji getEventsByRole() z mockedDb. Użyj eventsApi.getEventsByRole() z API!');
  return [];
}

/**
 * Pobiera wydarzenia dla określonej grupy
 * @param group Identyfikator grupy
 * @returns Lista wydarzeń dla danej grupy
 * @deprecated Użyj eventsApi.getEventsByGroup() zamiast tej funkcji
 */
export function getEventsByGroup(group: string): any[] {
  console.warn('DEPRECATED: Używanie zaimplementowanej funkcji getEventsByGroup() z mockedDb. Użyj eventsApi.getEventsByGroup() z API!');
  return [];
}

/**
 * Pobiera wszystkie typy wydarzeń
 * @returns Lista typów wydarzeń
 * @deprecated Użyj eventsApi.getEventTypes() zamiast tej funkcji
 */
export function getAllEventTypes(): any[] {
  console.warn('DEPRECATED: Używanie zaimplementowanej funkcji getAllEventTypes() z mockedDb. Użyj eventsApi.getEventTypes() z API!');
  return [];
}

export default {
  getUserByUsername,
  getUserRoles,
  verifyPassword,
  getAllEvents,
  getEventsByRole,
  getEventsByGroup,
  getAllEventTypes
}; 