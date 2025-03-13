import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usersApi, grupyApi } from '../services/api';

interface GrupaFormProps {
  initialData?: {
    id?: number;
    nazwa: string;
    animator_id: number | null;
    czlonkowie?: number[];
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Interfejs dla animatora
interface Animator {
  id: number;
  imie: string;
  nazwisko: string;
  username: string;
}

// Interfejs dla kandydata
interface Kandydat {
  id: number;
  imie: string;
  nazwisko: string;
  username: string;
}

export const GrupaForm: React.FC<GrupaFormProps> = ({
  initialData = { nazwa: '', animator_id: null, czlonkowie: [] },
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  // Stan formularza
  const [nazwa, setNazwa] = useState(initialData.nazwa);
  const [animatorId, setAnimatorId] = useState<number | null>(initialData.animator_id);
  const [czlonkowie, setCzlonkowie] = useState<number[]>(initialData.czlonkowie || []);
  
  // Stan dla danych
  const [animatorzy, setAnimatorzy] = useState<Animator[]>([]);
  const [kandydaci, setKandydaci] = useState<Kandydat[]>([]);
  const [loadingAnimatorzy, setLoadingAnimatorzy] = useState(false);
  const [loadingKandydaci, setLoadingKandydaci] = useState(false);
  
  // Flagi walidacji
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Pobieranie animatorów przy montowaniu komponentu
  useEffect(() => {
    fetchAnimatorzy();
    fetchKandydaci();
  }, []);

  // Funkcja pobierająca animatorów
  const fetchAnimatorzy = async () => {
    setLoadingAnimatorzy(true);
    try {
      // Pobieramy użytkowników z rolą 'animator'
      const response = await usersApi.getUsersByRole('animator');
      setAnimatorzy(response);
    } catch (error) {
      console.error('Błąd podczas pobierania animatorów:', error);
      toast.error('Nie udało się pobrać listy animatorów');
    } finally {
      setLoadingAnimatorzy(false);
    }
  };

  // Funkcja pobierająca kandydatów
  const fetchKandydaci = async () => {
    setLoadingKandydaci(true);
    try {
      // Pobieramy użytkowników z rolą 'kandydat'
      const response = await usersApi.getUsersByRole('kandydat');
      setKandydaci(response);
    } catch (error) {
      console.error('Błąd podczas pobierania kandydatów:', error);
      toast.error('Nie udało się pobrać listy kandydatów');
    } finally {
      setLoadingKandydaci(false);
    }
  };

  // Obsługa zmiany wybranych kandydatów
  const handleKandydaciChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: number[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    
    setCzlonkowie(selectedValues);
  };

  // Walidacja formularza
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!nazwa.trim()) {
      newErrors.nazwa = 'Nazwa grupy jest wymagana';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Obsługa wysłania formularza
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
    
    if (!validateForm()) {
      return;
    }
    
    const formData = {
      id: initialData.id,
      nazwa,
      animator_id: animatorId,
      czlonkowie
    };
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nazwa grupy */}
      <div>
        <label htmlFor="nazwa" className="block text-sm font-medium text-gray-300 mb-1">
          Nazwa grupy *
        </label>
        <input
          type="text"
          id="nazwa"
          value={nazwa}
          onChange={(e) => setNazwa(e.target.value)}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 bg-gray-700 border ${
            validated && errors.nazwa ? 'border-red-500' : 'border-gray-600'
          } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500`}
          placeholder="Podaj nazwę grupy"
        />
        {validated && errors.nazwa && (
          <p className="mt-1 text-sm text-red-500">{errors.nazwa}</p>
        )}
      </div>

      {/* Wybór animatora */}
      <div>
        <label htmlFor="animator" className="block text-sm font-medium text-gray-300 mb-1">
          Przypisany animator
        </label>
        <div className="relative">
          {loadingAnimatorzy ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
              <span className="ml-2 text-gray-300">Ładowanie animatorów...</span>
            </div>
          ) : (
            <select
              id="animator"
              value={animatorId?.toString() || ''}
              onChange={(e) => setAnimatorId(e.target.value ? parseInt(e.target.value) : null)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Wybierz animatora --</option>
              {animatorzy.map(animator => (
                <option key={animator.id} value={animator.id}>
                  {animator.imie} {animator.nazwisko} ({animator.username})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Wybór kandydatów */}
      <div>
        <label htmlFor="kandydaci" className="block text-sm font-medium text-gray-300 mb-1">
          Przypisani kandydaci
        </label>
        <div className="relative">
          {loadingKandydaci ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
              <span className="ml-2 text-gray-300">Ładowanie kandydatów...</span>
            </div>
          ) : (
            <>
              <select
                multiple
                id="kandydaci"
                value={czlonkowie.map(String)}
                onChange={handleKandydaciChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                size={Math.min(6, kandydaci.length || 1)}
              >
                {kandydaci.map(kandydat => (
                  <option key={kandydat.id} value={kandydat.id}>
                    {kandydat.imie} {kandydat.nazwisko} ({kandydat.username})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Przytrzymaj klawisz Ctrl (Cmd na Mac), aby wybrać wielu kandydatów
              </p>
            </>
          )}
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Zapisywanie...
            </>
          ) : (
            <>Zapisz</>
          )}
        </button>
      </div>
    </form>
  );
};

export default GrupaForm; 