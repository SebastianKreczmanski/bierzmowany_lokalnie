import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { kandydatApi } from '../services/api';
import KandydatRodzicForm from './KandydatRodzicForm';
import KandydatGrupaForm from './KandydatGrupaForm';
import KandydatSwiadekForm from './KandydatSwiadekForm';
import KandydatImieBierzmowaniaForm from './KandydatImieBierzmowaniaForm';
import KandydatSzkolaForm from './KandydatSzkolaForm';
import KandydatParafiaForm from './KandydatParafiaForm';
import { useAuth } from '../contexts/AuthContext';

const KandydatManagement: React.FC = () => {
  const [kandydat, setKandydat] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dane');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    const fetchKandydat = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await kandydatApi.getKandydatData(id);
        
        if (response.success) {
          setKandydat(response.data);
        } else {
          setError(response.message || 'Nie udało się pobrać danych kandydata');
        }
      } catch (error: any) {
        console.error('Błąd pobierania danych kandydata:', error);
        setError('Wystąpił błąd podczas pobierania danych kandydata');
      } finally {
        setLoading(false);
      }
    };

    fetchKandydat();
  }, [id]);

  const handleRefresh = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await kandydatApi.getKandydatData(id);
      
      if (response.success) {
        setKandydat(response.data);
        toast.success('Dane zostały odświeżone');
      } else {
        toast.error(response.message || 'Nie udało się odświeżyć danych');
      }
    } catch (error: any) {
      console.error('Błąd odświeżania danych:', error);
      toast.error('Wystąpił błąd podczas odświeżania danych');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !kandydat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
          {error}
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Wróć
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Zarządzanie kandydatem: {kandydat?.imie} {kandydat?.nazwisko}
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Odświeżanie...
              </span>
            ) : 'Odśwież dane'}
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Wróć
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'dane' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dane')}
          >
            Dane osobowe
          </button>
          <button
            className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'rodzic' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('rodzic')}
          >
            Rodzic
          </button>
          <button
            className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'swiadek' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('swiadek')}
          >
            Świadek
          </button>
          <button
            className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'imie' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('imie')}
          >
            Imię bierzmowania
          </button>
          <button
            className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'szkola' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('szkola')}
          >
            Szkoła
          </button>
          <button
            className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'parafia' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('parafia')}
          >
            Parafia
          </button>
          <button
            className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'grupa' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('grupa')}
          >
            Grupa
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'dane' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Dane osobowe kandydata</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Imię</p>
                <p className="font-medium">{kandydat?.imie}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nazwisko</p>
                <p className="font-medium">{kandydat?.nazwisko}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data urodzenia</p>
                <p className="font-medium">{kandydat?.data_urodzenia}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{kandydat?.email || 'Brak'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefon</p>
                <p className="font-medium">{kandydat?.telefon || 'Brak'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adres</p>
                <p className="font-medium">
                  {kandydat?.adres ? (
                    <>
                      {kandydat.adres.ulica} {kandydat.adres.nr_budynku}
                      {kandydat.adres.nr_lokalu && `/${kandydat.adres.nr_lokalu}`}, 
                      {kandydat.adres.kod_pocztowy} {kandydat.adres.miejscowosc}
                    </>
                  ) : 'Brak'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rodzic' && (
          <KandydatRodzicForm 
            kandydatId={id || ''} 
            initialData={kandydat} 
            onSuccess={handleRefresh} 
            readOnly={!hasRole('admin') && !hasRole('koordynator')}
          />
        )}

        {activeTab === 'swiadek' && (
          <KandydatSwiadekForm 
            kandydatId={id || ''} 
            initialData={kandydat} 
            onSuccess={handleRefresh} 
            readOnly={!hasRole('admin') && !hasRole('koordynator')}
          />
        )}

        {activeTab === 'imie' && (
          <KandydatImieBierzmowaniaForm 
            kandydatId={id || ''} 
            initialData={kandydat} 
            onSuccess={handleRefresh} 
            readOnly={!hasRole('admin') && !hasRole('koordynator')}
          />
        )}

        {activeTab === 'szkola' && (
          <KandydatSzkolaForm 
            kandydatId={id || ''} 
            initialData={kandydat} 
            onSuccess={handleRefresh} 
            readOnly={!hasRole('admin') && !hasRole('koordynator')}
          />
        )}

        {activeTab === 'parafia' && (
          <KandydatParafiaForm 
            kandydatId={id || ''} 
            initialData={kandydat} 
            onSuccess={handleRefresh} 
            readOnly={!hasRole('admin') && !hasRole('koordynator')}
          />
        )}

        {activeTab === 'grupa' && (
          <KandydatGrupaForm 
            kandydatId={id || ''} 
            initialData={kandydat} 
            onSuccess={handleRefresh} 
            readOnly={!hasRole('admin') && !hasRole('koordynator') && !hasRole('animator')}
          />
        )}
      </div>
    </div>
  );
};

export default KandydatManagement; 