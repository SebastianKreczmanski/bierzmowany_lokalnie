import React, { useState, useEffect } from 'react';
import { locationsApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaRoad, FaHome, FaMailBulk, FaPlus } from 'react-icons/fa';

export interface AdresFormData {
  miejscowosc_id: number | null;
  ulica_id: number | null;
  nr_budynku: string;
  nr_lokalu: string;
  kod_pocztowy: string;
}

interface City {
  id: number;
  nazwa: string;
}

interface Street {
  id: number;
  nazwa: string;
  miejscowosc_id: number;
}

interface AddressFormProps {
  onAddressSelected: (addressData: AdresFormData) => void;
  initialData?: Partial<AdresFormData>;
  onCancel?: () => void;
  noForm?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  onAddressSelected, 
  initialData,
  onCancel,
  noForm = false
}) => {
  // Form state
  const [formData, setFormData] = useState<AdresFormData>({
    miejscowosc_id: initialData?.miejscowosc_id || null,
    ulica_id: initialData?.ulica_id || null,
    nr_budynku: initialData?.nr_budynku || '',
    nr_lokalu: initialData?.nr_lokalu || '',
    kod_pocztowy: initialData?.kod_pocztowy || ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<City[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);
  
  // State for adding new city or street
  const [showAddCityForm, setShowAddCityForm] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [addingCity, setAddingCity] = useState(false);
  
  const [showAddStreetForm, setShowAddStreetForm] = useState(false);
  const [newStreetName, setNewStreetName] = useState('');
  const [addingStreet, setAddingStreet] = useState(false);
  
  // Load cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);
  
  // Load streets when city is selected
  useEffect(() => {
    if (formData.miejscowosc_id) {
      fetchStreets(formData.miejscowosc_id);
    } else {
      setStreets([]);
      // Reset street selection if city is changed
      if (formData.ulica_id) {
        setFormData(prev => ({ ...prev, ulica_id: null }));
      }
    }
  }, [formData.miejscowosc_id]);
  
  // Fetch cities from API
  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      const fetchedCities = await locationsApi.getMiejscowosci();
      setCities(fetchedCities);
    } catch (error) {
      console.error('Błąd podczas pobierania miejscowości:', error);
      toast.error('Nie udało się pobrać listy miejscowości');
    } finally {
      setLoadingCities(false);
    }
  };
  
  // Fetch streets for selected city from API
  const fetchStreets = async (cityId: number) => {
    setLoadingStreets(true);
    try {
      const fetchedStreets = await locationsApi.getUliceByMiejscowosc(cityId);
      setStreets(fetchedStreets);
    } catch (error) {
      console.error(`Błąd podczas pobierania ulic dla miejscowości ID ${cityId}:`, error);
      toast.error('Nie udało się pobrać listy ulic');
    } finally {
      setLoadingStreets(false);
    }
  };
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For select fields, convert to number if it's a number
    if (name === 'miejscowosc_id' || name === 'ulica_id') {
      const numValue = value ? parseInt(value, 10) : null;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle adding a new city
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCityName.trim()) {
      setErrors(prev => ({ ...prev, newCity: 'Podaj nazwę miejscowości' }));
      return;
    }

    setAddingCity(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.newCity;
      return newErrors;
    });

    try {
      const newCity = await locationsApi.createMiejscowosc(newCityName.trim());
      toast.success(`Dodano nową miejscowość: ${newCity.nazwa}`);
      
      // Add to cities list and select it
      setCities(prev => [...prev, newCity]);
      setFormData(prev => ({ ...prev, miejscowosc_id: newCity.id }));
      
      // Reset form
      setNewCityName('');
      setShowAddCityForm(false);
    } catch (error) {
      console.error('Błąd podczas dodawania miejscowości:', error);
      toast.error('Nie udało się dodać nowej miejscowości');
      setErrors(prev => ({ ...prev, newCity: 'Nie udało się dodać miejscowości' }));
    } finally {
      setAddingCity(false);
    }
  };

  // Handle adding a new street
  const handleAddStreet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStreetName.trim()) {
      setErrors(prev => ({ ...prev, newStreet: 'Podaj nazwę ulicy' }));
      return;
    }

    if (!formData.miejscowosc_id) {
      setErrors(prev => ({ ...prev, newStreet: 'Najpierw wybierz miejscowość' }));
      return;
    }

    setAddingStreet(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.newStreet;
      return newErrors;
    });

    try {
      const newStreet = await locationsApi.createUlica(newStreetName.trim(), formData.miejscowosc_id);
      toast.success(`Dodano nową ulicę: ${newStreet.nazwa}`);
      
      // Add to streets list and select it
      setStreets(prev => [...prev, newStreet]);
      setFormData(prev => ({ ...prev, ulica_id: newStreet.id }));
      
      // Reset form
      setNewStreetName('');
      setShowAddStreetForm(false);
    } catch (error) {
      console.error('Błąd podczas dodawania ulicy:', error);
      toast.error('Nie udało się dodać nowej ulicy');
      setErrors(prev => ({ ...prev, newStreet: 'Nie udało się dodać ulicy' }));
    } finally {
      setAddingStreet(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.miejscowosc_id) {
      newErrors.miejscowosc_id = 'Wybierz miejscowość';
    }
    
    if (!formData.ulica_id) {
      newErrors.ulica_id = 'Wybierz ulicę';
    }
    
    if (!formData.nr_budynku) {
      newErrors.nr_budynku = 'Podaj numer budynku';
    }
    
    if (!formData.kod_pocztowy) {
      newErrors.kod_pocztowy = 'Podaj prawidłowy kod pocztowy';
    } else if (!/^\d{2}-\d{3}$/.test(formData.kod_pocztowy)) {
      newErrors.kod_pocztowy = 'Podaj prawidłowy kod pocztowy w formacie XX-XXX';
    }
    
    setErrors(newErrors);
    
    // If there are no errors, submit the form
    if (Object.keys(newErrors).length === 0) {
      onAddressSelected(formData);
    }
  };

  // Function to validate address data (for when noForm is true)
  const validateAndSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.miejscowosc_id) {
      newErrors.miejscowosc_id = 'Wybierz miejscowość';
    }
    
    if (!formData.ulica_id) {
      newErrors.ulica_id = 'Wybierz ulicę';
    }
    
    if (!formData.nr_budynku) {
      newErrors.nr_budynku = 'Podaj numer budynku';
    }
    
    if (!formData.kod_pocztowy) {
      newErrors.kod_pocztowy = 'Podaj prawidłowy kod pocztowy';
    } else if (!/^\d{2}-\d{3}$/.test(formData.kod_pocztowy)) {
      newErrors.kod_pocztowy = 'Podaj prawidłowy kod pocztowy w formacie XX-XXX';
    }
    
    setErrors(newErrors);
    
    // If there are no errors, return true; otherwise return false
    if (Object.keys(newErrors).length === 0) {
      onAddressSelected(formData);
      return true;
    }
    
    return false;
  };

  // Format postal code as user types
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length <= 5) {
      let formattedValue = value;
      if (value.length > 2) {
        formattedValue = value.slice(0, 2) + '-' + value.slice(2);
      }
      
      setFormData(prev => ({ ...prev, kod_pocztowy: formattedValue }));
    }
  };
  
  // Get city name by ID
  const getCityName = (cityId: number | null) => {
    if (!cityId) return '';
    const city = cities.find(c => c.id === cityId);
    return city ? city.nazwa : '';
  };
  
  // Get street name by ID
  const getStreetName = (streetId: number | null) => {
    if (!streetId) return '';
    const street = streets.find(s => s.id === streetId);
    return street ? street.nazwa : '';
  };
  
  // Extract the form content to a separate variable so we can reuse it
  const formContent = (
    <>
      {/* Miejscowość - z opcją dodawania nowej */}
      <div>
        <label htmlFor="miejscowosc_id" className="block text-sm font-medium text-gray-300 mb-1">
          Miejscowość *
        </label>
        <div className="space-y-2">
          {loadingCities ? (
            <div className="flex items-center bg-gray-700 rounded-md border border-gray-600 px-3 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-amber-500 mr-2"></div>
              <span className="text-gray-400">Ładowanie miejscowości...</span>
            </div>
          ) : (
            <div className="flex space-x-2">
              <select
                id="miejscowosc_id"
                name="miejscowosc_id"
                value={formData.miejscowosc_id || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.miejscowosc_id ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Wybierz miejscowość</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.nazwa}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCityForm(!showAddCityForm)}
                className="flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
              >
                <FaPlus className="mr-1" /> {showAddCityForm ? 'Anuluj' : 'Dodaj nową'}
              </button>
            </div>
          )}
          
          {errors.miejscowosc_id && (
            <p className="mt-1 text-sm text-red-500">{errors.miejscowosc_id}</p>
          )}
          
          {/* Form for adding a new city */}
          {showAddCityForm && (
            <div className="mt-2 p-3 bg-gray-700 border border-gray-600 rounded-md">
              <h4 className="text-sm font-medium text-amber-400 mb-2">Dodaj nową miejscowość</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="Nazwa miejscowości"
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.newCity ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCity}
                  disabled={addingCity}
                  className="flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors disabled:bg-amber-800 disabled:opacity-70"
                >
                  {addingCity ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Dodawanie...
                    </>
                  ) : (
                    <>Dodaj</>
                  )}
                </button>
              </div>
              {errors.newCity && (
                <p className="mt-1 text-sm text-red-500">{errors.newCity}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Ulica - z opcją dodawania nowej */}
      <div>
        <label htmlFor="ulica_id" className="block text-sm font-medium text-gray-300 mb-1">
          Ulica *
        </label>
        <div className="space-y-2">
          {!formData.miejscowosc_id ? (
            <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400">
              Najpierw wybierz miejscowość
            </div>
          ) : loadingStreets ? (
            <div className="flex items-center bg-gray-700 rounded-md border border-gray-600 px-3 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-amber-500 mr-2"></div>
              <span className="text-gray-400">Ładowanie ulic...</span>
            </div>
          ) : (
            <div className="flex space-x-2">
              <div className="flex items-center w-full">
                <select
                  id="ulica_id"
                  name="ulica_id"
                  value={formData.ulica_id || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.ulica_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Wybierz ulicę</option>
                  {streets.map(street => (
                    <option key={street.id} value={street.id}>
                      {street.nazwa}
                    </option>
                  ))}
                </select>
                <div className="ml-2 text-amber-500">
                  <FaRoad />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStreetForm(!showAddStreetForm)}
                className="flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
              >
                <FaPlus className="mr-1" /> {showAddStreetForm ? 'Anuluj' : 'Dodaj nową'}
              </button>
            </div>
          )}
          
          {errors.ulica_id && (
            <p className="mt-1 text-sm text-red-500">{errors.ulica_id}</p>
          )}
          
          {/* Form for adding a new street */}
          {showAddStreetForm && formData.miejscowosc_id && (
            <div className="mt-2 p-3 bg-gray-700 border border-gray-600 rounded-md">
              <h4 className="text-sm font-medium text-amber-400 mb-2">
                Dodaj nową ulicę w {getCityName(formData.miejscowosc_id)}
              </h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newStreetName}
                  onChange={(e) => setNewStreetName(e.target.value)}
                  placeholder="Nazwa ulicy"
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.newStreet ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddStreet}
                  disabled={addingStreet}
                  className="flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors disabled:bg-amber-800 disabled:opacity-70"
                >
                  {addingStreet ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Dodawanie...
                    </>
                  ) : (
                    <>Dodaj</>
                  )}
                </button>
              </div>
              {errors.newStreet && (
                <p className="mt-1 text-sm text-red-500">{errors.newStreet}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Numer budynku i lokalu w jednym wierszu */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="nr_budynku" className="block text-sm font-medium text-gray-300 mb-1">
            Nr budynku *
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              id="nr_budynku"
              name="nr_budynku"
              value={formData.nr_budynku}
              onChange={handleChange}
              placeholder="np. 25A"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.nr_budynku ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            <div className="absolute right-3 text-amber-500">
              <FaHome />
            </div>
          </div>
          {errors.nr_budynku && (
            <p className="mt-1 text-sm text-red-500">{errors.nr_budynku}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="nr_lokalu" className="block text-sm font-medium text-gray-300 mb-1">
            Nr lokalu
          </label>
          <input
            type="text"
            id="nr_lokalu"
            name="nr_lokalu"
            value={formData.nr_lokalu}
            onChange={handleChange}
            placeholder="np. 42"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>
      
      {/* Kod pocztowy */}
      <div className="max-w-xs">
        <label htmlFor="kod_pocztowy" className="block text-sm font-medium text-gray-300 mb-1">
          Kod pocztowy *
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            id="kod_pocztowy"
            name="kod_pocztowy"
            value={formData.kod_pocztowy}
            onChange={handlePostalCodeChange}
            placeholder="XX-XXX"
            maxLength={6}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              errors.kod_pocztowy ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          <div className="absolute right-3 text-amber-500">
            <FaMailBulk />
          </div>
        </div>
        {errors.kod_pocztowy && (
          <p className="mt-1 text-sm text-red-500">{errors.kod_pocztowy}</p>
        )}
      </div>
      
      {/* Preview of selected address */}
      {formData.miejscowosc_id && formData.ulica_id && formData.nr_budynku && (
        <div className="mt-4 p-3 bg-gray-700 border border-gray-600 rounded-md">
          <h4 className="text-sm font-medium text-amber-400 mb-1">Podgląd adresu:</h4>
          <p className="text-white">
            ul. {getStreetName(formData.ulica_id)} {formData.nr_budynku}
            {formData.nr_lokalu && `/${formData.nr_lokalu}`}, {getCityName(formData.miejscowosc_id)}
            {formData.kod_pocztowy && `, ${formData.kod_pocztowy}`}
          </p>
        </div>
      )}
    </>
  );

  // Return either a form with the content or just the content
  return (
    <div className="bg-gray-800 text-white rounded-lg p-4">
      {noForm ? (
        <div className="space-y-4">
          {formContent}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Anuluj
              </button>
            )}
            <button
              type="button"
              onClick={validateAndSubmit}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Zapisywanie...
                </>
              ) : (
                'Zapisz adres'
              )}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formContent}
          
          {/* Form actions - only show these when it's a standalone form */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Anuluj
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Zapisywanie...
                </>
              ) : (
                'Zapisz adres'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddressForm; 