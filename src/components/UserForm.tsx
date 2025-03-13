import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AddressForm from './AddressForm';
import { validateAddress, createAddress } from '../utils/addressUtils';
import { usersApi, grupyApi } from '../services/api';
import KandydatRodzicForm from './KandydatRodzicForm';
import KandydatGrupaForm from './KandydatGrupaForm';
import KandydatParafiaForm from './KandydatParafiaForm';
import KandydatSwiadekForm from './KandydatSwiadekForm';
import KandydatImieBierzmowaniaForm from './KandydatImieBierzmowaniaForm';
import KandydatSzkolaForm from './KandydatSzkolaForm';

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
    
    // Jeśli data istnieje, upewnij się, że jest w prawidłowym formacie YYYY-MM-DD
    if (initialData?.data_urodzenia) {
      try {
        // Usuń część czasową, jeśli istnieje (może pochodzić z API jako ISO string)
        let dateValue = initialData.data_urodzenia;
        if (dateValue.includes('T')) {
          dateValue = dateValue.split('T')[0];
          console.log('Usunięto część czasową z daty:', dateValue);
        }
        
        // Sprawdź, czy data jest już w formacie YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateValue)) {
          // Dodatkowo sprawdź, czy data jest prawidłowa
          const testDate = new Date(dateValue);
          if (!isNaN(testDate.getTime())) {
            console.log('Data urodzenia już w poprawnym formacie:', dateValue);
            return dateValue;
          } else {
            console.warn('Data w formacie YYYY-MM-DD, ale nieprawidłowa:', dateValue);
          }
        }
        
        // Spróbuj przekonwertować datę na format YYYY-MM-DD
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          console.log('Sformatowana data urodzenia:', formattedDate);
          return formattedDate;
        } else {
          console.warn('Nieprawidłowa data urodzenia z API:', dateValue);
          
          // Spróbuj innych formatów
          // Sprawdź, czy to format DD.MM.YYYY
          if (typeof dateValue === 'string') {
            const ddmmyyyy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
            const match = dateValue.match(ddmmyyyy);
            if (match) {
              const day = match[1].padStart(2, '0');
              const month = match[2].padStart(2, '0');
              const year = match[3];
              const formattedDate = `${year}-${month}-${day}`;
              
              // Sprawdź, czy data jest prawidłowa
              const testDate = new Date(formattedDate);
              if (!isNaN(testDate.getTime())) {
                console.log('Sformatowana data z formatu DD.MM.YYYY:', formattedDate);
                return formattedDate;
              } else {
                console.warn('Nieprawidłowa data po konwersji z DD.MM.YYYY:', formattedDate);
              }
            }
          }
        }
      } catch (e) {
        console.error('Błąd podczas formatowania daty urodzenia:', e);
      }
    }
    return '';  // Zwróć pusty string jako wartość domyślna, gdy nie ma daty
  });
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.telefon || '');
  
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
      // Ustaw początkowe wartości dla ról
      if (initialData.roles) {
        setSelectedRoles(Array.isArray(initialData.roles) 
          ? initialData.roles 
          : initialData.roles.split(','));
      }
      
      // Inicjalizacja adresu jeśli istnieje
      if (initialData.adres_id) {
        // Tu powinno być pobranie danych adresu z API i ustawienie ich w komponencie
        // Dla uproszczenia zakładamy, że dane adresu są przekazane w initialData
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

  // Formatowanie numeru telefonu
  const formatPhoneNumber = (phone: string) => {
    // Usuń wszystkie znaki oprócz cyfr
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Format XXX-XXX-XXX
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
    } else {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 9)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    // Ogranicz do max 11 znaków (XXX-XXX-XXX)
    if (formatted.length <= 11) {
      setPhone(formatted);
    }
  };

  // Obsługa zmiany daty urodzenia
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Zmiana daty urodzenia:', value);
    setBirthDate(value);
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
  
  // Funkcja obsługująca przesłanie formularza
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          kod_pocztowy: addressData.kod_pocztowy || null
        };
      }
      
      // Formatowanie daty urodzenia, jeśli została wprowadzona
      let formattedBirthDate = null;
      if (birthDate) {
        try {
          console.log('Przetwarzanie daty urodzenia przed wysłaniem:', birthDate);
          
          // Sprawdź, czy to format YYYY.MM.DD (preferowany format)
          const yyyymmddDotsRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
          const yyyymmddMatch = birthDate.match(yyyymmddDotsRegex);
          
          if (yyyymmddMatch) {
            const year = parseInt(yyyymmddMatch[1], 10);
            const month = parseInt(yyyymmddMatch[2], 10);
            const day = parseInt(yyyymmddMatch[3], 10);
            
            // Sprawdź zakres wartości
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
              formattedBirthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              console.log('Sformatowana data z formatu YYYY.MM.DD na YYYY-MM-DD dla bazy:', formattedBirthDate);
              
              // Sprawdź, czy data faktycznie istnieje (np. 30 lutego nie istnieje)
              const checkDate = new Date(formattedBirthDate);
              if (isNaN(checkDate.getTime()) || 
                  checkDate.getFullYear() !== year || 
                  checkDate.getMonth() + 1 !== month || 
                  checkDate.getDate() !== day) {
                console.warn('Przekonwertowana data jest nieprawidłowa:', formattedBirthDate);
                formattedBirthDate = null;
                throw new Error(`Data ${birthDate} nie istnieje w kalendarzu`);
              }
            } else {
              console.warn('Nieprawidłowe wartości dnia, miesiąca lub roku:', birthDate);
              throw new Error(`Nieprawidłowe wartości daty: ${birthDate}`);
            }
          } else {
            // Sprawdź, czy to format DD.MM.YYYY
            const ddmmyyyyRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
            const ddmmMatch = birthDate.match(ddmmyyyyRegex);
            
            if (ddmmMatch) {
              const day = parseInt(ddmmMatch[1], 10);
              const month = parseInt(ddmmMatch[2], 10);
              const year = parseInt(ddmmMatch[3], 10);
              
              // Sprawdź zakres wartości
              if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
                formattedBirthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                console.log('Sformatowana data z formatu DD.MM.YYYY na YYYY-MM-DD dla bazy:', formattedBirthDate);
                
                // Sprawdź, czy data faktycznie istnieje
                const checkDate = new Date(formattedBirthDate);
                if (isNaN(checkDate.getTime()) || 
                    checkDate.getFullYear() !== year || 
                    checkDate.getMonth() + 1 !== month || 
                    checkDate.getDate() !== day) {
                  console.warn('Przekonwertowana data jest nieprawidłowa:', formattedBirthDate);
                  formattedBirthDate = null;
                  throw new Error(`Data ${birthDate} nie istnieje w kalendarzu`);
                }
              } else {
                console.warn('Nieprawidłowe wartości dnia, miesiąca lub roku:', birthDate);
                throw new Error(`Nieprawidłowe wartości daty: ${birthDate}`);
              }
            } else {
              // Jeśli to nie jest format YYYY.MM.DD ani DD.MM.YYYY, spróbuj YYYY-MM-DD
              const yyyymmddHyphenRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
              const yyyymmddHyphenMatch = birthDate.match(yyyymmddHyphenRegex);
              
              if (yyyymmddHyphenMatch) {
                const year = parseInt(yyyymmddHyphenMatch[1], 10);
                const month = parseInt(yyyymmddHyphenMatch[2], 10);
                const day = parseInt(yyyymmddHyphenMatch[3], 10);
                
                // Sprawdź zakres wartości
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
                  formattedBirthDate = birthDate;
                  console.log('Data już w formacie YYYY-MM-DD dla bazy:', formattedBirthDate);
                  
                  // Sprawdź, czy data faktycznie istnieje
                  const checkDate = new Date(formattedBirthDate);
                  if (isNaN(checkDate.getTime()) || 
                      checkDate.getFullYear() !== year || 
                      checkDate.getMonth() + 1 !== month || 
                      checkDate.getDate() !== day) {
                    console.warn('Data jest nieprawidłowa:', formattedBirthDate);
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
          }
        } catch (e: any) {
          console.error('Błąd podczas formatowania daty urodzenia:', e);
          setError(e.message || 'Nieprawidłowy format daty urodzenia. Wymagany format: RRRR.MM.DD');
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
        adres: adres,
        email,
        telefon: phone,
        roles: selectedRoles,
        przypisani_kandydaci: selectedRoles.includes('rodzic') ? selectedCandidates : [],
        przypisane_grupy: selectedRoles.includes('animator') ? selectedGrupy : []
      };
      
      console.log('Dane użytkownika do wysłania:', { 
        ...userData, 
        password: userData.password ? '******' : undefined,
        data_urodzenia: userData.data_urodzenia 
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
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading || (isEditMode && initialData?.username)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
            placeholder="Nazwa użytkownika"
          />
        </div>
        
        {/* Opcja zmiany hasła dla istniejących użytkowników */}
        {isEditMode && (
          <div className="mt-4 p-3 bg-gray-700/30 rounded-md">
            <div className="flex items-center justify-between">
              <label htmlFor="change-password" className="text-sm font-medium text-gray-300">
                Zmiana hasła
              </label>
              <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  id="change-password"
                  checked={changePassword}
                  onChange={() => setChangePassword(!changePassword)}
                  className={`absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-600 appearance-none cursor-pointer right-6 transition-all duration-200 ease-in ${
                    changePassword ? 'right-0 border-amber-500' : ''
                  }`}
                />
                <label
                  htmlFor="change-password"
                  className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in ${
                    changePassword ? 'bg-amber-500' : 'bg-gray-600'
                  }`}
                ></label>
              </div>
            </div>
          </div>
        )}
        
        {/* Hasło - tylko dla nowych użytkowników lub przy zmianie hasła */}
        {(!isEditMode || changePassword) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Hasło {!isEditMode && '*'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required={!isEditMode}
                placeholder="Hasło"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Powtórz hasło {!isEditMode && '*'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required={!isEditMode}
                placeholder="Powtórz hasło"
              />
            </div>
          </>
        )}
        
        {/* Imię */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Imię *
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
            placeholder="Podaj imię"
          />
        </div>
        
        {/* Nazwisko */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nazwisko *
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
            placeholder="Podaj nazwisko"
          />
        </div>

        {/* Data urodzenia */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Data urodzenia
          </label>
          <input
            type="text"
            value={birthDate}
            onChange={handleBirthDateChange}
            disabled={loading}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="RRRR.MM.DD"
          />
          <p className="text-xs text-gray-400 mt-1">
            Format: RRRR.MM.DD (np. 2010.06.28)
          </p>
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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="adres@email.pl"
          />
        </div>
        
        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Telefon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            disabled={loading}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="XXX-XXX-XXX"
          />
          <p className="text-xs text-gray-400 mt-1">Format: XXX-XXX-XXX</p>
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
    return (
      <div className="space-y-4">
        <AddressForm 
          onAddressSelected={(addressData) => {
            // Zapisujemy dane adresu do formularza
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