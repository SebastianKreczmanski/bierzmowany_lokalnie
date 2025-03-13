import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Event, EventType, eventsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface EventAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
  selectedDate?: Date;
  editEvent?: Event | null;
}

const EventAddModal: React.FC<EventAddModalProps> = ({ 
  isOpen, 
  onClose, 
  onEventAdded,
  selectedDate,
  editEvent
}) => {
  const { user, hasRole } = useAuth();
  
  // Stany formularza
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['wszystkie']); // Tablica wybranych ról
  const [eventGroup, setEventGroup] = useState('');
  const [eventType, setEventType] = useState<number | ''>('');
  const [eventMandatory, setEventMandatory] = useState<boolean>(false);
  
  // Stany dla nowego typu wydarzenia
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#3B82F6');
  
  // Stany aplikacji
  const [isAddingType, setIsAddingType] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [roles, setRoles] = useState<{id: number, nazwa: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Czy jesteśmy w trybie edycji
  const isEditMode = !!editEvent;
  
  /**
   * Ładuje dane początkowe: typy wydarzeń i role
   */
  const loadInitialData = async () => {
    setIsLoading(true);
    
    try {
      const [types, roles] = await Promise.all([
        eventsApi.getEventTypes(),
        eventsApi.getRoles()
      ]);
      
      setEventTypes(types);
      setRoles(roles);
      
      console.log('Pobrane typy wydarzeń:', types);
      console.log('Pobrane role:', roles);
      
      // Sprawdź czy są niezapisane dane formularza
      checkForUnsavedEvent();
    } catch (error) {
      console.error('Błąd podczas ładowania danych początkowych:', error);
      setError('Nie udało się załadować wszystkich danych. Odśwież stronę i spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Sprawdza czy w localStorage są niezapisane dane formularza i oferuje ich przywrócenie
   */
  const checkForUnsavedEvent = () => {
    try {
      // Jeśli jesteśmy w trybie edycji, nie sprawdzamy niezapisanych danych
      if (isEditMode && editEvent) {
        localStorage.removeItem('unsavedEventData'); // Usuwamy niezapisane dane, ponieważ edytujemy istniejące wydarzenie
        return;
      }
      
      const savedData = localStorage.getItem('unsavedEventData');
      
      if (savedData) {
        const eventData = JSON.parse(savedData);
        
        // Pytamy użytkownika, czy chce przywrócić niezapisane dane
        const confirmRestore = window.confirm('Znaleziono niezapisane wydarzenie. Czy chcesz je przywrócić?');
        
        if (confirmRestore) {
          // Przywracamy dane formularza
          setEventName(eventData.nazwa);
          setEventDescription(eventData.opis || '');
          
          // Konwersja dat
          if (eventData.data_rozpoczecia) {
            const startDate = eventData.data_rozpoczecia.split('T')[0];
            const startTime = eventData.data_rozpoczecia.split('T')[1].substring(0, 5);
            setEventStartDate(startDate);
            setEventStartTime(startTime);
          }
          
          if (eventData.data_zakonczenia) {
            const endDate = eventData.data_zakonczenia.split('T')[0];
            const endTime = eventData.data_zakonczenia.split('T')[1].substring(0, 5);
            setEventEndDate(endDate);
            setEventEndTime(endTime);
          }
          
          setEventMandatory(eventData.obowiazkowe || false);
          setEventType(Number(eventData.typ_id));
          
          // Przywracanie ról
          if (eventData.dlaroli) {
            const roles = eventData.dlaroli.split(',').map((r: string) => r.trim());
            setSelectedRoles(roles);
          }
          
          setEventGroup(eventData.dlagrupy || 'wszystkie');
          
          toast.success('Przywrócono niezapisane wydarzenie');
        } else {
          // Usuwamy niezapisane dane, jeśli użytkownik nie chce ich przywrócić
          localStorage.removeItem('unsavedEventData');
        }
      }
    } catch (error) {
      console.warn('Błąd podczas sprawdzania niezapisanych danych:', error);
    }
  };
  
  /**
   * Resetuje formularz
   */
  const resetForm = () => {
    setEventName('');
    setEventDescription('');
    setEventStartDate('');
    setEventStartTime('');
    setEventEndDate('');
    setEventEndTime('');
    setSelectedRoles(['wszystkie']);
    setEventGroup('');
    setEventType('');
    setEventMandatory(false);
    setNewTypeName('');
    setNewTypeColor('#3B82F6');
    setIsAddingType(false);
    setError(null);
  };
  
  /**
   * Sprawdza, czy użytkownik może dodawać wydarzenia
   */
  const canAddEvents = (): boolean => {
    return hasRole('administrator') || hasRole('duszpasterz') || hasRole('kancelaria') || hasRole('animator');
  };
  
  /**
   * Sprawdza, czy animator ma ograniczone uprawnienia (może tworzyć wydarzenia tylko dla swoich grup)
   */
  const isAnimatorRestricted = (): boolean => {
    return hasRole('animator') && !hasRole('administrator') && !hasRole('duszpasterz') && !hasRole('kancelaria');
  };
  
  /**
   * Obsługa dodawania nowego typu wydarzenia
   */
  const handleAddEventType = async () => {
    if (!newTypeName.trim()) {
      setError('Nazwa typu wydarzenia jest wymagana');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newType = await eventsApi.createEventType({
        nazwa: newTypeName.trim(),
        kolor: newTypeColor
      });
      
      setEventTypes([...eventTypes, newType]);
      setEventType(newType.id);
      setIsAddingType(false);
      setNewTypeName('');
      toast.success('Dodano nowy typ wydarzenia');
    } catch (error) {
      console.error('Błąd podczas dodawania typu wydarzenia:', error);
      setError('Nie udało się dodać nowego typu wydarzenia');
      toast.error('Nie udało się dodać nowego typu wydarzenia');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Obsługa zmiany wyboru roli
   * @param roleName Nazwa roli
   * @param checked Czy rola jest zaznaczona
   */
  const handleRoleChange = (roleName: string, checked: boolean) => {
    if (roleName === 'wszystkie') {
      // Jeśli wybrano "wszystkie", odznacz pozostałe
      setSelectedRoles(checked ? ['wszystkie'] : []);
    } else {
      setSelectedRoles(prevRoles => {
        // Jeśli zaznaczamy rolę różną od "wszystkie", usuń "wszystkie" z listy
        const newRoles = prevRoles.filter(r => r !== 'wszystkie');
        
        if (checked) {
          // Dodaj rolę do listy
          return [...newRoles, roleName];
        } else {
          // Usuń rolę z listy
          return newRoles.filter(r => r !== roleName);
        }
      });
    }
  };
  
  /**
   * Efekt ładujący początkowe dane i ustawiający pola formularza
   */
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      
      if (isEditMode && editEvent) {
        // Ustawienie wartości formularza na podstawie edytowanego wydarzenia
        setEventName(editEvent.nazwa);
        setEventDescription(editEvent.opis || '');
        
        // Format daty i czasu
        const startDate = new Date(editEvent.data_rozpoczecia);
        setEventStartDate(startDate.toISOString().split('T')[0]);
        setEventStartTime(startDate.toTimeString().slice(0, 5));
        
        if (editEvent.data_zakonczenia) {
          const endDate = new Date(editEvent.data_zakonczenia);
          setEventEndDate(endDate.toISOString().split('T')[0]);
          setEventEndTime(endDate.toTimeString().slice(0, 5));
        }
        
        // Ustaw wybrane role na podstawie pola dlaroli (oddzielone przecinkami)
        if (editEvent.dlaroli) {
          // dlaroli zawiera ID ról oddzielone przecinkami
          const roleIds = editEvent.dlaroli.split(',').map(id => id.trim());
          console.log('Ustawiam wybrane role na podstawie dlaroli:', roleIds);
          setSelectedRoles(roleIds);
        } else {
          setSelectedRoles(['wszystkie']);
        }
        
        setEventGroup(editEvent.dlagrupy);
        setEventType(editEvent.typ_id);
        setEventMandatory(editEvent.obowiazkowe);
      } else {
        resetForm();
        // Ustaw początkową datę jeśli wybrano datę z kalendarza
        if (selectedDate) {
          const formattedDate = selectedDate.toISOString().split('T')[0];
          setEventStartDate(formattedDate);
          setEventEndDate(formattedDate);
        }
      }
    }
  }, [isOpen, selectedDate, editEvent, isEditMode, user, hasRole]);
  
  /**
   * Obsługa dodawania nowego lub aktualizacji istniejącego wydarzenia
   */
  const handleSubmitEvent = async () => {
    // Walidacja wymaganych pól
    if (!eventName || !eventStartDate || !eventStartTime || !eventType) {
      setError('Wypełnij wszystkie wymagane pola');
      return;
    }
    
    // Sprawdź czy wybrano przynajmniej jedną rolę
    if (selectedRoles.length === 0) {
      setError('Wybierz przynajmniej jedną rolę');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const startDateTime = `${eventStartDate}T${eventStartTime}:00`;
      let endDateTime: string | undefined = undefined;
      
      if (eventEndDate && eventEndTime) {
        endDateTime = `${eventEndDate}T${eventEndTime}:00`;
      }
      
      // Połącz wybrane role przecinkiem
      const rolesString = selectedRoles.join(',');
      
      // Dane wydarzenia
      const eventData = {
        nazwa: eventName,
        opis: eventDescription || null,
        data_rozpoczecia: startDateTime,
        data_zakonczenia: endDateTime,
        obowiazkowe: eventMandatory,
        typ_id: Number(eventType),
        dlaroli: rolesString,
        dlagrupy: eventGroup || 'wszystkie'
      };
      
      // Zapisanie danych formularza w localStorage jako kopia bezpieczeństwa
      try {
        localStorage.setItem('unsavedEventData', JSON.stringify(eventData));
      } catch (storageError) {
        console.warn('Nie udało się zapisać danych formularza w localStorage:', storageError);
      }
      
      let success = false;
      
      try {
        if (isEditMode && editEvent) {
          // Aktualizacja istniejącego wydarzenia
          await eventsApi.updateEvent(editEvent.id, eventData);
          toast.success('Wydarzenie zostało zaktualizowane');
          success = true;
        } else {
          // Dodanie nowego wydarzenia
          await eventsApi.createEvent(eventData as any);
          toast.success('Wydarzenie zostało dodane');
          success = true;
        }
        
        // Usunięcie kopi bezpieczeństwa po pomyślnym zapisaniu
        localStorage.removeItem('unsavedEventData');
      } catch (apiError: any) {
        // Obsługa błędów API
        console.error('Błąd API podczas zapisywania wydarzenia:', apiError);
        
        if (apiError.response && apiError.response.status === 401) {
          // Dla błędu 401 (Unauthorized) informujemy, że wydarzenie zostało zapisane lokalnie
          toast.error('Sesja wygasła. Dane formularza zostały zachowane.');
          
          // Zachowaj formularz otwarty, aby użytkownik mógł wrócić do niego po zalogowaniu
          setError('Sesja wygasła. Zaloguj się, aby kontynuować i zapisać wydarzenie.');
          success = false;
        } else {
          // Dla innych błędów pokazujemy komunikat
          const errorMsg = apiError.response?.data?.message || 'Wystąpił błąd podczas zapisywania wydarzenia';
          setError(errorMsg);
          toast.error(errorMsg);
          success = false;
        }
      }
      
      if (success) {
        resetForm();
        onEventAdded();
        onClose();
      }
    } catch (error) {
      console.error('Błąd podczas przygotowywania danych wydarzenia:', error);
      setError('Wystąpił nieoczekiwany błąd');
      toast.error('Wystąpił nieoczekiwany błąd');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Jeśli modal jest zamknięty, nie renderujemy zawartości
  if (!isOpen) return null;

  // Renderowanie modalu
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-gray-800 w-full max-w-2xl rounded-lg shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-amber-400">
            {isEditMode ? 'Edytuj wydarzenie' : 'Dodaj nowe wydarzenie'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {!canAddEvents() ? (
            <p className="text-red-400">Nie masz uprawnień do dodawania wydarzeń.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitEvent(); }}>
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-300">
                  {error}
                </div>
              )}
              
              {/* Nazwa wydarzenia */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nazwa wydarzenia *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              {/* Opis wydarzenia */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Opis wydarzenia
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                />
              </div>
              
              {/* Data i czas rozpoczęcia */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Data rozpoczęcia *
                  </label>
                  <input
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Czas rozpoczęcia *
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
              
              {/* Data i czas zakończenia */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Data zakończenia
                  </label>
                  <input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Czas zakończenia
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              {/* Typ wydarzenia */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Typ wydarzenia *
                </label>
                {!isAddingType ? (
                  <div className="flex">
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value ? Number(e.target.value) : '')}
                      className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="">Wybierz typ wydarzenia</option>
                      {eventTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.nazwa}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingType(true)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-r-md hover:bg-amber-700"
                      disabled={isLoading}
                    >
                      Nowy typ
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Nazwa nowego typu"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="w-12 h-10 bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleAddEventType}
                        className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm"
                        disabled={isLoading}
                      >
                        Dodaj
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingType(false)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                        disabled={isLoading}
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Obowiązkowe */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={eventMandatory}
                    onChange={(e) => setEventMandatory(e.target.checked)}
                    className="mr-2 w-4 h-4 text-amber-600 border-gray-500 rounded focus:ring-amber-500 bg-gray-700"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Wydarzenie obowiązkowe
                  </span>
                </label>
              </div>
              
              {/* Dla roli i grupy (tylko dla administratorów, duszpasterzy i kancelarii) */}
              {(hasRole('administrator') || hasRole('duszpasterz') || hasRole('kancelaria')) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Dla roli (wybierz jedną lub więcej)
                    </label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-700 border border-gray-600 rounded-md">
                      {/* Checkbox dla "wszystkie" */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="role-all"
                          checked={selectedRoles.includes('wszystkie')}
                          onChange={(e) => handleRoleChange('wszystkie', e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-gray-500 rounded focus:ring-amber-500 bg-gray-700"
                        />
                        <label htmlFor="role-all" className="ml-2 text-sm text-gray-300">
                          Wszyscy
                        </label>
                      </div>
                      
                      {/* Checkboxy dla każdej roli */}
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`role-${role.id}`}
                            checked={selectedRoles.includes(role.id.toString())}
                            onChange={(e) => handleRoleChange(role.id.toString(), e.target.checked)}
                            disabled={selectedRoles.includes('wszystkie')}
                            className="w-4 h-4 text-amber-600 border-gray-500 rounded focus:ring-amber-500 bg-gray-700 disabled:opacity-50"
                          />
                          <label htmlFor={`role-${role.id}`} className="ml-2 text-sm text-gray-300">
                            {role.nazwa === 'administrator' ? 'Administrator' :
                             role.nazwa === 'duszpasterz' ? 'Duszpasterz' :
                             role.nazwa === 'kancelaria' ? 'Pracownik kancelarii' :
                             role.nazwa === 'animator' ? 'Animator' :
                             role.nazwa === 'rodzic' ? 'Rodzic' :
                             role.nazwa === 'kandydat' ? 'Kandydat' :
                             role.nazwa}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedRoles.length === 0 && (
                      <p className="text-xs text-red-400 mt-1">
                        Wybierz przynajmniej jedną rolę
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Dla grupy
                    </label>
                    <input
                      type="text"
                      value={eventGroup}
                      onChange={(e) => setEventGroup(e.target.value)}
                      placeholder="Pozostaw puste dla wszystkich"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
              
              {/* Dla animatorów z ograniczonymi uprawnieniami: wybór grupy */}
              {isAnimatorRestricted() && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Dla grupy
                  </label>
                  <select
                    value={eventGroup}
                    onChange={(e) => setEventGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Wybierz grupę</option>
                    <option value="Grupa 1">Grupa 1</option>
                    <option value="Grupa 2">Grupa 2</option>
                    <option value="Grupa 3">Grupa 3</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Jako animator możesz dodawać wydarzenia tylko dla swoich grup.
                  </p>
                </div>
              )}
              
              {/* Przyciski formularza */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  disabled={isLoading}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Zapisywanie...' : isEditMode ? 'Zapisz zmiany' : 'Dodaj wydarzenie'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default EventAddModal; 