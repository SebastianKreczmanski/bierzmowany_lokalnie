import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { kandydatApi } from '../services/api';

interface KandydatGrupaFormProps {
  kandydatId: string;
  initialData: any;
  onSuccess: () => void;
  readOnly?: boolean;
}

interface Grupa {
  id: number;
  nazwa: string;
  animator?: string;
}

const KandydatGrupaForm: React.FC<KandydatGrupaFormProps> = ({
  kandydatId,
  initialData,
  onSuccess,
  readOnly = false
}) => {
  const [selectedGrupaId, setSelectedGrupaId] = useState<string>('');
  const [grupy, setGrupy] = useState<Grupa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGrupy, setLoadingGrupy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pobieranie listy grup
  useEffect(() => {
    const fetchGrupy = async () => {
      setLoadingGrupy(true);
      
      try {
        const response = await kandydatApi.getGrupy();
        if (response.success) {
          setGrupy(response.data);
        } else {
          console.error('Błąd podczas pobierania listy grup:', response.message);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania listy grup:', error);
      } finally {
        setLoadingGrupy(false);
      }
    };
    
    fetchGrupy();
  }, []);
  
  // Inicjalizacja formularza danymi z props
  useEffect(() => {
    if (initialData && initialData.grupa?.id) {
      setSelectedGrupaId(initialData.grupa.id.toString());
    }
  }, [initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrupaId(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGrupaId) {
      setError('Wybór grupy jest wymagany');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await kandydatApi.assignToGrupa(kandydatId, {
        grupa_id: parseInt(selectedGrupaId)
      });
      
      if (response.success) {
        toast.success('Kandydat został przypisany do wybranej grupy');
        onSuccess();
      } else {
        setError(response.message || 'Nie udało się przypisać kandydata do grupy');
      }
    } catch (error) {
      console.error('Błąd podczas przypisywania kandydata do grupy:', error);
      setError('Wystąpił błąd podczas przypisywania kandydata do grupy');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
      {error && (
        <div className="mb-4 p-4 text-red-200 bg-red-900/50 rounded-md border border-red-700" role="alert">
          {error}
        </div>
      )}
      
      {!initialData?.grupa && !readOnly && (
        <div className="mb-4 p-4 text-blue-200 bg-blue-900/30 rounded-md border border-blue-800">
          Kandydat nie jest jeszcze przypisany do grupy. Wybierz grupę, aby przypisać kandydata.
        </div>
      )}
      
      {initialData?.grupa && (
        <div className="mb-4 p-4 bg-gray-750 rounded-md border border-gray-600">
          <h5 className="text-lg font-medium mb-2 text-amber-400">Aktualna grupa</h5>
          <div className="space-y-1 text-gray-200">
            <div><strong className="text-amber-300">Nazwa grupy:</strong> {initialData.grupa.nazwa}</div>
            {initialData.grupa.animator && (
              <div><strong className="text-amber-300">Animator:</strong> {initialData.grupa.animator}</div>
            )}
          </div>
        </div>
      )}
      
      {!readOnly && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="grupa_id" className="block text-sm font-medium text-amber-300 mb-1">Grupa*</label>
            <select
              id="grupa_id"
              name="grupa_id"
              value={selectedGrupaId}
              onChange={handleChange}
              disabled={loadingGrupy}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-white bg-gray-700 border border-gray-600 
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                      sm:text-sm rounded-md"
              required
            >
              <option value="">Wybierz grupę</option>
              {grupy.map(grupa => (
                <option key={grupa.id} value={grupa.id.toString()}>
                  {grupa.nazwa} {grupa.animator ? `(animator: ${grupa.animator})` : ''}
                </option>
              ))}
            </select>
            
            {loadingGrupy && (
              <div className="mt-2 flex items-center text-sm text-gray-400">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Pobieranie listy grup...
              </div>
            )}
            
            <p className="mt-1 text-sm text-gray-400">
              Wybierz grupę, do której ma zostać przypisany kandydat
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || loadingGrupy || !selectedGrupaId}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm 
                      text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 
                      ${(loading || loadingGrupy || !selectedGrupaId) ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Zapisywanie...
                </>
              ) : 'Przypisz do grupy'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default KandydatGrupaForm; 