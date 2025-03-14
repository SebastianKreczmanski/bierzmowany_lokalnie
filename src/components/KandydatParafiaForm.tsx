import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { kandydatApi } from '../services/api';
import { usersApi } from '../services/api';

interface KandydatParafiaFormProps {
  kandydatId: string;
  initialData: any;
  onSuccess: () => void;
  readOnly?: boolean;
}

interface Parafia {
  id: number;
  wezwanie: string;
  miejscowosc: string;
}

const KandydatParafiaForm: React.FC<KandydatParafiaFormProps> = ({
  kandydatId,
  initialData,
  onSuccess,
  readOnly = false
}) => {
  const [formData, setFormData] = useState({
    parafia_id: ''
  });
  
  // Track original data to detect changes
  const [originalData, setOriginalData] = useState({
    parafia_id: ''
  });
  
  // Track if form has been modified
  const [isModified, setIsModified] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingParafie, setLoadingParafie] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parafie, setParafie] = useState<Parafia[]>([]);
  
  // Track local saved data for immediate display
  const [localSavedData, setLocalSavedData] = useState<any>(null);
  
  // Pobieranie listy parafii
  useEffect(() => {
    const fetchParafie = async () => {
      setLoadingParafie(true);
      
      try {
        const response = await kandydatApi.getParafie();
        if (response.success) {
          setParafie(response.data);
        } else {
          console.error('Błąd podczas pobierania listy parafii:', response.message);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania listy parafii:', error);
      } finally {
        setLoadingParafie(false);
      }
    };
    
    fetchParafie();
  }, []);
  
  // Inicjalizacja formularza danymi z props
  useEffect(() => {
    // Clear local saved data when receiving new data from parent
    setLocalSavedData(null);
    
    if (initialData && initialData.parafia) {
      const initialFormData = {
        parafia_id: initialData.parafia.id.toString()
      };
      setFormData(initialFormData);
      setOriginalData(initialFormData);
      setIsModified(false);
    }
  }, [initialData]);
  
  // Check if form data is different from original data
  useEffect(() => {
    const hasChanges = formData.parafia_id !== originalData.parafia_id;
    setIsModified(hasChanges);
  }, [formData, originalData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.MouseEvent) => {
    // Since we're now using a div instead of a form, we don't need e.preventDefault()
    
    if (!formData.parafia_id) {
      setError('Proszę wybrać parafię');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await kandydatApi.assignToParafia(kandydatId, { parafiaId: parseInt(formData.parafia_id) });
      
      if (response.success) {
        toast.success('Parafia została przypisana pomyślnie');
        
        // Update original data to match current data
        setOriginalData({...formData});
        setIsModified(false);
        
        // Get the selected parish for immediate display
        const selectedParafia = parafie.find(p => p.id.toString() === formData.parafia_id);
        if (selectedParafia) {
          // Create local data for immediate display
          setLocalSavedData({
            id: selectedParafia.id,
            wezwanie: selectedParafia.wezwanie,
            miejscowosc: selectedParafia.miejscowosc
          });
        }
        
        // Call parent's onSuccess callback to trigger full refresh
        onSuccess();
      } else {
        setError(response.message || 'Nie udało się przypisać parafii');
      }
    } catch (error) {
      console.error('Błąd podczas przypisywania parafii:', error);
      setError('Wystąpił błąd podczas przypisywania parafii');
    } finally {
      setLoading(false);
    }
  };
  
  const getSelectedParafia = () => {
    return parafie.find(p => p.id.toString() === formData.parafia_id);
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
        const displayData = localSavedData ? { parafia: localSavedData } : initialData;
        
        if (!displayData?.parafia && !readOnly) {
          return (
            <div className="mb-4 p-4 text-blue-200 bg-blue-900/30 rounded-md border border-blue-800">
              Kandydat nie ma jeszcze przypisanej parafii. Wybierz parafię, aby przypisać kandydata.
            </div>
          );
        }
        
        if (displayData?.parafia) {
          return (
            <div className="mb-4 p-4 bg-gray-750 rounded-md border border-gray-600">
              <h5 className="text-lg font-medium mb-2 text-amber-400">Aktualna parafia</h5>
              <div className="space-y-1 text-gray-200">
                <div><strong className="text-amber-300">Wezwanie:</strong> {displayData.parafia.wezwanie}</div>
                <div>
                  <strong className="text-amber-300">Miejscowość:</strong>{" "}
                  {displayData.parafia.miejscowosc || 
                    (displayData.parafia.adres?.miejscowosc) || 
                    (displayData.parafia.wezwanie?.includes('(') && displayData.parafia.wezwanie.match(/\((.*?)\)/)?.[1])}
                </div>
              </div>
            </div>
          );
        }
        
        return null;
      })()}
      
      {!readOnly && (
        <div className="space-y-4">
          <div className="mb-4">
            <label htmlFor="parafia_id" className="block text-sm font-medium text-amber-300 mb-1">Parafia*</label>
            <select
              id="parafia_id"
              name="parafia_id"
              value={formData.parafia_id}
              onChange={handleChange}
              disabled={loadingParafie}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-white bg-gray-700 border border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                       sm:text-sm rounded-md"
              required
            >
              <option value="">Wybierz parafię</option>
              {parafie.map(parafia => (
                <option key={parafia.id} value={parafia.id.toString()}>
                  {parafia.wezwanie} ({parafia.miejscowosc})
                </option>
              ))}
            </select>
            
            {loadingParafie && (
              <div className="mt-2 flex items-center text-sm text-gray-400">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Pobieranie listy parafii...
              </div>
            )}
            
            <p className="mt-1 text-sm text-gray-400">
              Wybierz parafię, do której należy kandydat
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || loadingParafie}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm 
                        text-sm font-medium text-white 
                        ${isModified ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 
                        ${(loading || loadingParafie) ? 'opacity-75 cursor-not-allowed' : ''}`}
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
                'Zapisz zmiany w parafii' : 
                'Przypisz parafię'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KandydatParafiaForm; 