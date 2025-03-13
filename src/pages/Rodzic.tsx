import React from 'react';
import Dashboard from '../components/Dashboard';

/**
 * Strona dla rodziców kandydatów do bierzmowania
 * 
 * Dostępna tylko dla użytkowników z rolą "rodzic"
 */
const Rodzic: React.FC = () => {
  return (
    <Dashboard requiredRole="rodzic">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Karta z danymi dziecka */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Dane dziecka</h2>
          <p className="text-gray-300 mb-4">Informacje o postępach Twojego dziecka w przygotowaniu do bierzmowania.</p>
          <button className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
            Przejdź
          </button>
        </div>
        
        {/* Karta obecności */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Obecności</h2>
          <p className="text-gray-300 mb-4">Sprawdź obecność Twojego dziecka na spotkaniach i nabożeństwach.</p>
          <button className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
            Przejdź
          </button>
        </div>
        
        {/* Karta komunikacji */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Komunikacja</h2>
          <p className="text-gray-300 mb-4">Kontakt z duszpasterzem i animatorem grupy Twojego dziecka.</p>
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

export default Rodzic; 