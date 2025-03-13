import React, { useState, useEffect } from 'react';
import { grupyApi } from '../services/api';
import toast from 'react-hot-toast';
import GrupaAddModal from './GrupaAddModal';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch } from 'react-icons/fa';

interface GrupyListProps {
  onViewDetails?: (grupaId: number) => void;
}

// Interfejs dla grupy
interface Grupa {
  id: number;
  nazwa: string;
  animator_id: number | null;
  animator_name?: string;
  liczba_czlonkow?: number;
  created_at?: string;
}

const GrupyList: React.FC<GrupyListProps> = ({ onViewDetails }) => {
  // Stan listy grup
  const [grupy, setGrupy] = useState<Grupa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stan filtrowania
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stan modali
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGrupa, setEditingGrupa] = useState<Grupa | null>(null);
  const [deleteConfirmGrupa, setDeleteConfirmGrupa] = useState<Grupa | null>(null);
  
  // Pobieranie listy grup przy montowaniu komponentu
  useEffect(() => {
    fetchGrupy();
  }, []);
  
  // Funkcja pobierająca grupy
  const fetchGrupy = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await grupyApi.getAllGrupy();
      setGrupy(response);
    } catch (error: any) {
      console.error('Błąd podczas pobierania grup:', error);
      setError('Nie udało się pobrać listy grup. Spróbuj ponownie później.');
      toast.error('Nie udało się pobrać listy grup');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrowanie grup po nazwie
  const filteredGrupy = grupy.filter(grupa => 
    grupa.nazwa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (grupa.animator_name && grupa.animator_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Obsługa usuwania grupy
  const handleDeleteGrupa = async (grupaId: number) => {
    try {
      await grupyApi.deleteGrupa(grupaId);
      setGrupy(prev => prev.filter(grupa => grupa.id !== grupaId));
      toast.success('Grupa została usunięta');
      setDeleteConfirmGrupa(null);
    } catch (error: any) {
      console.error('Błąd podczas usuwania grupy:', error);
      toast.error(`Błąd: ${error.message || 'Nie udało się usunąć grupy'}`);
    }
  };
  
  // Obsługa edycji grupy
  const handleEditGrupa = (grupa: Grupa) => {
    // Pobieramy szczegóły grupy przed otwarciem modala
    fetchGrupaDetails(grupa.id);
  };
  
  // Pobieranie szczegółów grupy do edycji
  const fetchGrupaDetails = async (grupaId: number) => {
    try {
      const details = await grupyApi.getGrupaDetails(grupaId);
      setEditingGrupa(details);
      setIsAddModalOpen(true);
    } catch (error: any) {
      console.error('Błąd podczas pobierania szczegółów grupy:', error);
      toast.error('Nie udało się pobrać szczegółów grupy');
    }
  };
  
  // Obsługa dodawania grupy
  const handleAddGrupa = () => {
    setEditingGrupa(null);
    setIsAddModalOpen(true);
  };
  
  // Obsługa zamknięcia modala
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingGrupa(null);
  };
  
  return (
    <div className="space-y-4">
      {/* Nagłówek z akcjami */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Grupy formacyjne</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Wyszukiwarka */}
          <div className="relative">
            <input
              type="text"
              placeholder="Szukaj grupy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <FaSearch className="absolute left-3 top-[11px] text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-[9px] text-gray-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Przycisk dodawania */}
          <button
            onClick={handleAddGrupa}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
          >
            <FaPlus size={14} />
            <span>Dodaj grupę</span>
          </button>
        </div>
      </div>
      
      {/* Komunikat o błędzie */}
      {error && (
        <div className="p-4 bg-red-500 bg-opacity-20 border border-red-600 rounded-md text-white mb-4">
          <p className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </p>
          <button
            onClick={fetchGrupy}
            className="mt-2 text-amber-400 hover:text-amber-300 underline"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}
      
      {/* Indykator ładowania */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <span className="ml-3 text-lg text-gray-300">Ładowanie grup...</span>
        </div>
      ) : filteredGrupy.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-md">
          <p className="text-gray-400 text-lg">
            {searchTerm
              ? 'Nie znaleziono grup pasujących do wyszukiwania'
              : 'Brak grup formacyjnych. Dodaj pierwszą grupę!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nazwa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Animator
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Liczba kandydatów
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data utworzenia
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredGrupy.map((grupa) => (
                <tr key={grupa.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {grupa.nazwa}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {grupa.animator_name || 'Brak animatora'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {grupa.liczba_czlonkow || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {grupa.created_at ? new Date(grupa.created_at).toLocaleDateString('pl-PL') : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {/* Przycisk szczegółów */}
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(grupa.id)}
                          className="text-blue-500 hover:text-blue-400"
                          title="Zobacz szczegóły"
                        >
                          <FaEye size={18} />
                        </button>
                      )}
                      
                      {/* Przycisk edycji */}
                      <button
                        onClick={() => handleEditGrupa(grupa)}
                        className="text-amber-500 hover:text-amber-400"
                        title="Edytuj grupę"
                      >
                        <FaEdit size={18} />
                      </button>
                      
                      {/* Przycisk usuwania */}
                      <button
                        onClick={() => setDeleteConfirmGrupa(grupa)}
                        className="text-red-500 hover:text-red-400"
                        title="Usuń grupę"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal dodawania/edycji grupy */}
      <GrupaAddModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onGrupaAdded={fetchGrupy}
        editGrupa={editingGrupa}
      />
      
      {/* Modal potwierdzenia usunięcia */}
      {deleteConfirmGrupa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Potwierdź usunięcie</h2>
            <p className="text-gray-300 mb-6">
              Czy na pewno chcesz usunąć grupę <span className="font-semibold text-white">{deleteConfirmGrupa.nazwa}</span>?
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmGrupa(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDeleteGrupa(deleteConfirmGrupa.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrupyList; 