import React, { useState, useEffect, useMemo } from 'react';
import { eventsApi } from '../services/api';
import { Event } from '../services/api';
import { FaEdit, FaTrash, FaEye, FaCalendarPlus, FaGripLines } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import EventAddModal from './EventAddModal';
import EventDetailsModal from './EventDetailsModal';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

/**
 * Komponent wyświetlający listę wydarzeń z możliwością zarządzania
 */
const EventsList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEventAddModalOpen, setIsEventAddModalOpen] = useState<boolean>(false);
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [roles, setRoles] = useState<{id: number, nazwa: string}[]>([]);
  const [orderedEventTypes, setOrderedEventTypes] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Create a map to store type to ID mappings
  const [typeToIdMap, setTypeToIdMap] = useState<Map<string, string>>(new Map());

  // Generate a consistent ID for each type
  const getTypeId = (type: string): string => {
    if (typeToIdMap.has(type)) {
      return typeToIdMap.get(type)!;
    }
    
    // Generate a simple numeric ID based on the position in the array
    const newId = `type-${typeToIdMap.size + 1}`;
    const updatedMap = new Map(typeToIdMap);
    updatedMap.set(type, newId);
    setTypeToIdMap(updatedMap);
    
    console.log(`Generated new ID for "${type}": "${newId}"`);
    return newId;
  };

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

  // Initialize ordered event types when events are loaded
  useEffect(() => {
    if (events.length > 0) {
      // Extract unique types from events
      const uniqueTypes = new Set<string>();
      events.forEach(event => {
        const typeName = event.typ?.nazwa || 'Nieokreślony typ';
        uniqueTypes.add(typeName);
      });
      
      const uniqueTypesArray = Array.from(uniqueTypes);
      console.log('Unique types from events:', uniqueTypesArray);
      
      // Try to load saved order from localStorage first
      const savedOrder = localStorage.getItem('eventTypesOrder');
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          console.log('Loaded saved event types order:', parsedOrder);
          
          // Make sure saved order only contains types that exist and includes all new types
          const validSavedTypes = parsedOrder.filter((type: string) => uniqueTypes.has(type));
          const missingTypes = uniqueTypesArray.filter(type => !parsedOrder.includes(type));
          
          const updatedOrderedTypes = [...validSavedTypes, ...missingTypes];
          console.log('Updated ordered types (saved + new):', updatedOrderedTypes);
          
          setOrderedEventTypes(updatedOrderedTypes);
        } catch (e) {
          console.error('Error parsing saved event types order', e);
          setOrderedEventTypes(uniqueTypesArray);
        }
      } else {
        // If no saved order, use the unique types from events
        setOrderedEventTypes(uniqueTypesArray);
      }
    }
  }, [events]);

  // Add some CSS to the document that we'll need for dragging effects
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    
    // Add CSS for grabbing cursor during drag
    styleEl.textContent = `
      body.grabbing {
        cursor: grabbing !important;
      }
      body.grabbing * {
        cursor: grabbing !important;
      }
      
      .event-type-pill {
        position: relative;
        overflow: hidden;
      }
      
      .event-type-pill .drag-handle {
        opacity: 0.5;
        transition: opacity 0.2s, background-color 0.2s, transform 0.2s;
      }
      
      .event-type-pill:hover .drag-handle {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .event-type-pill .drag-handle:hover {
        transform: scale(1.1);
        background-color: rgba(255, 255, 255, 0.2);
      }
    `;
    
    // Append to document head
    document.head.appendChild(styleEl);
    
    // Clean up function
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    // Add a class to the body to change cursor for the whole page during drag
    document.body.classList.add('grabbing');
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    // Reset dragging state
    setIsDragging(false);
    document.body.classList.remove('grabbing');
    
    console.log("DragEnd result:", result);
    
    // If no destination or dragged to the same place, do nothing
    if (!result.destination || result.destination.index === result.source.index) {
      console.log("No valid destination or same position, ignoring drag");
      return;
    }
    
    try {
      // Get source and destination indices
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      
      console.log(`Moving from index ${sourceIndex} to ${destinationIndex}`);
      console.log(`Current ordered types:`, orderedEventTypes);
      
      // Create a new array of types (important to create a new array to trigger re-render)
      const newOrderedTypes = Array.from(orderedEventTypes);
      
      // Remove the type from the source position
      const [movedType] = newOrderedTypes.splice(sourceIndex, 1);
      
      // Insert the type at the destination position
      newOrderedTypes.splice(destinationIndex, 0, movedType);
      
      console.log(`New ordered types:`, newOrderedTypes);
      console.log(`Moved type:`, movedType);
      
      // Update the state with the new order
      setOrderedEventTypes(newOrderedTypes);
      
      // Show feedback to the user
      toast.success(`Zmieniono kolejność: ${movedType}`, {
        duration: 1500,
        icon: '🔄'
      });
      
      // Also save the new order to localStorage
      localStorage.setItem('eventTypesOrder', JSON.stringify(newOrderedTypes));
    } catch (error) {
      console.error("Error during drag end processing:", error);
      toast.error("Wystąpił błąd podczas przesuwania elementu. Spróbuj ponownie.");
    }
  };

  // Save event type order to localStorage
  const saveTypeOrder = () => {
    localStorage.setItem('eventTypesOrder', JSON.stringify(orderedEventTypes));
    toast.success('Kolejność typów wydarzeń została zapisana', {
      duration: 2000,
      icon: '💾'
    });
  };
  
  // Reset event type order to default
  const resetTypeOrder = () => {
    localStorage.removeItem('eventTypesOrder');
    // Generate default order from events
    const types = new Set<string>();
    events.forEach(event => {
      const typeName = event.typ?.nazwa || 'Nieokreślony typ';
      types.add(typeName);
    });
    
    setOrderedEventTypes(Array.from(types));
    toast.success('Kolejność typów wydarzeń została zresetowana');
  };

  // Handle selection of event type without interfering with drag
  const handleTypeClick = (type: string, event: React.MouseEvent) => {
    // Only set selected type if we're not dragging
    if (!isDragging) {
      setSelectedEventType(type);
    }
    event.stopPropagation();
  };

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

  // Obsługa dodania nowego wydarzenia
  const handleEventAdded = () => {
    // Odśwież listę wydarzeń
    fetchData();
    toast.success('Lista wydarzeń została zaktualizowana');
  };

  // Handler for event updates, this is also used after adding a new event
  const handleEventUpdated = () => {
    // Refresh the list of events
    fetchData();
    toast.success('Lista wydarzeń została zaktualizowana');
  };

  // Handle closing of event add/edit modal
  const handleCloseEventModal = () => {
    setIsEventAddModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle closing of event details modal
  const handleCloseDetailsModal = () => {
    setIsEventDetailsModalOpen(false);
    setSelectedEvent(null);
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
        case 'brak': return 'Wszyscy';
        default: return role.nazwa.charAt(0).toUpperCase() + role.nazwa.slice(1);
      }
    }
    
    // Fallback dla nieznanych ról
    switch(roleId) {
      case 1: return 'Administrator';
      case 2: return 'Duszpasterz';
      case 3: return 'Pracownik kancelarii';
      case 4: return 'Animator';
      case 5: return 'Rodzic';
      case 6: return 'Kandydat';
      case 7: return 'Świadek';
      default: return 'Wszyscy';
    }
  };

  // Check if all roles are selected to display "Wszyscy" instead of individual roles
  const hasAllRoles = (roleIds: string): boolean => {
    if (!roleIds) return false;
    
    // If "wszystkie" is explicitly included
    if (roleIds.includes('wszystkie')) return true;
    
    // Check if all roles (1-6) are present
    const roleIdArray = roleIds.split(',').map(id => id.trim());
    const allRoleIds = ['1', '2', '3', '4', '5', '6'];
    return allRoleIds.every(roleId => roleIdArray.includes(roleId));
  };

  // Funkcja formatująca nazwę grupy
  const formatGroupName = (groupName: string): string => {
    if (!groupName || groupName.trim() === '') return '';
    
    // Usuń prefiks "Grupa: " jeśli istnieje
    let formatted = groupName.replace(/^Grupa:\s*/i, '');
    
    // Normalizuj specjalne przypadki
    switch(formatted.toLowerCase()) {
      case 'wszyscy':
      case 'wszystkie':
      case 'all':
        return 'Wszyscy';
      default:
        // Kapitalizacja pierwszej litery
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  };

  // Get role badge color based on role
  const getRoleBadgeColor = (roleId: number): string => {
    // Return different background colors for different roles
    switch(roleId) {
      case 1: return 'bg-purple-900 text-purple-200'; // Administrator
      case 2: return 'bg-blue-900 text-blue-200';     // Duszpasterz
      case 3: return 'bg-indigo-900 text-indigo-200'; // Kancelaria
      case 4: return 'bg-cyan-900 text-cyan-200';     // Animator
      case 5: return 'bg-teal-900 text-teal-200';     // Rodzic
      case 6: return 'bg-amber-900 text-amber-200';   // Kandydat
      case 7: return 'bg-pink-900 text-pink-200';     // Świadek
      default: return 'bg-gray-900 text-gray-200';    // Wszystkie inne role
    }
  };

  // Get group badge color
  const getGroupBadgeColor = (groupName: string): string => {
    // Możemy przypisać określone kolory do konkretnych nazw grup
    const lowerName = groupName.toLowerCase();
    
    if (lowerName.includes('wszyscy')) {
      return 'bg-emerald-900 text-emerald-200';
    } else if (lowerName.includes('grupa')) {
      return 'bg-green-900 text-green-200';
    } else if (lowerName.includes('klasa')) {
      return 'bg-blue-900 text-blue-200';
    }
    
    // Dla innych przypadków, domyślne kolory
    return 'bg-emerald-900 text-emerald-200';
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
  const eventTypes = orderedEventTypes.length > 0 
    ? orderedEventTypes 
    : Object.keys(eventsByType);
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

      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-gray-300">Przeciągnij i upuść typy wydarzeń, aby zmienić ich kolejność wyświetlania:</p>
            <p className="text-xs text-gray-400 mt-1">
              <span className="bg-gray-700 px-2 py-0.5 rounded">Wskazówka:</span> Po zmianie kolejności kliknij "Zapisz kolejność", aby zapamiętać ustawienia.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetTypeOrder}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
            >
              Resetuj
            </button>
            <button
              onClick={saveTypeOrder}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
            >
              Zapisz kolejność
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {/* "Wszystkie typy" button outside of drag context */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEventType(null); }}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedEventType === null
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Wszystkie typy
          </button>
          
          {/* Draggable event types */}
          <DragDropContext 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Droppable droppableId="event-types-droppable" direction="horizontal">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-wrap gap-2"
                >
                  {eventTypes.map((type, index) => (
                    <Draggable 
                      key={`draggable-${index}`} 
                      draggableId={`draggable-${index}`} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            event-type-pill relative px-3 py-1 rounded-full text-sm flex items-center shadow-md
                            ${selectedEventType === type ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                            ${snapshot.isDragging ? 'ring-2 ring-white ring-opacity-70 scale-105 z-10' : ''}
                          `}
                          style={{
                            backgroundColor: selectedEventType === type 
                              ? '' 
                              : (eventsByType[type] && eventsByType[type][0]?.typ?.kolor || '#4B5563'),
                            borderLeft: '3px solid rgba(255,255,255,0.3)',
                            transform: snapshot.isDragging ? 'rotate(-2deg)' : 'rotate(0)',
                            transition: 'transform 0.2s, background-color 0.2s',
                            ...provided.draggableProps.style
                          }}
                          onClick={(e) => handleTypeClick(type, e)}
                        >
                          <span className="mr-6">{type}</span>
                          <div 
                            className="drag-handle absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab hover:bg-gray-600 hover:bg-opacity-30 rounded-r-full"
                            {...provided.dragHandleProps}
                          >
                            <FaGripLines size={14} className="text-gray-300" />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Lista wydarzeń pogrupowanych według typów */}
      <div className="space-y-8">
        {filteredEventTypes.map((type) => (
          <div
            key={type}
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden"
          >
            <div className="bg-gray-700 px-4 py-3 flex items-center">
              <span
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: eventsByType[type] && eventsByType[type][0]?.typ?.kolor || '#4B5563' }}
              ></span>
              <h3 className="text-lg font-medium text-amber-400">{type}</h3>
              <span className="ml-2 text-sm text-gray-300">
                ({eventsByType[type]?.length || 0} {eventsByType[type]?.length === 1 
                  ? 'wydarzenie' 
                  : eventsByType[type]?.length < 5 
                    ? 'wydarzenia' 
                    : 'wydarzeń'})
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
                  {eventsByType[type]?.map(event => (
                    <tr key={event.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {event.nazwa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatEventDate(event.data_rozpoczecia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {hasAllRoles(event.dlaroli) ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900 text-emerald-200">
                              Wszyscy
                            </span>
                          ) : (
                            event.dlaroli && event.dlaroli.split(',').map((roleId, index) => {
                              const roleIdNum = parseInt(roleId.trim());
                              if (isNaN(roleIdNum)) return null;
                              
                              return (
                                <span
                                  key={`${event.id}-role-${roleIdNum}-${index}`}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(roleIdNum)}`}
                                >
                                  {getRoleName(roleIdNum)}
                                </span>
                              );
                            })
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
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsEventDetailsModalOpen(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Zobacz szczegóły"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsEventAddModalOpen(true);
                            }}
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
          onClose={handleCloseEventModal}
          onEventAdded={handleEventUpdated}
          editEvent={selectedEvent}
        />
      )}

      {/* Modal szczegółów wydarzenia */}
      {isEventDetailsModalOpen && (
        <EventDetailsModal 
          isOpen={isEventDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default EventsList; 