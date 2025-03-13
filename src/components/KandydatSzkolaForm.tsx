import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { kandydatApi } from '../services/api';

interface KandydatSzkolaFormProps {
  kandydatId: string;
  initialData: any;
  onSuccess: () => void;
  readOnly?: boolean;
}

interface Szkola {
  id: number;
  nazwa: string;
  adres?: string;
}

// Interfejs dla danych przekazywanych do API
interface SzkolaData {
  szkola_id: number;
  klasa: string;
  rok_szkolny: string;
}

const KandydatSzkolaForm: React.FC<KandydatSzkolaFormProps> = ({
  kandydatId,
  initialData,
  onSuccess,
  readOnly = false
}) => {
  const [formData, setFormData] = useState({
    szkola_id: '',
    klasa: '',
    rok_szkolny: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingSzkoly, setLoadingSzkoly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [szkoly, setSzkoly] = useState<Szkola[]>([]);
  
  // Pobieranie listy szkół
  useEffect(() => {
    const fetchSzkoly = async () => {
      setLoadingSzkoly(true);
      
      try {
        const response = await kandydatApi.getSzkoly();
        if (response.success) {
          setSzkoly(response.data);
        } else {
          console.error('Błąd podczas pobierania listy szkół:', response.message);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania listy szkół:', error);
      } finally {
        setLoadingSzkoly(false);
      }
    };
    
    fetchSzkoly();
  }, []);
  
  // Inicjalizacja formularza danymi z props
  useEffect(() => {
    if (initialData && initialData.uczen) {
      setFormData({
        szkola_id: initialData.uczen.szkola_id.toString(),
        klasa: initialData.uczen.klasa || '',
        rok_szkolny: initialData.uczen.rok_szkolny || getCurrentSchoolYear()
      });
    } else {
      // Domyślne wartości
      setFormData(prev => ({
        ...prev,
        rok_szkolny: getCurrentSchoolYear()
      }));
    }
  }, [initialData]);
  
  const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Miesiące są indeksowane od 0
    
    // Jeśli jest po sierpniu, to rok szkolny to bieżący/następny
    if (month >= 9) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.szkola_id || !formData.klasa || !formData.rok_szkolny) {
      setError('Wszystkie pola są wymagane');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await kandydatApi.saveSzkola(kandydatId, {
        szkola_id: parseInt(formData.szkola_id),
        klasa: formData.klasa,
        rok_szkolny: formData.rok_szkolny
      } as SzkolaData);
      
      if (response.success) {
        toast.success('Informacje o szkole zostały zapisane');
        onSuccess();
      } else {
        setError(response.message || 'Nie udało się zapisać informacji o szkole');
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania informacji o szkole:', error);
      setError('Wystąpił błąd podczas zapisywania informacji o szkole');
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
      
      {!initialData?.szkola && !readOnly && (
        <div className="mb-4 p-4 text-blue-200 bg-blue-900/30 rounded-md border border-blue-800">
          Kandydat nie ma jeszcze przypisanej szkoły. Wypełnij formularz, aby dodać informacje o szkole.
        </div>
      )}
      
      {initialData?.szkola && (
        <div className="mb-4 p-4 bg-gray-750 rounded-md border border-gray-600">
          <h5 className="text-lg font-medium mb-2 text-amber-400">Aktualna szkoła</h5>
          <div className="space-y-1 text-gray-200">
            <div><strong className="text-amber-300">Nazwa:</strong> {initialData.szkola.nazwa}</div>
            <div><strong className="text-amber-300">Klasa:</strong> {initialData.szkola.klasa}</div>
            <div><strong className="text-amber-300">Rok szkolny:</strong> {initialData.szkola.rok_szkolny}</div>
          </div>
        </div>
      )}
      
      {!readOnly && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="szkola_id" className="block text-sm font-medium text-amber-300 mb-1">Szkoła*</label>
            <select
              id="szkola_id"
              name="szkola_id"
              value={formData.szkola_id}
              onChange={handleChange}
              disabled={loadingSzkoly}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-white bg-gray-700 border border-gray-600 
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                      sm:text-sm rounded-md"
              required
            >
              <option value="">Wybierz szkołę</option>
              {szkoly.map(szkola => (
                <option key={szkola.id} value={szkola.id.toString()}>
                  {szkola.nazwa}
                </option>
              ))}
            </select>
            
            {loadingSzkoly && (
              <div className="mt-2 flex items-center text-sm text-gray-400">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Pobieranie listy szkół...
              </div>
            )}
            
            <p className="mt-1 text-sm text-gray-400">
              Wybierz szkołę, do której uczęszcza kandydat
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="klasa" className="block text-sm font-medium text-amber-300 mb-1">Klasa*</label>
            <input
              type="text"
              id="klasa"
              name="klasa"
              value={formData.klasa}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 py-2 text-white bg-gray-700 border border-gray-600 
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                      sm:text-sm rounded-md"
              placeholder="np. 8A, 2C, III"
              required
            />
            <p className="mt-1 text-sm text-gray-400">
              Podaj oznaczenie klasy (np. 8A, 2C, III)
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="rok_szkolny" className="block text-sm font-medium text-amber-300 mb-1">Rok szkolny*</label>
            <input
              type="text"
              id="rok_szkolny"
              name="rok_szkolny"
              value={formData.rok_szkolny}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 py-2 text-white bg-gray-700 border border-gray-600 
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                      sm:text-sm rounded-md"
              placeholder="np. 2023/2024"
              required
            />
            <p className="mt-1 text-sm text-gray-400">
              Podaj rok szkolny w formacie RRRR/RRRR (np. 2023/2024)
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || loadingSzkoly}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm 
                      text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 
                      ${(loading || loadingSzkoly) ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Zapisywanie...
                </>
              ) : 'Zapisz informacje o szkole'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default KandydatSzkolaForm; 