import React, { useState } from 'react';
import EventsList from './EventsList';
import EventCalendar from './EventCalendar';
import { FaList, FaCalendarAlt } from 'react-icons/fa';

/**
 * Komponent zarządzania wydarzeniami, który łączy widok listy i kalendarza
 */
const EventsManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');

  return (
    <div className="space-y-6">
      {/* Przełącznik widoku */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-700 rounded-lg p-1 flex">
          <button
            onClick={() => setView('list')}
            className={`flex items-center px-4 py-2 rounded ${
              view === 'list'
                ? 'bg-amber-600 text-white'
                : 'bg-transparent text-gray-300 hover:text-white'
            } transition-colors`}
          >
            <FaList className="mr-2" /> Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center px-4 py-2 rounded ${
              view === 'calendar'
                ? 'bg-amber-600 text-white'
                : 'bg-transparent text-gray-300 hover:text-white'
            } transition-colors`}
          >
            <FaCalendarAlt className="mr-2" /> Kalendarz
          </button>
        </div>
      </div>

      {/* Wyświetlanie odpowiedniego widoku */}
      <div>
        {view === 'list' ? (
          <EventsList />
        ) : (
          <div className="bg-gray-800 rounded-lg p-6">
            <EventCalendar />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsManagement; 