import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import UsersManagement from '../components/UsersManagement';
import { FaUsers, FaFileAlt, FaUserPlus, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';

/**
 * Strona dla pracowników kancelarii parafialnej
 * 
 * Dostępna tylko dla użytkowników z rolą "kancelaria"
 */
const Kancelaria: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // Render appropriate content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UsersManagement />;
      case 'documents':
        return (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Dokumenty</h2>
            <p className="text-gray-300">Ta funkcja będzie dostępna wkrótce.</p>
          </div>
        );
      case 'registration':
        return (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Rejestracja uczestników</h2>
            <p className="text-gray-300">Ta funkcja będzie dostępna wkrótce.</p>
          </div>
        );
      case 'communication':
        return (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Komunikacja</h2>
            <p className="text-gray-300">Ta funkcja będzie dostępna wkrótce.</p>
          </div>
        );
      case 'schedule':
        return (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Harmonogram</h2>
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
              <p className="text-gray-300 mb-4">Dodawaj, edytuj i usuwaj konta użytkowników.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('users')}
              >
                Przejdź
              </button>
            </div>
            
            {/* Karta zarządzania dokumentami */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaFileAlt className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Dokumenty</h2>
              </div>
              <p className="text-gray-300 mb-4">Zarządzanie dokumentami kandydatów do bierzmowania.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('documents')}
              >
                Przejdź
              </button>
            </div>
            
            {/* Karta rejestracji */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaUserPlus className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Rejestracja uczestników</h2>
              </div>
              <p className="text-gray-300 mb-4">Dodawanie nowych kandydatów i ich rodziców do systemu.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('registration')}
              >
                Przejdź
              </button>
            </div>
            
            {/* Karta wiadomości */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaEnvelope className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Komunikacja</h2>
              </div>
              <p className="text-gray-300 mb-4">Powiadomienia i kontakt z kandydatami oraz ich rodzicami.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('communication')}
              >
                Przejdź
              </button>
            </div>
            
            {/* Karta harmonogramu */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FaCalendarAlt className="text-amber-400 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-amber-400">Harmonogram</h2>
              </div>
              <p className="text-gray-300 mb-4">Planowanie spotkań i zarządzanie terminarzem wydarzeń.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                onClick={() => setActiveSection('schedule')}
              >
                Przejdź
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dashboard requiredRole="kancelaria">
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
            {activeSection === 'documents' && 'Dokumenty'}
            {activeSection === 'registration' && 'Rejestracja uczestników'}
            {activeSection === 'communication' && 'Komunikacja'}
            {activeSection === 'schedule' && 'Harmonogram'}
          </h1>
        </div>
      )}
      
      {renderContent()}
    </Dashboard>
  );
};

export default Kancelaria; 