import React, { useState, useEffect } from 'react';
import { eventsApi } from '../services/api';
import { Event, EventType } from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaTag, FaUserFriends, FaUsers } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import EventAddModal from './EventAddModal';

/**
 * Komponent zarządzania wydarzeniami w panelu administratora
 */
const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterType, setFilterType] = useState<number | null>(null);

  // Pobieranie wydarzeń i typów wydarzeń
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsData, typesData] = await Promise.all([
          eventsApi.getEvents(),
          eventsApi.getEventTypes()
        ]);
        
        setEvents(eventsData);
        setEventTypes(typesData);
        setError(null);
      } catch (err) {
        console.error('Błąd podczas pobierania danych wydarzeń:', err);
        setError('Nie udało się pobrać danych wydarzeń');
        toast.error('Nie udało się pobrać danych wydarzeń');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Obsługa dodania/edycji wydarzenia
  const handleEventAdded = () => {
    setShowAddModal(false);
    setSelectedEvent(null);
    
    // Odświeżanie listy wydarzeń
    const refreshEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await eventsApi.getEvents();
        setEvents(eventsData);
      } catch (err) {
        console.error('Błąd podczas odświeżania listy wydarzeń:', err);
        toast.error('Nie udało się odświeżyć listy wydarzeń');
      } finally {
        setLoading(false);
      }
    };
    
    refreshEvents();
  };

  // Obsługa usuwania wydarzenia
  const handleDeleteEvent = async (event: Event) => {
    if (window.confirm(`Czy na pewno chcesz usunąć wydarzenie "${event.nazwa}"?`)) {
      try {
        setLoading(true);
        const success = await eventsApi.deleteEvent(event.id);
        
        if (success) {
          setEvents(prev => prev.filter(e => e.id !== event.id));
          toast.success('Wydarzenie zostało usunięte');
        } else {
          toast.error('Nie udało się usunąć wydarzenia');
        }
      } catch (err) {
        console.error('Błąd podczas usuwania wydarzenia:', err);
        toast.error('Wystąpił błąd podczas usuwania wydarzenia');
      } finally {
        setLoading(false);
      }
    }
  };

  // Obsługa edycji wydarzenia
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowAddModal(true);
  };

  // Filtrowanie wydarzeń według typu
  const getFilteredEvents = () => {
    if (filterType === null) {
      return events;
    }
    return events.filter(event => event.typ_id === filterType);
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Tłumaczenie ról z bazy danych
  const translateRoles = (rolesString: string) => {
    if (!rolesString) return 'Wszyscy';
    
    const roleIds = rolesString.split(',').map(id => parseInt(id.trim()));
    const roleNames: string[] = [];
    
    roleIds.forEach(id => {
      switch (id) {
        case 1:
          roleNames.push('Administrator');
          break;
        case 2:
          roleNames.push('Duszpasterz');
          break;
        case 3:
          roleNames.push('Kancelaria');
          break;
        case 4:
          roleNames.push('Animator');
          break;
        case 5:
          roleNames.push('Rodzic');
          break;
        case 6:
          roleNames.push('Kandydat');
          break;
        default:
          roleNames.push(`Rola #${id}`);
      }
    });
    
    return roleNames.join(', ');
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Błąd!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-amber-500">Zarządzanie Wydarzeniami</h2>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
        >
          <FaPlus /> Dodaj wydarzenie
        </button>
      </div>

      {/* Filtrowanie według typu */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterType(null)}
          className={`px-3 py-1 rounded-full text-sm ${
            filterType === null
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Wszystkie typy
        </button>
        {eventTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`px-3 py-1 rounded-full text-sm flex items-center ${
              filterType === type.id
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={filterType === type.id ? {} : { borderLeft: `4px solid ${type.kolor}` }}
          >
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: type.kolor }}
            ></span>
            {type.nazwa}
          </button>
        ))}
      </div>

      {/* Lista wydarzeń */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-700 px-4 py-3">
          <h3 className="text-lg font-medium text-amber-400">Lista wydarzeń</h3>
          <p className="text-sm text-gray-300">Liczba wydarzeń: {filteredEvents.length}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nazwa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Typ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data rozpoczęcia
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
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                    Brak wydarzeń do wyświetlenia
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredEvents.map(event => (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-2" />
                          <span className="font-medium">{event.nazwa}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">
                          <FaTag className="text-gray-400 mr-2" />
                          <span 
                            className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: event.typ?.kolor || '#808080',
                              color: '#fff',
                              textShadow: '0 0 2px rgba(0,0,0,0.7)'
                            }}
                          >
                            {event.typ?.nazwa || 'Nieznany typ'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(event.data_rozpoczecia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">
                          {event.dlagrupy ? (
                            <FaUserFriends className="text-gray-400 mr-2" />
                          ) : (
                            <FaUsers className="text-gray-400 mr-2" />
                          )}
                          <span>
                            {event.dlagrupy 
                              ? `Grupa: ${event.dlagrupy}` 
                              : `Role: ${translateRoles(event.dlaroli)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.obowiazkowe 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {event.obowiazkowe ? 'Tak' : 'Nie'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="text-amber-400 hover:text-amber-300 transition-colors"
                            title="Edytuj"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Usuń"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal dodawania/edycji wydarzenia */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <EventAddModal
              isOpen={showAddModal}
              editEvent={selectedEvent}
              onClose={() => {
                setShowAddModal(false);
                setSelectedEvent(null);
              }}
              onEventAdded={handleEventAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement; 