import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus, FaUserFriends } from 'react-icons/fa';

interface Grupa {
  id: number;
  nazwa: string;
  animator_id: number | null;
  animator_nazwa: string | null;
  created_at: string;
  liczba_czlonkow: number;
}

interface Animator {
  id: number;
  imie: string;
  nazwisko: string;
}

interface Kandydat {
  id: number;
  imie: string;
  nazwisko: string;
  grupa_id: number | null;
  grupa_nazwa: string | null;
}

interface GrupaDetale {
  id: number;
  nazwa: string;
  animator_id: number | null;
  animator_nazwa: string | null;
  created_at: string;
  czlonkowie: Czlonek[];
}

interface Czlonek {
  id: number;
  imie: string;
  nazwisko: string;
  rola: string;
}

const GrupyFormacyjne: React.FC = () => {
  const [grupy, setGrupy] = useState<Grupa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupa, setEditingGrupa] = useState<Grupa | null>(null);
  const [formData, setFormData] = useState({
    nazwa: '',
    animator_id: null as number | null,
    czlonkowie_ids: [] as number[]
  });
  const [animatorzy, setAnimatorzy] = useState<Animator[]>([]);
  const [kandydaci, setKandydaci] = useState<Kandydat[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [grupaToDelete, setGrupaToDelete] = useState<Grupa | null>(null);
  const [detailsGrupa, setDetailsGrupa] = useState<GrupaDetale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pobierz dane grup
  const fetchGrupy = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3001/api/grupy');
      setGrupy(response.data);
    } catch (err) {
      console.error('Błąd podczas pobierania grup:', err);
      setError('Nie udało się pobrać grup formacyjnych. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pobierz dane animatorów i kandydatów
  const fetchOptions = async () => {
    try {
      setIsLoading(true);
      
      const animatorzyResponse = await axios.get('http://localhost:3001/api/grupy/animatorzy');
      setAnimatorzy(animatorzyResponse.data);
      
      const kandydaciResponse = await axios.get('http://localhost:3001/api/grupy/kandydaci');
      setKandydaci(kandydaciResponse.data);
      
    } catch (err) {
      console.error('Błąd podczas pobierania danych:', err);
      setError('Nie udało się pobrać danych. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pobierz szczegóły grupy
  const fetchGrupaDetails = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:3001/api/grupy/${id}`);
      setDetailsGrupa(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Błąd podczas pobierania szczegółów grupy:', err);
      setError('Nie udało się pobrać szczegółów grupy. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };

  // Inicjalizacja
  useEffect(() => {
    fetchGrupy();
  }, []);

  // Otwórz modal do dodawania nowej grupy
  const handleAddGrupa = () => {
    setFormData({
      nazwa: '',
      animator_id: null,
      czlonkowie_ids: []
    });
    setEditingGrupa(null);
    fetchOptions();
    setIsModalOpen(true);
  };

  // Otwórz modal do edycji grupy
  const handleEditGrupa = async (grupa: Grupa) => {
    try {
      setIsLoading(true);
      await fetchOptions();
      
      // Pobierz szczegóły grupy
      const response = await axios.get(`http://localhost:3001/api/grupy/${grupa.id}`);
      const grupaDetails = response.data;
      
      setFormData({
        nazwa: grupaDetails.nazwa,
        animator_id: grupaDetails.animator_id,
        czlonkowie_ids: grupaDetails.czlonkowie?.map((c: Czlonek) => c.id) || []
      });
      setEditingGrupa(grupa);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Błąd podczas pobierania danych do edycji:', err);
      setError('Nie udało się pobrać danych do edycji. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pokaż szczegóły grupy
  const handleShowDetails = (grupa: Grupa) => {
    fetchGrupaDetails(grupa.id);
  };

  // Otwórz modal potwierdzenia usunięcia
  const handleDeleteClick = (grupa: Grupa) => {
    setGrupaToDelete(grupa);
    setShowDeleteModal(true);
  };

  // Usuń grupę
  const handleDeleteConfirm = async () => {
    if (!grupaToDelete) return;
    
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:3001/api/grupy/${grupaToDelete.id}`);
      setShowDeleteModal(false);
      setGrupaToDelete(null);
      fetchGrupy();
    } catch (err) {
      console.error('Błąd podczas usuwania grupy:', err);
      setError('Nie udało się usunąć grupy. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obsługa zmiany danych formularza
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'animator_id') {
      setFormData({
        ...formData,
        animator_id: value ? Number(value) : null
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Obsługa zmiany wybranych kandydatów
  const handleKandydatChange = (id: number) => {
    setFormData(prev => {
      const isSelected = prev.czlonkowie_ids.includes(id);
      
      if (isSelected) {
        return {
          ...prev,
          czlonkowie_ids: prev.czlonkowie_ids.filter(kandydatId => kandydatId !== id)
        };
      } else {
        return {
          ...prev,
          czlonkowie_ids: [...prev.czlonkowie_ids, id]
        };
      }
    });
  };

  // Zapisz grupę (nową lub edytowaną)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (editingGrupa) {
        // Aktualizacja istniejącej grupy
        await axios.put(`http://localhost:3001/api/grupy/${editingGrupa.id}`, formData);
      } else {
        // Dodawanie nowej grupy
        await axios.post('http://localhost:3001/api/grupy', formData);
      }
      
      setIsModalOpen(false);
      fetchGrupy();
    } catch (err) {
      console.error('Błąd podczas zapisywania grupy:', err);
      setError('Nie udało się zapisać grupy. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatuj datę
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Nagłówek */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-amber-500">Grupy Formacyjne</h1>
        <button
          onClick={handleAddGrupa}
          className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center"
        >
          <FaPlus className="mr-2" /> Dodaj grupę
        </button>
      </div>

      {/* Komunikat błędu */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Wskaźnik ładowania */}
      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      )}

      {/* Lista grup */}
      {!isLoading && !error && (
        <>
          {grupy.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-xl shadow-md text-center">
              <FaUserFriends className="text-amber-400 text-4xl mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-amber-400 mb-4">Brak grup formacyjnych</h2>
              <p className="text-gray-300 mb-4">Nie utworzono jeszcze żadnych grup formacyjnych.</p>
              <button
                onClick={handleAddGrupa}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              >
                Dodaj pierwszą grupę
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-xl overflow-hidden">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Nazwa grupy
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Animator
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Liczba członków
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Data utworzenia
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {grupy.map((grupa) => (
                    <tr key={grupa.id} className="hover:bg-gray-700">
                      <td className="py-4 px-6 text-sm font-medium text-white">
                        {grupa.nazwa}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-300">
                        {grupa.animator_nazwa || <span className="text-gray-500 italic">Brak</span>}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-300">
                        {grupa.liczba_czlonkow}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-300">
                        {formatDate(grupa.created_at)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-300 flex justify-center space-x-3">
                        <button
                          onClick={() => handleShowDetails(grupa)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Szczegóły"
                        >
                          <FaUserFriends size={18} />
                        </button>
                        <button
                          onClick={() => handleEditGrupa(grupa)}
                          className="text-yellow-400 hover:text-yellow-300"
                          title="Edytuj"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(grupa)}
                          className="text-red-400 hover:text-red-300"
                          title="Usuń"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal formularza dodawania/edycji grupy */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-amber-500 mb-4">
              {editingGrupa ? 'Edytuj grupę' : 'Dodaj nową grupę'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Nazwa grupy */}
              <div className="mb-4">
                <label className="block text-amber-400 text-sm font-bold mb-2" htmlFor="nazwa">
                  Nazwa grupy*
                </label>
                <input
                  type="text"
                  id="nazwa"
                  name="nazwa"
                  value={formData.nazwa}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              {/* Animator */}
              <div className="mb-4">
                <label className="block text-amber-400 text-sm font-bold mb-2" htmlFor="animator_id">
                  Animator
                </label>
                <select
                  id="animator_id"
                  name="animator_id"
                  value={formData.animator_id || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Wybierz animatora</option>
                  {animatorzy.map(animator => (
                    <option key={animator.id} value={animator.id}>
                      {animator.imie} {animator.nazwisko}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Kandydaci */}
              <div className="mb-4">
                <label className="block text-amber-400 text-sm font-bold mb-2">
                  Członkowie grupy
                </label>
                {kandydaci.length === 0 ? (
                  <p className="text-gray-400 text-sm">Brak dostępnych kandydatów</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto p-2 border rounded bg-gray-700">
                    {kandydaci.map(kandydat => {
                      const isDisabled = kandydat.grupa_id !== null && 
                                       (!editingGrupa || kandydat.grupa_id !== editingGrupa.id);
                      const isSelected = formData.czlonkowie_ids.includes(kandydat.id);
                      
                      return (
                        <div key={kandydat.id} className="mb-2 last:mb-0">
                          <label className={`flex items-center ${isDisabled ? 'opacity-50' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => !isDisabled && handleKandydatChange(kandydat.id)}
                              disabled={isDisabled}
                              className="mr-2"
                            />
                            <span className="text-white">
                              {kandydat.imie} {kandydat.nazwisko}
                            </span>
                            {kandydat.grupa_nazwa && kandydat.grupa_id !== (editingGrupa?.id || null) && (
                              <span className="ml-2 text-xs text-gray-400">
                                (Przypisany do: {kandydat.grupa_nazwa})
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Przyciski */}
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isLoading}
                >
                  {isLoading ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal szczegółów grupy */}
      {showDetailsModal && detailsGrupa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-amber-500 mb-4">
              Szczegóły grupy: {detailsGrupa.nazwa}
            </h2>
            
            <div className="mb-4">
              <h3 className="text-amber-400 font-bold mb-2">Informacje podstawowe</h3>
              <p className="text-white"><span className="text-gray-400">Data utworzenia:</span> {formatDate(detailsGrupa.created_at)}</p>
              <p className="text-white"><span className="text-gray-400">Animator:</span> {detailsGrupa.animator_nazwa || 'Brak'}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-amber-400 font-bold mb-2">
                Członkowie grupy ({detailsGrupa.czlonkowie?.length || 0})
              </h3>
              
              {!detailsGrupa.czlonkowie || detailsGrupa.czlonkowie.length === 0 ? (
                <p className="text-gray-400">Brak przypisanych członków</p>
              ) : (
                <div className="max-h-60 overflow-y-auto p-2 border rounded bg-gray-700">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                          Imię i nazwisko
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                          Rola
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsGrupa.czlonkowie.map(czlonek => (
                        <tr key={czlonek.id} className="hover:bg-gray-600">
                          <td className="px-2 py-2 text-sm text-white">
                            {czlonek.imie} {czlonek.nazwisko}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-300">
                            {czlonek.rola || 'Brak roli'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia */}
      {showDeleteModal && grupaToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-amber-500 mb-4">
              Potwierdź usunięcie
            </h2>
            
            <p className="text-white mb-4">
              Czy na pewno chcesz usunąć grupę <span className="font-bold">{grupaToDelete.nazwa}</span>?
            </p>
            
            {grupaToDelete.liczba_czlonkow > 0 && (
              <div className="bg-red-900 text-white p-3 rounded mb-4">
                <p>Uwaga! Ta grupa zawiera {grupaToDelete.liczba_czlonkow} członków, którzy zostaną usunięci z grupy.</p>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Anuluj
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={isLoading}
              >
                {isLoading ? 'Usuwanie...' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrupyFormacyjne; 