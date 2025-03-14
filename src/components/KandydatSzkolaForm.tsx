import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { kandydatApi } from '../services/api';
import { FaPlus } from 'react-icons/fa';

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
  
  // Track original data to detect changes
  const [originalData, setOriginalData] = useState({
    szkola_id: '',
    klasa: '',
    rok_szkolny: ''
  });
  
  // Track if form has been modified
  const [isModified, setIsModified] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingSzkoly, setLoadingSzkoly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [szkoly, setSzkoly] = useState<Szkola[]>([]);
  
  // State for adding a new school
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [addingSchool, setAddingSchool] = useState(false);
  
  // Track if data was just saved to update display before parent refresh
  const [localSavedData, setLocalSavedData] = useState<any>(null);
  
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
    console.log('Initializing school form with data:', initialData);
    console.log('Full initialData structure:', JSON.stringify(initialData, null, 2));
    
    // Clear local saved data when parent sends new data
    setLocalSavedData(null);
    
    const kandydatData = initialData?.data || initialData;
    
    if (kandydatData && kandydatData.szkola) {
      console.log('Found school data in kandydatData.szkola:', kandydatData.szkola);
      const initialFormData = {
        szkola_id: kandydatData.szkola.szkola_id.toString(),
        klasa: kandydatData.szkola.klasa || '',
        rok_szkolny: kandydatData.szkola.rok_szkolny || getCurrentSchoolYear()
      };
      
      setFormData(initialFormData);
      setOriginalData(initialFormData);
      setIsModified(false);
      
      console.log('Initialized form with school data:', initialFormData);
    } else {
      console.log('No school data found in kandydatData, using defaults');
      const defaultData = {
        szkola_id: '',
        klasa: '',
        rok_szkolny: getCurrentSchoolYear()
      };
      
      setFormData(defaultData);
      setOriginalData(defaultData);
      setIsModified(false);
    }
  }, [initialData]);
  
  // Check if form data is different from original data
  useEffect(() => {
    const hasChanges = 
      formData.szkola_id !== originalData.szkola_id ||
      formData.klasa !== originalData.klasa ||
      formData.rok_szkolny !== originalData.rok_szkolny;
    
    setIsModified(hasChanges);
    console.log('Form modified:', hasChanges);
  }, [formData, originalData]);
  
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
  
  // Handle adding a new school
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSchoolName.trim()) {
      setError('Podaj nazwę szkoły');
      return;
    }
    
    setAddingSchool(true);
    setError(null);
    
    try {
      const response = await kandydatApi.createSzkola(newSchoolName.trim());
      
      if (response.success) {
        toast.success(`Dodano nową szkołę: ${response.data.nazwa}`);
        
        // Add to schools list and select it
        setSzkoly(prev => [...prev, response.data]);
        setFormData(prev => ({ ...prev, szkola_id: response.data.id.toString() }));
        
        // Reset form
        setNewSchoolName('');
        setShowAddSchoolForm(false);
      } else {
        throw new Error(response.message || 'Nie udało się dodać nowej szkoły');
      }
    } catch (error: any) {
      console.error('Błąd podczas dodawania szkoły:', error);
      setError('Nie udało się dodać nowej szkoły: ' + (error.message || ''));
    } finally {
      setAddingSchool(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    // Since we're using a button with type="button" now, we don't need e.preventDefault()
    // but we'll keep it for safety in case this gets changed again
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    console.log('Submit button clicked, validating form data...');
    
    if (!formData.szkola_id || !formData.klasa || !formData.rok_szkolny) {
      console.log('Validation failed:', {
        szkola_id: !!formData.szkola_id, 
        klasa: !!formData.klasa, 
        rok_szkolny: !!formData.rok_szkolny
      });
      setError('Wszystkie pola są wymagane');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting school data:', {
        kandydatId,
        formData,
        szkolaData: {
          szkola_id: parseInt(formData.szkola_id),
          klasa: formData.klasa,
          rok_szkolny: formData.rok_szkolny
        }
      });
      
      const szkolaData: SzkolaData = {
        szkola_id: parseInt(formData.szkola_id),
        klasa: formData.klasa,
        rok_szkolny: formData.rok_szkolny
      };
      
      console.log('Calling API with data:', szkolaData);
      
      const response = await kandydatApi.saveSzkola(kandydatId, szkolaData);
      
      console.log('API response:', response);
      
      if (response.success) {
        toast.success('Informacje o szkole zostały zapisane');
        
        // Update original data to match current data
        setOriginalData({...formData});
        setIsModified(false);
        
        // Get the school name for the locally saved data
        const schoolName = getSchoolName(formData.szkola_id);
        
        // Create a local copy of the saved data to update UI immediately
        setLocalSavedData({
          szkola_id: parseInt(formData.szkola_id),
          szkola_nazwa: schoolName,
          nazwa: schoolName,
          klasa: formData.klasa,
          rok_szkolny: formData.rok_szkolny
        });
        
        // Call onSuccess immediately to trigger parent component refresh
        if (typeof onSuccess === 'function') {
          console.log('Calling onSuccess callback immediately');
          onSuccess();
        }
      } else {
        console.error('Error response from API:', response.message);
        setError(response.message || 'Nie udało się zapisać informacji o szkole');
      }
    } catch (error) {
      console.error('Exception during form submission:', error);
      setError('Wystąpił błąd podczas zapisywania informacji o szkole');
    } finally {
      setLoading(false);
    }
  };
  
  // Get school name by ID
  const getSchoolName = (schoolId: string) => {
    if (!schoolId) return '';
    const school = szkoly.find(s => s.id.toString() === schoolId);
    return school ? school.nazwa : '';
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
      {error && (
        <div className="mb-4 p-4 text-red-200 bg-red-900/50 rounded-md border border-red-700" role="alert">
          {error}
        </div>
      )}
      
      {(() => {
        // Use local saved data if available, otherwise use parent data
        const kandydatData = initialData?.data || initialData;
        const displayData = localSavedData ? { szkola: localSavedData } : kandydatData;
        
        return (
          <>
            {!displayData?.szkola && !readOnly && (
              <div className="mb-4 p-4 text-blue-200 bg-blue-900/30 rounded-md border border-blue-800">
                Kandydat nie ma jeszcze przypisanej szkoły. Wypełnij formularz, aby dodać informacje o szkole.
              </div>
            )}
            
            {displayData?.szkola && (
              <div className="mb-4 p-4 bg-gray-750 rounded-md border border-gray-600">
                <h5 className="text-lg font-medium mb-2 text-amber-400">Aktualna szkoła</h5>
                <div className="space-y-1 text-gray-200">
                  <div><strong className="text-amber-300">Nazwa:</strong> {displayData.szkola.nazwa || displayData.szkola.szkola_nazwa}</div>
                  <div><strong className="text-amber-300">Klasa:</strong> {displayData.szkola.klasa}</div>
                  <div><strong className="text-amber-300">Rok szkolny:</strong> {displayData.szkola.rok_szkolny}</div>
                </div>
              </div>
            )}
          </>
        );
      })()}
      
      {!readOnly && (
        <div className="space-y-4">
          <div className="mb-4">
            <label htmlFor="szkola_id" className="block text-sm font-medium text-amber-300 mb-1">Szkoła*</label>
            <div className="space-y-2">
              {loadingSzkoly ? (
                <div className="flex items-center bg-gray-700 rounded-md border border-gray-600 px-3 py-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-400">Pobieranie listy szkół...</span>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <select
                    id="szkola_id"
                    name="szkola_id"
                    value={formData.szkola_id}
                    onChange={handleChange}
                    className="flex-grow mt-1 block w-full pl-3 pr-10 py-2 text-white bg-gray-700 border border-gray-600 
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
                  <button
                    type="button"
                    onClick={() => setShowAddSchoolForm(!showAddSchoolForm)}
                    className="flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
                  >
                    <FaPlus className="mr-1" /> {showAddSchoolForm ? 'Anuluj' : 'Dodaj nową'}
                  </button>
                </div>
              )}
              
              {/* Form for adding a new school */}
              {showAddSchoolForm && (
                <div className="mt-2 p-3 bg-gray-700 border border-gray-600 rounded-md">
                  <h4 className="text-sm font-medium text-amber-400 mb-2">Dodaj nową szkołę</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      placeholder="Nazwa szkoły"
                      className="flex-grow px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSchool}
                      disabled={addingSchool}
                      className="flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors disabled:bg-amber-800 disabled:opacity-70"
                    >
                      {addingSchool ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Dodawanie...
                        </>
                      ) : (
                        <>Dodaj</>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              <p className="mt-1 text-sm text-gray-400">
                Wybierz szkołę, do której uczęszcza kandydat
              </p>
            </div>
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
          
          {formData.szkola_id && formData.klasa && (
            <div className="mt-4 p-3 bg-gray-700 border border-gray-600 rounded-md">
              <h4 className="text-sm font-medium text-amber-400 mb-1">Podgląd informacji o szkole:</h4>
              <p className="text-white">
                {getSchoolName(formData.szkola_id)}, klasa {formData.klasa}, rok szkolny {formData.rok_szkolny}
              </p>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || loadingSzkoly}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm 
                      text-sm font-medium text-white 
                      ${isModified ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} 
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
              ) : isModified ? 
                'Zapisz zmiany w szkole' : 
                'Zapisz informacje o szkole'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KandydatSzkolaForm; 