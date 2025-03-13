import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { kandydatApi } from '../services/api';

interface KandydatImieBierzmowaniaFormProps {
  kandydatId: string;
  initialData: any;
  onSuccess: () => void;
  readOnly?: boolean;
}

const KandydatImieBierzmowaniaForm: React.FC<KandydatImieBierzmowaniaFormProps> = ({
  kandydatId,
  initialData,
  onSuccess,
  readOnly = false
}) => {
  const [formData, setFormData] = useState({
    imie: '',
    uzasadnienie: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inicjalizacja formularza danymi z props
  useEffect(() => {
    if (initialData && initialData.imie_bierzmowania) {
      setFormData({
        imie: initialData.imie_bierzmowania.imie || '',
        uzasadnienie: initialData.imie_bierzmowania.uzasadnienie || ''
      });
    }
  }, [initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imie) {
      setError('Imię bierzmowania jest wymagane');
      return;
    }

    if (!formData.uzasadnienie) {
      setError('Uzasadnienie wyboru imienia jest wymagane');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await kandydatApi.saveImieBierzmowania(kandydatId, {
        imie: formData.imie,
        uzasadnienie: formData.uzasadnienie
      });
      
      if (response.success) {
        toast.success('Imię bierzmowania zostało zapisane');
        onSuccess();
      } else {
        setError(response.message || 'Nie udało się zapisać imienia bierzmowania');
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania imienia bierzmowania:', error);
      setError('Wystąpił błąd podczas zapisywania imienia bierzmowania');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md" role="alert">
          {error}
        </div>
      )}
      
      {initialData?.imie_bierzmowania && (
        <div className="mb-4 p-4 border border-gray-200 rounded-md">
          <h5 className="text-lg font-medium mb-2">Wybrane imię bierzmowania</h5>
          <div><strong>Imię:</strong> {initialData.imie_bierzmowania.imie}</div>
          <div className="mt-2">
            <strong>Uzasadnienie:</strong>
            <p className="mt-1 text-gray-700">{initialData.imie_bierzmowania.uzasadnienie}</p>
          </div>
        </div>
      )}
      
      {!initialData?.imie_bierzmowania && !readOnly && (
        <div className="mb-4 p-4 text-blue-700 bg-blue-50 rounded-md">
          Nie wybrano jeszcze imienia bierzmowania. Uzupełnij poniższy formularz, aby dodać imię bierzmowania.
        </div>
      )}
      
      {!readOnly && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="imie" className="block text-sm font-medium text-gray-700">Imię bierzmowania*</label>
            <input
              type="text"
              name="imie"
              id="imie"
              value={formData.imie}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Imię świętego lub błogosławionego, które przyjmujesz jako imię bierzmowania
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="uzasadnienie" className="block text-sm font-medium text-gray-700">Uzasadnienie wyboru*</label>
            <textarea
              name="uzasadnienie"
              id="uzasadnienie"
              rows={4}
              value={formData.uzasadnienie}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">
              Opisz, dlaczego wybrałeś/aś to imię i co wiesz o wybranym świętym/błogosławionym
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Zapisywanie...
                </>
              ) : 'Zapisz imię bierzmowania'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default KandydatImieBierzmowaniaForm; 