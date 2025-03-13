import React, { useState, useEffect } from 'react';
import { eventsApi } from '../services/api';
import { Event } from '../services/api';
import { FaEdit, FaTrash, FaEye, FaCalendarPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import EventAddModal from './EventAddModal';

/**
 * Komponent wyświetlający listę wydarzeń z możliwością zarządzania
 */
const EventsList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEventAddModalOpen, setIsEventAddModalOpen] = useState<boolean>(false);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [roles, setRoles] = useState<{id: number, nazwa: string}[]>([]);

  // Pobieranie wydarzeń i ról
  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsData, rolesData] = await Promise.all([
        eventsApi.getEvents(),
        eventsApi.getRoles()
      ]);
      
      setEvents(eventsData);
      setRoles(rolesData);
      setError(null);
      
      console.log('Pobrane wydarzenia:', eventsData);
      console.log('Pobrane role:', rolesData);
    } catch (err) {
      console.error('Błąd podczas pobierania danych:', err);
      setError('Nie udało się pobrać danych');
      toast.error('Nie udało się pobrać danych');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Obsługa usuwania wydarzenia
  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
      try {
        const success = await eventsApi.deleteEvent(eventId);
        if (success) {
          setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
          toast.success('Wydarzenie zostało usunięte');
        } else {
          toast.error('Nie udało się usunąć wydarzenia');
        }
      } catch (err) {
        console.error('Błąd podczas usuwania wydarzenia:', err);
        toast.error('Nie udało się usunąć wydarzenia');
      }
    }
  };

  // Obsługa dodawania wydarzenia
  const handleAddEvent = () => {
    setIsEventAddModalOpen(true);
  };

  // Obsługa sukcesu dodania wydarzenia
  const handleEventAdded = () => {
    fetchData();
    setIsEventAddModalOpen(false);
  };

  // Grupowanie wydarzeń według typu
  const getEventsByType = () => {
    const typeGroups: { [key: string]: Event[] } = {};
    
    events.forEach(event => {
      const typeName = event.typ?.nazwa || 'Nieokreślony typ';
      if (!typeGroups[typeName]) {
        typeGroups[typeName] = [];
      }
      typeGroups[typeName].push(event);
    });
    
    return typeGroups;
  };

  // Formatowanie daty wydarzenia
  const formatEventDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, dd MMMM yyyy, HH:mm', { locale: pl });
    } catch (err) {
      console.error('Błąd formatowania daty:', err);
      return dateString;
    }
  };

  // Funkcja pomocnicza do konwersji ID roli na nazwę
  const getRoleName = (roleId: number): string => {
    const role = roles.find(r => r.id === roleId);
    
    if (role) {
      // Mapowanie nazw ról na polskie odpowiedniki dla wyświetlania
      switch(role.nazwa) {
        case 'administrator': return 'Administrator';
        case 'duszpasterz': return 'Duszpasterz';
        case 'kancelaria': return 'Pracownik kancelarii';
        case 'animator': return 'Animator';
        case 'rodzic': return 'Rodzic';
        case 'kandydat': return 'Kandydat';
        case 'swiadek': return 'Świadek';
        default: return role.nazwa;
      }
    }
    
    return `Rola ${roleId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Błąd!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const eventsByType = getEventsByType();
  const eventTypes = Object.keys(eventsByType);
  const filteredEventTypes = selectedEventType ? [selectedEventType] : eventTypes;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-amber-500">Zarządzanie Wydarzeniami</h2>
        <button
          onClick={handleAddEvent}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
        >
          <FaCalendarPlus /> Dodaj wydarzenie
        </button>
      </div>

      {/* Filtrowanie według typu wydarzenia */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedEventType(null)}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedEventType === null
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Wszystkie typy
        </button>
        {eventTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedEventType(type)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedEventType === type
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              backgroundColor: selectedEventType === type 
                ? '' 
                : (eventsByType[type][0].typ?.kolor || '#4B5563')
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Lista wydarzeń pogrupowanych według typów */}
      <div className="space-y-8">
        {filteredEventTypes.map(type => (
          <div
            key={type}
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden"
          >
            <div className="bg-gray-700 px-4 py-3 flex items-center">
              <span
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: eventsByType[type][0].typ?.kolor || '#4B5563' }}
              ></span>
              <h3 className="text-lg font-medium text-amber-400">{type}</h3>
              <span className="ml-2 text-sm text-gray-300">
                ({eventsByType[type].length} {eventsByType[type].length === 1 ? 'wydarzenie' : eventsByType[type].length < 5 ? 'wydarzenia' : 'wydarzeń'})
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nazwa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Dla kogo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Obowiązkowe
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {eventsByType[type].map(event => (
                    <tr key={event.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {event.nazwa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatEventDate(event.data_rozpoczecia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {event.dlaroli && event.dlaroli.split(',').map(roleId => {
                            const roleIdNum = parseInt(roleId.trim());
                            if (isNaN(roleIdNum)) return null;
                            
                            return (
                              <span
                                key={roleId}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200"
                              >
                                {getRoleName(roleIdNum)}
                              </span>
                            );
                          })}
                          {event.dlagrupy && event.dlagrupy.trim() !== '' && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200"
                            >
                              Grupa: {event.dlagrupy}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {event.obowiazkowe ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-200">
                            Tak
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                            Nie
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => window.alert('Szczegóły wydarzenia będą dostępne wkrótce')}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Zobacz szczegóły"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => window.alert('Edycja wydarzenia będzie dostępna wkrótce')}
                            className="text-amber-400 hover:text-amber-300 transition-colors"
                            title="Edytuj"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Usuń"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal dodawania wydarzenia */}
      {isEventAddModalOpen && (
        <EventAddModal 
          isOpen={isEventAddModalOpen} 
          onClose={() => setIsEventAddModalOpen(false)}
          onEventAdded={handleEventAdded}
        />
      )}
    </div>
  );
};

export default EventsList; 