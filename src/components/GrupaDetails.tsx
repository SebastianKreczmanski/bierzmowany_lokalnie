import React, { useState, useEffect } from 'react';
import { grupyApi } from '../services/api';
import toast from 'react-hot-toast';
import { FaUserAlt, FaUserFriends, FaCalendarAlt, FaArrowLeft, FaEdit } from 'react-icons/fa';
import GrupaAddModal from './GrupaAddModal';

interface GrupaDetailsProps {
  grupaId: number;
  onBack: () => void;
}

// Interfejs dla pojedynczego członka grupy
interface CzlonekGrupy {
  id: number;
  imie: string;
  nazwisko: string;
  username: string;
}

// Interfejs dla szczegółów grupy
interface GrupaSzczegoly {
  id: number;
  nazwa: string;
  animator_id: number | null;
  animator: CzlonekGrupy | null;
  czlonkowie: CzlonekGrupy[];
  created_at: string;
}

const GrupaDetails: React.FC<GrupaDetailsProps> = ({ grupaId, onBack }) => {
  // Stan szczegółów grupy
  const [grupa, setGrupa] = useState<GrupaSzczegoly | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stan modala edycji
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Pobieranie szczegółów grupy przy montowaniu komponentu
  useEffect(() => {
    fetchGrupaDetails();
  }, [grupaId]);
  
  // Funkcja pobierająca szczegóły grupy
  const fetchGrupaDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await grupyApi.getGrupaDetails(grupaId);
      setGrupa(response);
    } catch (error: any) {
      console.error('Błąd podczas pobierania szczegółów grupy:', error);
      setError('Nie udało się pobrać szczegółów grupy. Spróbuj ponownie później.');
      toast.error('Nie udało się pobrać szczegółów grupy');
    } finally {
      setLoading(false);
    }
  };
  
  // Obsługa otwarcia modala edycji
  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };
  
  // Obsługa zamknięcia modala edycji
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };
  
  // Obsługa zakończenia edycji
  const handleEditComplete = () => {
    fetchGrupaDetails();
  };
  
  // Jeśli trwa ładowanie
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-gray-300">Ładowanie szczegółów grupy...</p>
      </div>
    );
  }
  
  // Jeśli wystąpił błąd
  if (error || !grupa) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg shadow-md">
        <button
          onClick={onBack}
          className="flex items-center text-amber-500 hover:text-amber-400 mb-4"
        >
          <FaArrowLeft className="mr-1" /> Powrót do listy grup
        </button>
        
        <div className="p-4 bg-red-500 bg-opacity-20 border border-red-600 rounded-md text-white mb-4">
          <p className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error || 'Nie udało się załadować szczegółów grupy.'}
          </p>
          <button
            onClick={fetchGrupaDetails}
            className="mt-2 text-amber-400 hover:text-amber-300 underline"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md">
      {/* Nagłówek z przyciskami akcji */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-amber-500 hover:text-amber-400"
        >
          <FaArrowLeft className="mr-1" /> Powrót do listy grup
        </button>
        
        <button
          onClick={handleOpenEditModal}
          className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <FaEdit className="mr-2" /> Edytuj grupę
        </button>
      </div>
      
      {/* Szczegóły grupy */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-4">{grupa.nazwa}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Informacje o animatorze */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3 flex items-center">
              <FaUserAlt className="mr-2 text-amber-500" /> Animator
            </h3>
            {grupa.animator ? (
              <div className="text-gray-300">
                <p className="font-medium text-white">{grupa.animator.imie} {grupa.animator.nazwisko}</p>
                <p className="text-sm">{grupa.animator.username}</p>
              </div>
            ) : (
              <p className="text-gray-400 italic">Brak przypisanego animatora</p>
            )}
          </div>
          
          {/* Informacje o dacie utworzenia */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3 flex items-center">
              <FaCalendarAlt className="mr-2 text-amber-500" /> Data utworzenia
            </h3>
            <p className="text-gray-300">
              {new Date(grupa.created_at).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        {/* Lista członków grupy */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center">
            <FaUserFriends className="mr-2 text-amber-500" /> 
            Członkowie grupy ({grupa.czlonkowie.length})
          </h3>
          
          {grupa.czlonkowie.length === 0 ? (
            <p className="text-gray-400 italic">Brak przypisanych członków</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Imię i nazwisko
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Użytkownik
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {grupa.czlonkowie.map((czlonek) => (
                    <tr key={czlonek.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-white">
                        {czlonek.imie} {czlonek.nazwisko}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                        {czlonek.username}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal edycji grupy */}
      <GrupaAddModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onGrupaAdded={handleEditComplete}
        editGrupa={{
          id: grupa.id,
          nazwa: grupa.nazwa,
          animator_id: grupa.animator_id,
          czlonkowie: grupa.czlonkowie.map(c => c.id)
        }}
      />
    </div>
  );
};

export default GrupaDetails; 