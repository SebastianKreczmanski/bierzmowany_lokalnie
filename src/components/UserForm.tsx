import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AddressForm from './AddressForm';
import { validateAddress, createAddress } from '../utils/addressUtils';
import { usersApi, grupyApi, locationsApi } from '../services/api';
import KandydatRodzicForm from './KandydatRodzicForm';
import KandydatGrupaForm from './KandydatGrupaForm';
import KandydatParafiaForm from './KandydatParafiaForm';
import KandydatSwiadekForm from './KandydatSwiadekForm';
import KandydatImieBierzmowaniaForm from './KandydatImieBierzmowaniaForm';
import KandydatSzkolaForm from './KandydatSzkolaForm';
import dayjs from 'dayjs';

// Helper function to check if a year is a leap year
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// Define AdresFormData interface here
interface AdresFormData {
  miejscowosc_id: number | null;
  ulica_id: number | null;
  nr_budynku: string;
  nr_lokalu: string;
  kod_pocztowy: string;
}

interface Candidate {
  id: number;
  imie: string;
  nazwisko: string;
  username: string;
}

interface Grupa {
  id: number;
  nazwa: string;
}

interface UserFormProps {
  onSubmit: (userData: any) => void;
  onCancel?: () => void;
  initialData?: any;
  isEditMode?: boolean;
  isSubmitting?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  onCancel,
  initialData = null,
  isEditMode = false,
  isSubmitting = false
}) => {
  // Dane użytkownika
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState(initialData?.imie || '');
  const [lastName, setLastName] = useState(initialData?.nazwisko || '');
  const [birthDate, setBirthDate] = useState(() => {
    console.log('Inicjalizacja daty urodzenia, wartość z API:', initialData?.data_urodzenia);
    
    // Jeśli data istnieje, upewnij się, że jest w prawidłowym formacie YYYY.MM.DD dla wyświetlania
    if (initialData?.data_urodzenia) {
      try {
        // Usuń część czasową, jeśli istnieje (może pochodzić z API jako ISO string)
        let dateValue = initialData.data_urodzenia;
        if (dateValue.includes('T')) {
          dateValue = dateValue.split('T')[0];
          console.log('Usunięto część czasową z daty:', dateValue);
        }
        
        // NAJWAŻNIEJSZA ZMIANA: używamy tylko prostej konwersji stringów, bez Date objects
        // Sprawdź czy to format YYYY-MM-DD (format z bazy danych MySQL)
        const dbFormatRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const dbFormatMatch = dateValue.match(dbFormatRegex);
        
        if (dbFormatMatch) {
          // Konwertuj z formatu bazy danych (YYYY-MM-DD) na format wyświetlania (YYYY.MM.DD)
          // Używamy bezpośrednio wartości z regex match, bez tworzenia obiektów Date
          const year = dbFormatMatch[1];
          const month = dbFormatMatch[2];
          const day = dbFormatMatch[3];
          const displayFormat = `${year}.${month}.${day}`;
          console.log('Skonwertowano datę z formatu YYYY-MM-DD na YYYY.MM.DD dla wyświetlenia:', displayFormat);
          return displayFormat;
        }
        
        // Sprawdź, czy data jest już w formacie YYYY.MM.DD (format wyświetlania)
        const displayFormatRegex = /^\d{4}\.\d{2}\.\d{2}$/;
        if (displayFormatRegex.test(dateValue)) {
          console.log('Data urodzenia już w poprawnym formacie wyświetlania (YYYY.MM.DD):', dateValue);
          return dateValue;
        }
        
        // Format DD.MM.YYYY
        const reversedDateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const reversedMatch = dateValue.match(reversedDateRegex);
        if (reversedMatch) {
          const day = reversedMatch[1];
          const month = reversedMatch[2];
          const year = reversedMatch[3];
          const displayFormat = `${year}.${month}.${day}`;
          console.log('Skonwertowano datę z formatu DD.MM.YYYY na YYYY.MM.DD dla wyświetlenia:', displayFormat);
          return displayFormat;
        }
        
        // Jako ostateczność, jeśli nie rozpoznano formatu, logujemy błąd
        console.warn('Nierozpoznany format daty urodzenia z API:', dateValue);
      } catch (e) {
        console.error('Błąd podczas formatowania daty urodzenia:', e);
      }
    }
    return '';  // Zwróć pusty string jako wartość domyślna, gdy nie ma daty
  });
  
  // Dodajemy stan do zarządzania aktualizacją daty
  const [isSavingBirthDate, setIsSavingBirthDate] = useState(false);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  // Dodajemy stan do śledzenia modyfikacji daty urodzenia
  const [birthDateModified, setBirthDateModified] = useState(false);
  
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.telefon || '');
  
  // Dodajemy stan do śledzenia modyfikacji dla każdego pola
  const [usernameModified, setUsernameModified] = useState(false);
  const [firstNameModified, setFirstNameModified] = useState(false);
  const [lastNameModified, setLastNameModified] = useState(false);
  const [emailModified, setEmailModified] = useState(false);
  const [phoneModified, setPhoneModified] = useState(false);
  
  // Dodajemy stan do śledzenia modyfikacji hasła
  const [passwordModified, setPasswordModified] = useState(false);
  const [confirmPasswordModified, setConfirmPasswordModified] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  
  // Dodajemy stan do zarządzania zapisywaniem poszczególnych pól
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingFirstName, setIsSavingFirstName] = useState(false);
  const [isSavingLastName, setIsSavingLastName] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  // Dodajemy stan do śledzenia błędów dla poszczególnych pól
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Dodajemy stan do zmiany hasła
  const [changePassword, setChangePassword] = useState(false);
  
  // Adres
  const [addressData, setAddressData] = useState<AdresFormData>({
    miejscowosc_id: null,
    ulica_id: null,
    nr_budynku: '',
    nr_lokalu: '',
    kod_pocztowy: initialData?.kod_pocztowy || ''
  });
  
  // Stan formularza
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Stan dla kandydatów (gdy użytkownik to rodzic)
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  
  // Stan dla grup (gdy użytkownik to animator)
  const [grupy, setGrupy] = useState<Grupa[]>([]);
  const [selectedGrupy, setSelectedGrupy] = useState<number[]>([]);
  const [loadingGrupy, setLoadingGrupy] = useState(false);
  
  // Stan aktywnej zakładki
  const [activeTab, setActiveTab] = useState('basic');
  const [candidateDataTab, setCandidateDataTab] = useState<string>('rodzic');
  
  // Inicjalizacja wartości początkowych
  useEffect(() => {
    if (initialData && isEditMode) {
      console.log('Inicjalizacja UserForm z danymi:', initialData);
      
      // Ustaw początkowe wartości dla ról
      if (initialData.roles) {
        setSelectedRoles(Array.isArray(initialData.roles) 
          ? initialData.roles 
          : initialData.roles.split(','));
      }
      
      // Debugowanie adresu
      console.log('Debug adresu w UserForm:');
      console.log('- initialData.adres:', initialData.adres);
      
      // Inicjalizacja adresu jeśli istnieje
      try {
        if (initialData.adres && typeof initialData.adres === 'object') {
          console.log('Inicjalizacja adresu z pełnego obiektu adres:', initialData.adres);
          console.log('Klucze obiektu adres:', Object.keys(initialData.adres));
          
          // Sprawdź czy obiekt adres zawiera podstawowe dane
          if (initialData.adres.id || initialData.adres.ulica_id || initialData.adres.miejscowosc_id) {
            console.log('Ustawianie danych adresowych z obiektu adres');
            
            // Zapisz adres do stanu komponentu
            const newAddressData = {
              miejscowosc_id: initialData.adres.miejscowosc_id || null,
              ulica_id: initialData.adres.ulica_id || null,
              nr_budynku: initialData.adres.nr_budynku || '',
              nr_lokalu: initialData.adres.nr_lokalu || '',
              kod_pocztowy: initialData.adres.kod_pocztowy || ''
            };
            
            setAddressData(newAddressData);
            
            console.log('Zainicjalizowano dane adresowe z pełnego obiektu:', newAddressData);
            
            if (!initialData.adres.miejscowosc_id || !initialData.adres.ulica_id) {
              console.warn('Uwaga: Obiekt adresu nie zawiera miejscowosc_id lub ulica_id', initialData.adres);
            }
          } else {
            console.warn('Obiekt adres nie zawiera wymaganych pól:', initialData.adres);
          }
        } else {
          console.log('Brak danych adresowych w initialData');
        }
      } catch (addressError) {
        console.error('Błąd podczas inicjalizacji adresu:', addressError);
        toast.error('Wystąpił błąd podczas inicjalizacji danych adresowych');
      }

      // Inicjalizacja powiązanych kandydatów, jeśli użytkownik jest rodzicem
      if (initialData.przypisani_kandydaci && Array.isArray(initialData.przypisani_kandydaci)) {
        setSelectedCandidates(initialData.przypisani_kandydaci.map((k: any) => k.id));
      }

      // Inicjalizacja powiązanych grup, jeśli użytkownik jest animatorem
      if (initialData.przypisane_grupy && Array.isArray(initialData.przypisane_grupy)) {
        setSelectedGrupy(initialData.przypisane_grupy.map((g: any) => g.id));
      }
    }
  }, [initialData, isEditMode]);
  
  // Pobieranie listy kandydatów, gdy rola "rodzic" zostanie zaznaczona
  useEffect(() => {
    const isParent = selectedRoles.includes('rodzic');
    
    if (isParent && candidates.length === 0) {
      fetchCandidates();
    }
    
    const isAnimator = selectedRoles.includes('animator');
    
    if (isAnimator && grupy.length === 0) {
      fetchGrupy();
    }
  }, [selectedRoles]);
  
  // Funkcja pobierająca listę kandydatów
  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const candidatesList = await usersApi.getAllCandidates();
      setCandidates(candidatesList);
    } catch (error) {
      console.error('Błąd podczas pobierania kandydatów:', error);
      toast.error('Nie udało się pobrać listy kandydatów');
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Funkcja pobierająca listę grup
  const fetchGrupy = async () => {
    setLoadingGrupy(true);
    try {
      const grupyList = await grupyApi.getAllGrupy();
      setGrupy(grupyList);
    } catch (error) {
      console.error('Błąd podczas pobierania grup:', error);
      toast.error('Nie udało się pobrać listy grup');
    } finally {
      setLoadingGrupy(false);
    }
  };
  
  // Obsługa zmiany ról
  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setSelectedRoles(prev => {
      if (checked) {
        return [...prev, value];
      } else {
        return prev.filter(role => role !== value);
      }
    });
  };

  // Obsługa zmiany wybranych kandydatów
  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: number[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    
    setSelectedCandidates(selectedValues);
  };

  // Obsługa zmiany wybranych grup
  const handleGrupyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: number[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    
    setSelectedGrupy(selectedValues);
  };

  // Funkcje obsługujące zmiany poszczególnych pól
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    // Sprawdzamy, czy wartość jest różna od oryginalnej
    setUsernameModified(value !== initialData?.username);
    setUsernameError(null);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordModified(value !== '');
    
    // Sprawdź, czy hasła się zgadzają
    setPasswordsMatch(value === confirmPassword && value !== '');
    setPasswordError(null);
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordModified(value !== '');
    
    // Sprawdź, czy hasła się zgadzają
    setPasswordsMatch(password === value && value !== '');
    setPasswordError(null);
  };
  
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    // Sprawdzamy, czy wartość jest różna od oryginalnej
    setFirstNameModified(value !== initialData?.imie);
    setFirstNameError(null);
  };
  
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLastName(value);
    // Sprawdzamy, czy wartość jest różna od oryginalnej
    setLastNameModified(value !== initialData?.nazwisko);
    setLastNameError(null);
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Sprawdzamy, czy wartość jest różna od oryginalnej
    setEmailModified(value !== initialData?.email);
    setEmailError(null);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[\d\-]*$/.test(value)) {
      setPhone(value);
      // Sprawdzamy, czy wartość jest różna od oryginalnej
      setPhoneModified(value !== initialData?.telefon);
      setPhoneError(null);
      
      // Automatyczne dodawanie myślników do numeru telefonu
      if (/^\d{3}$/.test(value)) {
        setPhone(value + '-');
        setPhoneModified(true);
      } else if (/^\d{3}\-\d{3}$/.test(value)) {
        setPhone(value + '-');
        setPhoneModified(true);
      }
    }
  };

  // Obsługa zmiany daty urodzenia
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Zmiana daty urodzenia:', value);
    
    // Podstawowe sprawdzenie formatu - akceptuje tylko cyfry i separatory
    if (value === '' || /^[\d\.\-]*$/.test(value)) {
      // Porównujemy z początkową wartością, aby ustalić czy data została zmodyfikowana
      const originalBirthDate = initialData?.data_urodzenia ? (() => {
        // Używamy tego samego kodu co w stanie initial dla porównania
        let dateValue = initialData.data_urodzenia;
        if (dateValue.includes('T')) {
          dateValue = dateValue.split('T')[0];
        }
        
        const dbFormatRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const dbFormatMatch = dateValue.match(dbFormatRegex);
        
        if (dbFormatMatch) {
          const year = dbFormatMatch[1];
          const month = dbFormatMatch[2];
          const day = dbFormatMatch[3];
          return `${year}.${month}.${day}`;
        }
        return dateValue;
      })() : '';
      
      // Sprawdzamy czy wartość jest różna od oryginalnej
      setBirthDateModified(value !== originalBirthDate);
      setBirthDate(value);
      // Resetuj błąd daty przy każdej zmianie
      setBirthDateError(null);
    
      // Autouzupełnianie kropek dla formatu YYYY.MM.DD
      if (/^\d{4}$/.test(value)) {
        setBirthDate(value + '.');
        setBirthDateModified(true);
      } else if (/^\d{4}\.\d{2}$/.test(value)) {
        setBirthDate(value + '.');
        setBirthDateModified(true);
      }
    }
  };
  
  // Funkcja do zapisywania tylko daty urodzenia
  const handleSaveBirthDate = async () => {
    // Weryfikacja, czy mamy ID użytkownika
    if (!initialData?.id) {
      setBirthDateError('Nie można zaktualizować daty - brak ID użytkownika');
      return;
    }
    
    setIsSavingBirthDate(true);
    setBirthDateError(null);
    
    try {
      // Formatowanie daty urodzenia, jeśli została wprowadzona
      let formattedBirthDate = null;
      
      if (birthDate) {
        // Sprawdź, czy to format YYYY.MM.DD (preferowany format wyświetlania)
        const yyyymmddDotsRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
        const yyyymmddMatch = birthDate.match(yyyymmddDotsRegex);
        
        if (yyyymmddMatch) {
          const year = parseInt(yyyymmddMatch[1], 10);
          const month = parseInt(yyyymmddMatch[2], 10);
          const day = parseInt(yyyymmddMatch[3], 10);
          
          // Sprawdź zakres wartości
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
            // Prosta konwersja do formatu YYYY-MM-DD (format bazy danych MySQL)
            // bez używania żadnych obiektów Date
            formattedBirthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            console.log('Skonwertowano datę z formatu YYYY.MM.DD na YYYY-MM-DD dla bazy danych:', formattedBirthDate);
            
            // Prosta walidacja, czy data istnieje w kalendarzu
            if ((month === 2 && day > 29) || 
                (month === 2 && day === 29 && !isLeapYear(year)) || 
                ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30)) {
              throw new Error(`Data ${birthDate} nie istnieje w kalendarzu`);
            }
          } else {
            throw new Error(`Nieprawidłowe wartości daty: ${birthDate}`);
          }
        } else {
          throw new Error(`Nieprawidłowy format daty: ${birthDate}. Wymagany format: RRRR.MM.DD`);
        }
      }
      
      // Wywołanie API tylko z aktualizacją daty urodzenia
      await usersApi.updateUser(initialData.id, {
        data_urodzenia: formattedBirthDate
      });
      
      // Pokaż powiadomienie o sukcesie
      toast.success('Data urodzenia została zaktualizowana');
      
      // Reset stanu modyfikacji daty po zapisie
      setBirthDateModified(false);
      
    } catch (err: any) {
      console.error('Błąd aktualizacji daty urodzenia:', err);
      setBirthDateError(err.message || 'Nieprawidłowy format daty urodzenia. Wymagany format: RRRR.MM.DD');
      toast.error('Błąd aktualizacji daty urodzenia: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setIsSavingBirthDate(false);
    }
  };
  
  // Funkcje do zapisywania poszczególnych pól
  const handleSaveUsername = async () => {
    if (!initialData?.id) {
      setUsernameError('Nie można zaktualizować loginu - brak ID użytkownika');
      return;
    }
    
    if (!username.trim()) {
      setUsernameError('Login nie może być pusty');
      return;
    }
    
    setIsSavingUsername(true);
    setUsernameError(null);
    
    try {
      await usersApi.updateUser(initialData.id, { username });
      toast.success('Login został zaktualizowany');
      setUsernameModified(false);
    } catch (err: any) {
      console.error('Błąd aktualizacji loginu:', err);
      setUsernameError(err.message || 'Nie udało się zaktualizować loginu');
      toast.error('Błąd aktualizacji loginu: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setIsSavingUsername(false);
    }
  };
  
  const handleSavePassword = async () => {
    if (!initialData?.id) {
      setPasswordError('Nie można zaktualizować hasła - brak ID użytkownika');
      return;
    }
    
    if (!password) {
      setPasswordError('Hasło nie może być puste');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Hasła muszą być identyczne');
      return;
    }
    
    setIsSavingPassword(true);
    setPasswordError(null);
    
    try {
      await usersApi.updateUser(initialData.id, { password });
      toast.success('Hasło zostało zaktualizowane');
      setPasswordModified(false);
      setConfirmPasswordModified(false);
      setPassword('');
      setConfirmPassword('');
      setPasswordsMatch(false);
    } catch (err: any) {
      console.error('Błąd aktualizacji hasła:', err);
      setPasswordError(err.message || 'Nie udało się zaktualizować hasła');
      toast.error('Błąd aktualizacji hasła: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setIsSavingPassword(false);
    }
  };
  
  const handleSaveFirstName = async () => {
    if (!initialData?.id) {
      setFirstNameError('Nie można zaktualizować imienia - brak ID użytkownika');
      return;
    }
    
    if (!firstName.trim()) {
      setFirstNameError('Imię nie może być puste');
      return;
    }
    
    setIsSavingFirstName(true);
    setFirstNameError(null);
    
    try {
      await usersApi.updateUser(initialData.id, { imie: firstName });
      toast.success('Imię zostało zaktualizowane');
      setFirstNameModified(false);
    } catch (err: any) {
      console.error('Błąd aktualizacji imienia:', err);
      setFirstNameError(err.message || 'Nie udało się zaktualizować imienia');
      toast.error('Błąd aktualizacji imienia: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setIsSavingFirstName(false);
    }
  };
  
  const handleSaveLastName = async () => {
    if (!initialData?.id) {
      setLastNameError('Nie można zaktualizować nazwiska - brak ID użytkownika');
      return;
    }
    
    if (!lastName.trim()) {
      setLastNameError('Nazwisko nie może być puste');
      return;
    }
    
    setIsSavingLastName(true);
    setLastNameError(null);
    
    try {
      await usersApi.updateUser(initialData.id, { nazwisko: lastName });
      toast.success('Nazwisko zostało zaktualizowane');
      setLastNameModified(false);
    } catch (err: any) {
      console.error('Błąd aktualizacji nazwiska:', err);
      setLastNameError(err.message || 'Nie udało się zaktualizować nazwiska');
      toast.error('Błąd aktualizacji nazwiska: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setIsSavingLastName(false);
    }
  };
  
  const handleSaveEmail = async () => {
    if (!initialData?.id) {
      setEmailError('Nie można zaktualizować emaila - brak ID użytkownika');
      return;
    }
    
    // Sprawdzanie formatu email
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Nieprawidłowy format adresu email');
      return;
    }
    
    setIsSavingEmail(true);
    setEmailError(null);
    
    try {
      await usersApi.updateUser(initialData.id, { email });
      toast.success('Email został zaktualizowany');
      setEmailModified(false);
    } catch (err: any) {
      console.error('Błąd aktualizacji emaila:', err);
      setEmailError(err.message || 'Nie udało się zaktualizować emaila');
      toast.error('Błąd aktualizacji emaila: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setIsSavingEmail(false);
    }
  };
  
  const handleSavePhone = async () => {
    if (!initialData?.id) {
      setPhoneError('Nie można zaktualizować telefonu - brak ID użytkownika');
      return;
    }
    
    // Sprawdzanie formatu telefonu
    if (phone && !/^\d{3}-\d{3}-\d{3}$/.test(phone)) {
      setPhoneError('Nieprawidłowy format telefonu (XXX-XXX-XXX)');
      return;
    }
    
    setIsSavingPhone(true);
    setPhoneError(null);
    
    try {
      await usersApi.updateUser(initialData.id, { telefon: phone });
      toast.success('Telefon został zaktualizowany');
      setPhoneModified(false);
    } catch (err: any) {
      console.error('Błąd aktualizacji telefonu:', err);
      setPhoneError(err.message || 'Nie udało się zaktualizować telefonu');
      toast.error('Błąd aktualizacji telefonu: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setIsSavingPhone(false);
    }
  };
  
  // Sprawdzanie poprawności formularza
  const validateForm = () => {
    const errors: string[] = [];
    
    // Podstawowe walidacje
    if (!username) errors.push('Nazwa użytkownika jest wymagana');
    if (!isEditMode && !password) errors.push('Hasło jest wymagane');
    if (!firstName) errors.push('Imię jest wymagane');
    if (!lastName) errors.push('Nazwisko jest wymagane');
    if (selectedRoles.length === 0) errors.push('Wybierz co najmniej jedną rolę');
    
    // Sprawdzanie zgodności haseł
    if ((!isEditMode || changePassword) && password !== confirmPassword) {
      errors.push('Hasła nie są zgodne');
    }
    
    // Walidacja daty urodzenia
    if (birthDate) {
      try {
        const date = new Date(birthDate);
        if (isNaN(date.getTime())) {
          errors.push('Nieprawidłowy format daty urodzenia');
        }
      } catch (e) {
        errors.push('Nieprawidłowy format daty urodzenia');
      }
    }
    
    // Sprawdzanie formatu email
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.push('Nieprawidłowy format adresu email');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Obsługa przycisku Zapisz
  const handleSubmit = () => {
    // Podstawowa walidacja formularza
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setLoading(true);
    
    try {
      // Tworzenie/aktualizacja adresu
      let adres = null;
      
      if (addressData.miejscowosc_id && addressData.ulica_id && addressData.nr_budynku) {
        adres = {
          ulica_id: addressData.ulica_id,
          nr_budynku: addressData.nr_budynku,
          nr_lokalu: addressData.nr_lokalu || null,
          kod_pocztowy: addressData.kod_pocztowy || '',
          miejscowosc_id: addressData.miejscowosc_id
        };
        
        console.log('Przygotowane dane adresowe do wysłania:', adres);
      }
      
      // Formatowanie daty urodzenia, jeśli została wprowadzona
      let formattedBirthDate = null;
      if (birthDate) {
        try {
          console.log('Przetwarzanie daty urodzenia przed wysłaniem:', birthDate);
          
          // Prosta bezpośrednia konwersja string-to-string bez użycia Date objects
          
          // Sprawdź, czy to format YYYY.MM.DD (preferowany format wyświetlania)
          const yyyymmddDotsRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
          const yyyymmddMatch = birthDate.match(yyyymmddDotsRegex);
          
          if (yyyymmddMatch) {
            const year = parseInt(yyyymmddMatch[1], 10);
            const month = parseInt(yyyymmddMatch[2], 10);
            const day = parseInt(yyyymmddMatch[3], 10);
            
            // Sprawdź zakres wartości
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
              // Prosta konwersja do formatu YYYY-MM-DD (format bazy danych MySQL)
    
              formattedBirthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              console.log('Skonwertowano datę z formatu YYYY.MM.DD na YYYY-MM-DD dla bazy danych:', formattedBirthDate);
              
              // Prosta walidacja, czy data istnieje w kalendarzu
              if ((month === 2 && day > 29) || 
                  (month === 2 && day === 29 && !isLeapYear(year)) || 
                  ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30)) {
                console.warn('Nieprawidłowa data (nie istnieje w kalendarzu):', formattedBirthDate);
                formattedBirthDate = null;
                throw new Error(`Data ${birthDate} nie istnieje w kalendarzu`);
              }
            } else {
              console.warn('Nieprawidłowe wartości dnia, miesiąca lub roku:', birthDate);
              throw new Error(`Nieprawidłowe wartości daty: ${birthDate}`);
            }
          } else {
            // Sprawdź, czy to format YYYY-MM-DD (format bazy danych) i przekonwertuj
            const yyyymmddHyphenRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
            const yyyymmddHyphenMatch = birthDate.match(yyyymmddHyphenRegex);
            
            if (yyyymmddHyphenMatch) {
              const year = parseInt(yyyymmddHyphenMatch[1], 10);
              const month = parseInt(yyyymmddHyphenMatch[2], 10);
              const day = parseInt(yyyymmddHyphenMatch[3], 10);
              
              // Sprawdź zakres wartości
              if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
                // Już jest w formacie bazy danych
                formattedBirthDate = birthDate;
                console.log('Data już w formacie YYYY-MM-DD dla bazy danych:', formattedBirthDate);
                
                // Prosta walidacja, czy data istnieje w kalendarzu
                if ((month === 2 && day > 29) || 
                    (month === 2 && day === 29 && !isLeapYear(year)) || 
                    ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30)) {
                  console.warn('Nieprawidłowa data (nie istnieje w kalendarzu):', formattedBirthDate);
                  formattedBirthDate = null;
                  throw new Error(`Data ${birthDate} nie istnieje w kalendarzu`);
                }
              } else {
                console.warn('Nieprawidłowe wartości daty:', birthDate);
                throw new Error(`Nieprawidłowe wartości daty: ${birthDate}`);
              }
            } else {
              throw new Error(`Nieprawidłowy format daty: ${birthDate}. Wymagany format: RRRR.MM.DD`);
            }
          }
        } catch (err: any) {
          console.error('Błąd podczas formatowania daty urodzenia:', err);
          setError(err.message || 'Nieprawidłowy format daty urodzenia. Wymagany format: RRRR.MM.DD');
          setLoading(false);
          return; // Przerwij przesyłanie formularza w przypadku błędu daty
        }
      }
      
      // Dane użytkownika
      const userData = {
        username,
        ...((!isEditMode || changePassword) && password ? { password } : {}), // Dodaj hasło tylko jeśli zostało podane lub zmiana hasła jest włączona
        imie: firstName,
        nazwisko: lastName,
        data_urodzenia: formattedBirthDate,
        adres,
        email,
        telefon: phone,
        roles: selectedRoles,
        przypisani_kandydaci: selectedRoles.includes('rodzic') ? selectedCandidates : [],
        przypisane_grupy: selectedRoles.includes('animator') ? selectedGrupy : []
      };
      
      console.log('Dane użytkownika do wysłania:', { 
        ...userData, 
        password: userData.password ? '******' : undefined,
        data_urodzenia: userData.data_urodzenia,
        adres: userData.adres ? 'Obiekt adresu jest obecny' : 'Brak adresu'
      });
      
      // Wywołanie przekazanej funkcji onSubmit
      onSubmit(userData);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas zapisywania danych');
      console.error('Błąd formularza:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sprawdzanie czy użytkownik ma rolę kandydata
  const isCandidate = selectedRoles.includes('kandydat');

  // Renderowanie zakładek
  const renderTabs = () => {
    return (
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'basic'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('basic')}
          type="button"
        >
          Dane podstawowe
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'contact'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('contact')}
          type="button"
        >
          Dane kontaktowe
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'address'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('address')}
          type="button"
        >
          Dane adresowe
        </button>
        {isCandidate && (
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'candidate-data'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('candidate-data')}
            type="button"
          >
            Dane kandydata
          </button>
        )}
      </div>
    );
  };

  // Renderowanie zawartości zakładki z danymi podstawowymi
  const renderBasicDataTab = () => {
    return (
      <div className="space-y-4">
        {/* Login */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Login *
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                disabled={loading || isSavingUsername}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                placeholder="Nazwa użytkownika"
              />
            </div>
            
            {isEditMode && initialData?.id && usernameModified && (
              <button
                type="button"
                onClick={handleSaveUsername}
                disabled={loading || isSavingUsername}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSavingUsername ? (
                  <>
                    <span className="animate-spin mr-1">&#8635;</span>
                    Zapisuję...
                  </>
                ) : (
                  'Zapisz login'
                )}
              </button>
            )}
          </div>
          
          {usernameError && (
            <p className="text-xs text-red-400 mt-1">
              {usernameError}
            </p>
          )}
        </div>
        
        {/* Opcja zmiany hasła dla istniejących użytkowników */}
        {isEditMode && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="change-password"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
              className="form-checkbox h-4 w-4 text-amber-600 transition duration-150 ease-in-out"
            />
            <label htmlFor="change-password" className="text-sm text-gray-300">
              Zmień hasło
            </label>
          </div>
        )}
        
        {/* Hasło - tylko dla nowych użytkowników lub przy zmianie hasła */}
        {(!isEditMode || changePassword) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Hasło {!isEditMode && '*'}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading || isSavingPassword}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required={!isEditMode}
                    placeholder="Hasło"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Powtórz hasło {!isEditMode && '*'}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={loading || isSavingPassword}
                    className={`w-full px-3 py-2 bg-gray-700 border ${
                      confirmPasswordModified && !passwordsMatch
                        ? 'border-red-600'
                        : confirmPasswordModified && passwordsMatch
                        ? 'border-green-600'
                        : 'border-gray-600'
                    } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    required={!isEditMode}
                    placeholder="Powtórz hasło"
                  />
                </div>
                
                {isEditMode && changePassword && passwordsMatch && passwordModified && confirmPasswordModified && (
                  <button
                    type="button"
                    onClick={handleSavePassword}
                    disabled={loading || isSavingPassword || !passwordsMatch}
                    className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSavingPassword ? (
                      <>
                        <span className="animate-spin mr-1">&#8635;</span>
                        Zapisuję...
                      </>
                    ) : (
                      'Zapisz hasło'
                    )}
                  </button>
                )}
              </div>
              
              {confirmPasswordModified && !passwordsMatch && (
                <p className="text-xs text-red-400 mt-1">
                  Hasła nie są identyczne
                </p>
              )}
              
              {passwordError && (
                <p className="text-xs text-red-400 mt-1">
                  {passwordError}
                </p>
              )}
            </div>
          </>
        )}
        
        {/* Imię */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Imię *
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={firstName}
                onChange={handleFirstNameChange}
                disabled={loading || isSavingFirstName}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                placeholder="Podaj imię"
              />
            </div>
            
            {isEditMode && initialData?.id && firstNameModified && (
              <button
                type="button"
                onClick={handleSaveFirstName}
                disabled={loading || isSavingFirstName}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSavingFirstName ? (
                  <>
                    <span className="animate-spin mr-1">&#8635;</span>
                    Zapisuję...
                  </>
                ) : (
                  'Zapisz imię'
                )}
              </button>
            )}
          </div>
          
          {firstNameError && (
            <p className="text-xs text-red-400 mt-1">
              {firstNameError}
            </p>
          )}
        </div>
        
        {/* Nazwisko */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nazwisko *
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={lastName}
                onChange={handleLastNameChange}
                disabled={loading || isSavingLastName}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                placeholder="Podaj nazwisko"
              />
            </div>
            
            {isEditMode && initialData?.id && lastNameModified && (
              <button
                type="button"
                onClick={handleSaveLastName}
                disabled={loading || isSavingLastName}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSavingLastName ? (
                  <>
                    <span className="animate-spin mr-1">&#8635;</span>
                    Zapisuję...
                  </>
                ) : (
                  'Zapisz nazwisko'
                )}
              </button>
            )}
          </div>
          
          {lastNameError && (
            <p className="text-xs text-red-400 mt-1">
              {lastNameError}
            </p>
          )}
        </div>

        {/* Data urodzenia */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Data urodzenia
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={birthDate}
                onChange={handleBirthDateChange}
                disabled={loading || isSavingBirthDate}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="RRRR.MM.DD"
              />
            </div>
            
            {isEditMode && initialData?.id && birthDateModified && (
              <button
                type="button"
                onClick={handleSaveBirthDate}
                disabled={loading || isSavingBirthDate}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSavingBirthDate ? (
                  <>
                    <span className="animate-spin mr-1">&#8635;</span>
                    Zapisuję...
                  </>
                ) : (
                  'Zapisz datę'
                )}
              </button>
            )}
          </div>
          
          <div className="mt-1">
            <p className="text-xs text-gray-400">
              Format: RRRR.MM.DD (np. 2010.06.28)
            </p>
            
            {birthDateError && (
              <p className="text-xs text-red-400 mt-1">
                {birthDateError}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderowanie zawartości zakładki z danymi kontaktowymi
  const renderContactDataTab = () => {
    const isParentRoleSelected = selectedRoles.includes('rodzic');
    const isAnimatorRoleSelected = selectedRoles.includes('animator');
    
    return (
      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading || isSavingEmail}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="adres@email.pl"
              />
            </div>
            
            {isEditMode && initialData?.id && emailModified && (
              <button
                type="button"
                onClick={handleSaveEmail}
                disabled={loading || isSavingEmail}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSavingEmail ? (
                  <>
                    <span className="animate-spin mr-1">&#8635;</span>
                    Zapisuję...
                  </>
                ) : (
                  'Zapisz email'
                )}
              </button>
            )}
          </div>
          
          {emailError && (
            <p className="text-xs text-red-400 mt-1">
              {emailError}
            </p>
          )}
        </div>
        
        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Telefon
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading || isSavingPhone}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="XXX-XXX-XXX"
              />
            </div>
            
            {isEditMode && initialData?.id && phoneModified && (
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={loading || isSavingPhone}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSavingPhone ? (
                  <>
                    <span className="animate-spin mr-1">&#8635;</span>
                    Zapisuję...
                  </>
                ) : (
                  'Zapisz telefon'
                )}
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-400 mt-1">Format: XXX-XXX-XXX</p>
          
          {phoneError && (
            <p className="text-xs text-red-400 mt-1">
              {phoneError}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Role
          </label>
          <div className="space-y-1 mt-2 p-3 bg-gray-700 border border-gray-600 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { id: 'administrator', label: 'Administrator' },
                { id: 'duszpasterz', label: 'Duszpasterz' },
                { id: 'kancelaria', label: 'Pracownik kancelarii' },
                { id: 'animator', label: 'Animator' },
                { id: 'rodzic', label: 'Rodzic' },
                { id: 'kandydat', label: 'Kandydat' }
              ].map(role => (
                <div key={role.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    value={role.id}
                    checked={selectedRoles.includes(role.id)}
                    onChange={handleRoleChange}
                    disabled={loading}
                    className="w-4 h-4 text-amber-600 border-gray-500 rounded focus:ring-amber-500 bg-gray-700"
                  />
                  <label htmlFor={`role-${role.id}`} className="ml-2 text-sm text-gray-300">
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Przypisanie kandydatów dla roli rodzica */}
        {isParentRoleSelected && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Przypisani kandydaci *
            </label>
            <div className="relative">
              {loadingCandidates ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                  <span className="ml-2 text-gray-300">Ładowanie kandydatów...</span>
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-300">
                  Brak dostępnych kandydatów. {' '}
                  <button 
                    type="button" 
                    onClick={fetchCandidates}
                    className="text-amber-500 hover:text-amber-400 underline"
                  >
                    Odśwież
                  </button>
                </div>
              ) : (
                <>
                  <select
                    multiple
                    value={selectedCandidates.map(String)}
                    onChange={handleCandidateChange}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    size={Math.min(5, candidates.length)}
                  >
                    {candidates.map(candidate => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.imie} {candidate.nazwisko} ({candidate.username})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Przytrzymaj klawisz Ctrl (Cmd na Mac), aby wybrać wielu kandydatów
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Przypisanie grup dla roli animatora */}
        {isAnimatorRoleSelected && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Przypisane grupy formacyjne
            </label>
            <div className="relative">
              {loadingGrupy ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                  <span className="ml-2 text-gray-300">Ładowanie grup...</span>
                </div>
              ) : grupy.length === 0 ? (
                <div className="p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-300">
                  Brak dostępnych grup. {' '}
                  <button 
                    type="button" 
                    onClick={fetchGrupy}
                    className="text-amber-500 hover:text-amber-400 underline"
                  >
                    Odśwież
                  </button>
                </div>
              ) : (
                <>
                  <select
                    multiple
                    value={selectedGrupy.map(String)}
                    onChange={handleGrupyChange}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    size={Math.min(5, grupy.length)}
                  >
                    {grupy.map(grupa => (
                      <option key={grupa.id} value={grupa.id}>
                        {grupa.nazwa}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Przytrzymaj klawisz Ctrl (Cmd na Mac), aby wybrać wiele grup
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderowanie zawartości zakładki z danymi adresowymi
  const renderAddressDataTab = () => {
    console.log('Rendering address data tab with address data:', addressData);
    console.log('Original address data from initialData:', initialData?.adres);
    
    return (
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 mb-4 rounded border border-gray-700">
          <h3 className="text-amber-500 font-medium mb-2">Dane adresowe</h3>
          {addressData.miejscowosc_id ? (
            <p className="text-sm text-gray-300">
              Aktualne dane adresowe są załadowane i gotowe do edycji.
            </p>
          ) : (
            <p className="text-sm text-yellow-400">
              {initialData?.adres ? 
                "Ładowanie danych adresowych..." : 
                "Brak danych adresowych. Wypełnij formularz poniżej."}
            </p>
          )}
        </div>
        
        <AddressForm 
          onAddressSelected={(addressData) => {
            // Zapisujemy dane adresu do formularza
            console.log('Address form returned data:', addressData);
            setAddressData(addressData);
            toast.success('Dane adresowe zapisane pomyślnie');
          }}
          initialData={addressData}
          noForm={true}
        />
      </div>
    );
  };

  // Renderowanie sub-zakładek dla danych kandydata
  const renderCandidateDataTabs = () => {
    return (
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            candidateDataTab === 'rodzic'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setCandidateDataTab('rodzic')}
          type="button"
        >
          Rodzic
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            candidateDataTab === 'swiadek'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setCandidateDataTab('swiadek')}
          type="button"
        >
          Świadek
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            candidateDataTab === 'imie'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setCandidateDataTab('imie')}
          type="button"
        >
          Imię bierzmowania
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            candidateDataTab === 'szkola'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setCandidateDataTab('szkola')}
          type="button"
        >
          Szkoła
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            candidateDataTab === 'parafia'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setCandidateDataTab('parafia')}
          type="button"
        >
          Parafia
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            candidateDataTab === 'grupa'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setCandidateDataTab('grupa')}
          type="button"
        >
          Grupa
        </button>
      </div>
    );
  };
  
  // Renderowanie zawartości zakładki z danymi kandydata
  const renderCandidateDataTab = () => {
    // Success handler for the candidate forms
    const handleFormSuccess = async () => {
      toast.success('Dane zostały zaktualizowane');
      
      // Refresh candidate data if we have an initialData.id
      if (initialData?.id) {
        try {
          // We don't need to update initialData here as the parent component
          // should handle refreshing data on its own if needed
          console.log('Form submission successful, data updated for candidate:', initialData.id);
        } catch (error) {
          console.error('Błąd podczas aktualizacji danych kandydata:', error);
        }
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-amber-500 italic mb-4">
          Uzupełnij dane kandydata. Możesz to zrobić również po utworzeniu konta.
        </p>
        
        {renderCandidateDataTabs()}
        
        {candidateDataTab === 'rodzic' && (
          <div className="bg-gray-700/30 p-4 rounded">
            <h3 className="text-amber-500 text-lg mb-2">Dane rodzica</h3>
            {initialData?.id ? (
              <KandydatRodzicForm 
                kandydatId={initialData.id.toString()}
                initialData={initialData}
                onSuccess={handleFormSuccess}
                readOnly={isSubmitting}
              />
            ) : (
              <p className="text-gray-300">
                Dane rodzica będzie można uzupełnić po utworzeniu konta użytkownika.
              </p>
            )}
          </div>
        )}
        
        {candidateDataTab === 'swiadek' && (
          <div className="bg-gray-700/30 p-4 rounded">
            <h3 className="text-amber-500 text-lg mb-2">Dane świadka</h3>
            {initialData?.id ? (
              <KandydatSwiadekForm 
                kandydatId={initialData.id.toString()}
                initialData={initialData}
                onSuccess={handleFormSuccess}
                readOnly={isSubmitting}
              />
            ) : (
              <p className="text-gray-300">
                Dane świadka będzie można uzupełnić po utworzeniu konta użytkownika.
              </p>
            )}
          </div>
        )}
        
        {candidateDataTab === 'imie' && (
          <div className="bg-gray-700/30 p-4 rounded">
            <h3 className="text-amber-500 text-lg mb-2">Imię bierzmowania</h3>
            {initialData?.id ? (
              <KandydatImieBierzmowaniaForm 
                kandydatId={initialData.id.toString()}
                initialData={initialData}
                onSuccess={handleFormSuccess}
                readOnly={isSubmitting}
              />
            ) : (
              <p className="text-gray-300">
                Imię bierzmowania będzie można uzupełnić po utworzeniu konta użytkownika.
              </p>
            )}
          </div>
        )}
        
        {candidateDataTab === 'szkola' && (
          <div className="bg-gray-700/30 p-4 rounded">
            <h3 className="text-amber-500 text-lg mb-2">Dane szkoły</h3>
            {initialData?.id ? (
              <KandydatSzkolaForm 
                kandydatId={initialData.id.toString()}
                initialData={initialData}
                onSuccess={handleFormSuccess}
                readOnly={isSubmitting}
              />
            ) : (
              <p className="text-gray-300">
                Dane szkoły będzie można uzupełnić po utworzeniu konta użytkownika.
              </p>
            )}
          </div>
        )}
        
        {candidateDataTab === 'parafia' && (
          <div className="bg-gray-700/30 p-4 rounded">
            <h3 className="text-amber-500 text-lg mb-2">Parafia</h3>
            {initialData?.id ? (
              <KandydatParafiaForm 
                kandydatId={initialData.id.toString()}
                initialData={initialData}
                onSuccess={handleFormSuccess}
                readOnly={isSubmitting}
              />
            ) : (
              <p className="text-gray-300">
                Dane parafii będzie można uzupełnić po utworzeniu konta użytkownika.
              </p>
            )}
          </div>
        )}
        
        {candidateDataTab === 'grupa' && (
          <div className="bg-gray-700/30 p-4 rounded">
            <h3 className="text-amber-500 text-lg mb-2">Grupa formacyjna</h3>
            {initialData?.id ? (
              <KandydatGrupaForm 
                kandydatId={initialData.id.toString()}
                initialData={initialData}
                onSuccess={handleFormSuccess}
                readOnly={isSubmitting}
              />
            ) : (
              <p className="text-gray-300">
                Przypisanie do grupy będzie można wykonać po utworzeniu konta użytkownika.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderowanie aktywnej zakładki
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicDataTab();
      case 'contact':
        return renderContactDataTab();
      case 'address':
        return renderAddressDataTab();
      case 'candidate-data':
        return renderCandidateDataTab();
      default:
        return renderBasicDataTab();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-300 mb-4">
          {error}
        </div>
      )}
      
      {renderTabs()}
      {renderActiveTabContent()}
      
      {/* Przyciski */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
        {onCancel && (
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            Anuluj
          </button>
        )}
        
        <button
          type="button"
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          onClick={() => {
            // Nawigacja wstecz/dalej między zakładkami
            if (activeTab === 'basic') {
              setActiveTab('contact');
            } else if (activeTab === 'contact') {
              setActiveTab('address');
            } else {
              // Zakładka adresowa - przycisk służy do przejścia z powrotem do danych podstawowych
              setActiveTab('basic');
            }
          }}
          disabled={loading || isSubmitting}
        >
          {activeTab === 'address' ? 'Wróć do danych podstawowych' : 'Dalej'}
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || isSubmitting}
        >
          {loading || isSubmitting ? 'Zapisywanie...' : isEditMode ? 'Zapisz zmiany' : 'Dodaj użytkownika'}
        </button>
      </div>
    </form>
  );
};

export default UserForm; 