import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import UsersManagement from '../components/UsersManagement';
import EventsManagement from '../components/EventsManagement';
import GrupyFormacyjne from '../components/GrupyFormacyjne';
import { FaUsers, FaCalendarAlt, FaBook, FaUserFriends } from 'react-icons/fa';

/**
 * Strona Administratora
 * 
 * Dostępna tylko dla użytkowników z rolą "administrator"
 */
const Admin: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UsersManagement />;
      case 'events':
        return <EventsManagement />;
      case 'groups':
        return <GrupyFormacyjne />;
      case 'materials':
        return (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Materiały</h2>
            <p className="text-gray-300">Ta funkcja będzie dostępna wkrótce.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Ustawienia</h2>
            <p className="text-gray-300">Ta funkcja będzie dostępna wkrótce.</p>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Karta zarządzania użytkownikami */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaUsers className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Zarządzanie Użytkownikami</h2>
              </div>
              <p className="text-gray-300 mb-4">Dodawaj, edytuj i usuwaj konta użytkowników. Przydzielaj role i uprawnienia.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('users')}
              >
                Przejdź
              </button>
            </div>
            
            {/* Karta zarządzania spotkaniami */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaCalendarAlt className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Spotkania</h2>
              </div>
              <p className="text-gray-300 mb-4">Planuj spotkania, zarządzaj obecnościami i powiadomieniami dla uczestników.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('events')}
              >
                Przejdź
              </button>
            </div>
            
            {/* Karta zarządzania grupami formacyjnymi */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaUserFriends className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Grupy formacyjne</h2>
              </div>
              <p className="text-gray-300 mb-4">Zarządzaj grupami formacyjnymi, przypisuj kandydatów i animatorów.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('groups')}
              >
                Przejdź
              </button>
            </div>
            
            {/* Karta materiałów */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaBook className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Materiały</h2>
              </div>
              <p className="text-gray-300 mb-4">Dodawaj i zarządzaj materiałami edukacyjnymi dla kandydatów i animatorów.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('materials')}
              >
                Przejdź
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dashboard requiredRole="administrator">
      {activeSection !== 'dashboard' && (
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="text-amber-400 hover:text-amber-300 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Powrót do panelu
          </button>
          <h1 className="text-2xl font-bold text-amber-500">
            {activeSection === 'users' && 'Zarządzanie Użytkownikami'}
            {activeSection === 'events' && 'Zarządzanie Spotkaniami'}
            {activeSection === 'groups' && 'Grupy formacyjne'}
            {activeSection === 'materials' && 'Materiały'}
            {activeSection === 'settings' && 'Ustawienia'}
          </h1>
        </div>
      )}
      
      {renderContent()}
    </Dashboard>
  );
};

export default Admin; 