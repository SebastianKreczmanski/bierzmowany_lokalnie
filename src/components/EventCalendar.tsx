import React, { useState, useEffect, useRef } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
  isAfter,
  startOfDay,
  isToday
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { Event, eventsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  HiChevronLeft, 
  HiChevronRight, 
  HiCalendar, 
  HiClock, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiChevronDown, 
  HiChevronUp 
} from 'react-icons/hi';
import EventAddModal from './EventAddModal';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence, useInView } from 'framer-motion';

/**
 * Komponent kalendarza wyświetlający wydarzenia
 * 
 * Zapewnia:
 * - Wyświetlanie kalendarza z aktualnymi wydarzeniami
 * - Możliwość nawigacji pomiędzy miesiącami
 * - Wyświetlanie nadchodzących wydarzeń
 * - Zaznaczanie dni z wydarzeniami kolorowymi kropkami odpowiadającymi typom wydarzeń
 * - Szczegóły wydarzenia po kliknięciu na dzień
 */
const EventCalendar: React.FC = () => {
  // Pobranie informacji o zalogowanym użytkowniku
  const { user, hasRole } = useAuth();
  
  // Stan komponentu
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
  
  // Stała liczba wyświetlanych wydarzeń
  const visibleEventsCount = 4; // Zawsze pokazujemy 4 wydarzenia

  /**
   * Efekt pobierający wydarzenia przy pierwszym renderowaniu i zmianie użytkownika
   */
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        console.log('Brak zalogowanego użytkownika, nie pobieramy wydarzeń');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Pobieranie wydarzeń dla użytkownika:', user.username);
        console.log('Role użytkownika:', user.roles);
        
        // Wybieranie metody API w zależności od roli użytkownika
        let fetchedEvents: Event[] = [];
        
        if (user.roles && user.roles.length > 0) {
          // Pobierz wydarzenia dla administrator/duszpasterz/kancelaria
          if (user.roles.includes('administrator') || 
              user.roles.includes('duszpasterz') || 
              user.roles.includes('kancelaria')) {
            console.log('Pobieranie wszystkich wydarzeń (użytkownik ma uprawnienia administratora)');
            fetchedEvents = await eventsApi.getEvents();
          } else {
            // Dla pozostałych ról pobierz wydarzenia dla pierwszej roli
            const role = user.roles[0];
            console.log(`Pobieranie wydarzeń dla roli: ${role}`);
            try {
              fetchedEvents = await eventsApi.getEventsByRole(role);
            } catch (roleError) {
              console.error(`Błąd podczas pobierania wydarzeń dla roli ${role}:`, roleError);
              // Próbujemy pobrać wszystkie wydarzenia jako fallback
              console.log('Próba pobrania wszystkich wydarzeń jako fallback');
              fetchedEvents = await eventsApi.getEvents();
            }
          }
        } else {
          // W przeciwnym razie pobierz wszystkie wydarzenia
          console.log('Użytkownik nie ma przypisanych ról, pobieranie wszystkich wydarzeń');
          fetchedEvents = await eventsApi.getEvents();
        }

        console.log(`Pobrano ${fetchedEvents.length} wydarzeń`);
        setEvents(fetchedEvents);
      } catch (err: any) {
        console.error('Błąd podczas pobierania wydarzeń:', err);
        
        // Próbujemy załadować "puste dane" jako fallback
        setEvents([]);
        setError('Nie udało się pobrać wydarzeń. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  /**
   * Obsługa kliknięcia przycisku "Dodaj wydarzenie"
   */
  const handleAddEvent = () => {
    setIsAddModalOpen(true);
  };

  /**
   * Obsługa zdarzenia dodania nowego wydarzenia
   * Odświeża listę wydarzeń
   */
  const handleEventAdded = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Odświeżanie listy wydarzeń po dodaniu nowego wydarzenia');
      
      // Pobierz wydarzenia zgodnie z uprawnieniami użytkownika
      if (hasRole('administrator') || hasRole('duszpasterz') || hasRole('kancelaria')) {
        // Administratorzy, duszpasterze i pracownicy kancelarii widzą wszystkie wydarzenia
        const fetchedEvents = await eventsApi.getEvents();
        setEvents(fetchedEvents);
      } else if (user && user.roles && user.roles.length > 0) {
        // Inni użytkownicy widzą wydarzenia przypisane do ich pierwszej roli
        const firstRole = user.roles[0];
        const fetchedEvents = await eventsApi.getEventsByRole(firstRole);
        setEvents(fetchedEvents);
      }
    } catch (error: any) {
      console.error('Błąd podczas odświeżania wydarzeń:', error);
      
      // Dla błędów innych niż 401, pokazujemy komunikat o błędzie
      // Dla 401 nie pokazujemy błędu, bo to oznacza tylko wygaśnięcie sesji, ale wydarzenia są lokalnie zapisane
      if (!error.response || error.response.status !== 401) {
        setError('Wystąpił błąd podczas odświeżania wydarzeń. Spróbuj odświeżyć stronę.');
        toast.error('Nie udało się odświeżyć listy wydarzeń');
      } else {
        // Specjalna obsługa błędu 401 (wygasła sesja)
        console.log('Sesja wygasła podczas odświeżania wydarzeń, używam danych lokalnych');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Przejście do następnego miesiąca
   */
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  /**
   * Przejście do poprzedniego miesiąca
   */
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  /**
   * Przejście do bieżącego miesiąca
   */
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  /**
   * Pobieranie wydarzeń dla danego dnia
   * @param day Data, dla której pobieramy wydarzenia
   * @returns Lista wydarzeń dla danego dnia
   */
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.data_rozpoczecia);
      return isSameDay(day, eventDate);
    });
  };

  /**
   * Pobieranie koloru dla wydarzenia na podstawie jego typu
   * @param event Wydarzenie, dla którego pobieramy kolor
   * @returns Kod koloru w formacie HEX
   */
  const getEventColor = (event: Event) => {
    return event.typ?.kolor || '#ffa629'; // Domyślny kolor
  };

  /**
   * Renderowanie nagłówka kalendarza (miesiąc i przyciski nawigacji)
   * @returns Element JSX z nagłówkiem kalendarza
   */
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-700 text-amber-400 transition-colors"
            aria-label="Poprzedni miesiąc"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-1 text-sm bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
          >
            Dziś
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-700 text-amber-400 transition-colors"
            aria-label="Następny miesiąc"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-xl font-semibold text-amber-400">
          {format(currentDate, 'LLLL yyyy', { locale: pl }).charAt(0).toUpperCase() + 
           format(currentDate, 'LLLL yyyy', { locale: pl }).slice(1)}
        </h3>
      </div>
    );
  };

  /**
   * Renderowanie nagłówków dni tygodnia
   * @returns Element JSX z dniami tygodnia
   */
  const renderDays = () => {
    const days = [];
    const date = startOfWeek(currentDate, { weekStartsOn: 1 }); // Tydzień zaczyna się od poniedziałku

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center text-xs font-medium text-amber-400 py-2" key={i}>
          {format(addDays(date, i), 'EEEE', { locale: pl }).slice(0, 3).toUpperCase()}
        </div>
      );
    }

    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  /**
   * Renderowanie komórki kalendarza (dnia)
   * @param day Data dnia
   * @param monthStart Data pierwszego dnia miesiąca
   * @returns Element JSX komórki kalendarza
   */
  const renderCell = (day: Date, monthStart: Date) => {
    const today = isToday(day);
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
    const dayEvents = getEventsForDay(day);
    const hasEvents = dayEvents.length > 0;
    const inCurrentMonth = isSameMonth(day, monthStart);
    
    return (
      <div
        className={`
          relative min-h-[45px] p-1 cursor-pointer transition-all duration-200 group
          ${!inCurrentMonth ? 'text-gray-600 bg-gray-800/30' : 'text-gray-300'}
          ${isSelected ? 'bg-gray-700 rounded-md shadow-md z-10' : inCurrentMonth ? 'hover:bg-gray-700/50 hover:rounded-md' : ''}
          ${today ? 'ring-1 ring-amber-500 rounded-md' : ''}
        `}
        key={day.toString()}
        onClick={() => setSelectedDate(day)}
      >
        {/* Numer dnia */}
        <div className={`
          text-right text-xs p-0.5 transition-colors
          ${today ? 'font-bold bg-amber-600 text-white w-5 h-5 rounded-full ml-auto flex items-center justify-center' : ''}
          ${!inCurrentMonth ? 'text-gray-500' : 'group-hover:text-amber-300'}
        `}>
          {format(day, 'd')}
        </div>
        
        {/* Kropki reprezentujące wydarzenia */}
        {hasEvents && (
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full shadow-sm transform transition-transform group-hover:scale-110"
                style={{ backgroundColor: getEventColor(event) }}
                title={event.nazwa}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm transform transition-transform group-hover:scale-110" title="Więcej wydarzeń..." />
            )}
          </div>
        )}
        
        {/* Tooltip z wydarzeniami - pokazuje się przy najechaniu myszką tylko na dni z wydarzeniami */}
        {hasEvents && (
          <div className="hidden group-hover:block absolute left-full top-0 z-20 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 ml-2">
            <h4 className="font-semibold text-amber-400 mb-3 border-b border-gray-700 pb-2">
              {format(day, 'd MMMM yyyy', { locale: pl })}
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {dayEvents.map((event, index) => (
                <div 
                  key={index} 
                  className="p-3 rounded-lg bg-gray-750 hover:bg-gray-700 transition-colors"
                  style={{ borderLeft: `4px solid ${getEventColor(event)}` }}
                >
                  <p className="font-medium text-amber-100">{event.nazwa}</p>
                  <p className="text-xs text-amber-100/80 flex items-center mt-2">
                    <HiClock className="mr-1 text-amber-400" />
                    {format(parseISO(event.data_rozpoczecia), 'HH:mm')}
                    {event.data_zakonczenia && 
                      ` - ${format(parseISO(event.data_zakonczenia), 'HH:mm')}`}
                  </p>
                  {event.opis && (
                    <p className="text-xs text-gray-300 mt-2 border-t border-gray-700 pt-2">{event.opis}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renderowanie komórek kalendarza (dni)
   * @returns Element JSX zawierający siatkę dni
   */
  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(renderCell(day, monthStart));
        day = addDays(day, 1);
      }

      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="mb-2 space-y-1">{rows}</div>;
  };

  /**
   * Renderowanie przycisku "Dodaj wydarzenie"
   * @returns Element JSX przycisku
   */
  const renderAddEventButton = () => {
    // Tylko administratorzy, duszpasterze, kancelaria i animatorzy mogą dodawać wydarzenia
    const canAddEvents = user && (
      hasRole('administrator') || 
      hasRole('duszpasterz') || 
      hasRole('kancelaria') || 
      hasRole('animator')
    );

    if (!canAddEvents) return null;

    return (
      <div className="mt-6 mb-8">
        <button
          onClick={handleAddEvent}
          className="w-full flex items-center justify-center py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md transition-all hover:shadow-lg hover:translate-y-[-1px]"
        >
          <HiPlus className="mr-2" />
          Dodaj wydarzenie
        </button>
      </div>
    );
  };

  /**
   * Sprawdza, czy użytkownik ma uprawnienia do edycji/usuwania wydarzeń
   * @returns Wartość logiczna określająca, czy użytkownik ma uprawnienia
   */
  const canManageEvents = (): boolean => {
    return hasRole('administrator') || hasRole('duszpasterz') || hasRole('kancelaria');
  };
  
  /**
   * Przełącza stan rozwinięcia opisu wydarzenia
   * @param eventId ID wydarzenia
   */
  const toggleEventExpansion = (eventId: number) => {
    setExpandedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId) 
        : [...prev, eventId]
    );
  };
  
  /**
   * Obsługuje usunięcie wydarzenia
   * @param event Wydarzenie do usunięcia
   * @param e Event obiekt React
   */
  const handleDeleteEvent = async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Zapobiega rozwinięciu opisu
    
    if (!confirm(`Czy na pewno chcesz usunąć wydarzenie "${event.nazwa}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const success = await eventsApi.deleteEvent(event.id);
      
      if (success) {
        setEvents(prev => prev.filter(e => e.id !== event.id));
        toast.success('Wydarzenie zostało usunięte');
      } else {
        toast.error('Nie udało się usunąć wydarzenia');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania wydarzenia:', error);
      toast.error('Wystąpił błąd podczas usuwania wydarzenia');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Komponent pojedynczego wydarzenia z animacją bazującą na widoczności
   */
  const AnimatedEventItem = ({ 
    event, 
    userCanManageEvents 
  }: { 
    event: Event; 
    userCanManageEvents: boolean;
  }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { 
      once: false, 
      amount: 0.4 // Element jest "w widoku" gdy 40% jest widoczne
    });

    return (
      <motion.div 
        ref={ref}
        key={event.id} 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={isInView 
          ? { opacity: 1, y: 0, scale: 1 } 
          : { opacity: 0, y: 20, scale: 0.95 }
        }
        transition={{ 
          duration: 0.3, 
          ease: "easeOut"
        }}
        className="p-2 rounded-lg bg-gray-750 hover:bg-gray-700 transition-colors overflow-hidden"
        style={{ borderLeft: `4px solid ${getEventColor(event)}` }}
      >
        <div className="flex items-center justify-between">
          <p className="font-medium text-amber-100 text-sm">{event.nazwa}</p>
          <div className="flex items-center space-x-1">
            {/* Data wydarzenia */}
            <span className="text-xs bg-gray-700 text-amber-300 px-2 py-0.5 rounded-full">
              {format(parseISO(event.data_rozpoczecia), 'dd MMM', { locale: pl })}
            </span>
            
            {/* Przycisk rozwijania/zwijania opisu */}
            {event.opis && (
              <button 
                onClick={() => toggleEventExpansion(event.id)}
                className="text-amber-400 hover:text-amber-300 p-1 rounded-full hover:bg-gray-600 transition-colors"
                title={expandedEvents.includes(event.id) ? "Zwiń opis" : "Rozwiń opis"}
              >
                {expandedEvents.includes(event.id) ? (
                  <HiChevronUp size={16} />
                ) : (
                  <HiChevronDown size={16} />
                )}
              </button>
            )}
            
            {/* Przyciski edycji i usuwania (tylko dla uprawnionych) */}
            {userCanManageEvents && (
              <div className="flex space-x-1 ml-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                    setIsAddModalOpen(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 p-1 rounded-full hover:bg-gray-600 transition-colors"
                  title="Edytuj wydarzenie"
                >
                  <HiPencil size={14} />
                </button>
                <button 
                  onClick={(e) => handleDeleteEvent(event, e)}
                  className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors"
                  title="Usuń wydarzenie"
                >
                  <HiTrash size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Rozwijany opis */}
        <AnimatePresence mode="popLayout">
          {expandedEvents.includes(event.id) && event.opis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                height: { 
                  duration: 0.3, 
                  ease: "easeInOut" 
                },
                opacity: { 
                  duration: 0.2, 
                  delay: 0.1 
                }
              }}
              className="mt-2 text-xs text-gray-300 overflow-hidden"
            >
              <div className="py-1">
                {event.opis}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Czas wydarzenia - zawsze widoczny */}
        <div className="mt-1 flex items-center text-xs text-gray-400">
          <HiClock className="mr-1" />
          {format(parseISO(event.data_rozpoczecia), 'HH:mm')}
          {event.data_zakonczenia && ` - ${format(parseISO(event.data_zakonczenia), 'HH:mm')}`}
        </div>
      </motion.div>
    );
  };

  /**
   * Renderowanie sekcji nadchodzących wydarzeń
   * @returns Element JSX z listą nadchodzących wydarzeń
   */
  const renderUpcomingEvents = () => {
    // Filtrujemy i sortujemy wydarzenia, aby pokazać tylko nadchodzące
    const today = startOfDay(new Date());
    const allUpcomingEvents = events
      .filter(event => {
        const eventDate = parseISO(event.data_rozpoczecia);
        return isAfter(eventDate, today) || isSameDay(eventDate, today);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.data_rozpoczecia);
        const dateB = parseISO(b.data_rozpoczecia);
        return dateA.getTime() - dateB.getTime();
      });

    const userCanManageEvents = canManageEvents();

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
          <h3 className="text-lg font-semibold text-amber-400 flex items-center">
            <HiCalendar className="mr-2" />
            Nadchodzące wydarzenia
          </h3>
        </div>
        
        {allUpcomingEvents.length === 0 ? (
          <p className="text-gray-400 text-center py-2">Brak nadchodzących wydarzeń</p>
        ) : (
          <div 
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-gray-800/30 pr-1 rounded-lg transition-all scroll-smooth"
            style={{ 
              height: `${Math.min(allUpcomingEvents.length, visibleEventsCount) * 84}px`, // Wysokość 4 wydarzeń lub mniej
              maxHeight: `${visibleEventsCount * 84}px` 
            }}
          >
            <div className="space-y-2 pb-1">
              {allUpcomingEvents.map((event) => (
                <AnimatedEventItem 
                  key={event.id} 
                  event={event} 
                  userCanManageEvents={userCanManageEvents}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Wskaźnik przewijania - pokazuje się tylko gdy jest więcej niż 4 wydarzenia */}
        {allUpcomingEvents.length > visibleEventsCount && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-2 text-center text-xs text-amber-500/70 flex items-center justify-center"
          >
            <HiChevronUp className="mr-1 animate-bounce" />
            Przewiń, aby zobaczyć więcej
            <HiChevronDown className="ml-1 animate-bounce" />
          </motion.div>
        )}
      </div>
    );
  };

  /**
   * Główny render komponentu
   */
  return (
    <div className="text-gray-300 bg-gray-800/30 rounded-lg shadow-lg p-3">
      {/* Wskaźnik ładowania */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : error ? (
        /* Komunikat o błędzie */
        <div className="text-red-400 py-4 text-center">
          <p>{error}</p>
          <button 
            className="mt-3 px-4 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Odśwież stronę
          </button>
        </div>
      ) : (
        /* Główna zawartość kalendarza */
        <>
          {/* Kalendarz miesięczny z nagłówkiem i dniami */}
          <div className="mb-3">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </div>
          
          {/* Przycisk "Dodaj wydarzenie" */}
          {renderAddEventButton()}
          
          {/* Sekcja nadchodzących wydarzeń */}
          {renderUpcomingEvents()}
        </>
      )}
      
      {/* Modal do dodawania/edycji wydarzeń */}
      {isAddModalOpen && (
        <EventAddModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onEventAdded={handleEventAdded}
          selectedDate={selectedDate || undefined}
          editEvent={selectedEvent}
        />
      )}
    </div>
  );
};

export default EventCalendar; 