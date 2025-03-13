import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import { useAuth } from '../contexts/AuthContext';

/**
 * Strona Kandydata
 * 
 * Dostępna tylko dla użytkowników z rolą "kandydat"
 */
const Kandydat: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const navigateToKandydatManagement = () => {
    if (user?.id) {
      navigate(`/kandydat/management/${user.id}`);
    }
  };
  
  return (
    <Dashboard requiredRole="kandydat">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Karta dane osobowe */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Dane osobowe</h2>
          <p className="text-gray-300 mb-4">Sprawdź i uzupełnij swoje dane osobowe niezbędne do sakramentu.</p>
          <button 
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
            onClick={navigateToKandydatManagement}
          >
            Przejdź
          </button>
        </div>
        
        {/* Karta obecności */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Obecności</h2>
          <p className="text-gray-300 mb-4">Sprawdź swoją obecność na spotkaniach i nabożeństwach.</p>
          <button className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
            Przejdź
          </button>
        </div>
        
        {/* Karta materiałów */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Materiały</h2>
          <p className="text-gray-300 mb-4">Dostęp do materiałów formacyjnych i przygotowujących do sakramentu.</p>
          <button className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
            Przejdź
          </button>
        </div>
        
        {/* Karta dokumentów */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Dokumenty</h2>
          <p className="text-gray-300 mb-4">Wymagane dokumenty i formularze do wypełnienia.</p>
          <button className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
            Przejdź
          </button>
        </div>
      </div>
    </Dashboard>
  );
};

export default Kandydat; 