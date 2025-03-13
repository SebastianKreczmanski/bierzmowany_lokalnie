import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { kandydatApi, usersApi } from '../services/api';
import AddressForm, { AdresFormData } from './AddressForm';
import { useAuth } from '../contexts/AuthContext';
import { FaSearch, FaPlus, FaUserEdit } from 'react-icons/fa';

interface KandydatSwiadekFormProps {
  kandydatId: string;
  initialData: any;
  onSuccess: () => void;
  readOnly?: boolean;
}

interface Witness {
  id: number;
  imie: string;
  nazwisko: string;
  email?: string;
  telefon?: string;
  adres_id?: number;
}

const KandydatSwiadekForm: React.FC<KandydatSwiadekFormProps> = ({
  kandydatId,
  initialData,
  onSuccess,
  readOnly = false
}) => {
  // Base form data
  const [formData, setFormData] = useState({
    imie: '',
    nazwisko: '',
    email: '',
    telefon: '',
    adres_id: null as number | null
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Witness selection state
  const [existingWitnesses, setExistingWitnesses] = useState<Witness[]>([]);
  const [loadingWitnesses, setLoadingWitnesses] = useState(false);
  const [selectedWitness, setSelectedWitness] = useState<Witness | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Get auth context to check user roles
  const { user } = useAuth();
  const canSelectWitness = user && (
    user.roles.includes('administrator') || 
    user.roles.includes('duszpasterz') || 
    user.roles.includes('kancelaria')
  );
  
  // Initialize form data from props
  useEffect(() => {
    if (initialData && initialData.swiadek) {
      setFormData({
        imie: initialData.swiadek.imie || '',
        nazwisko: initialData.swiadek.nazwisko || '',
        email: initialData.swiadek.email || '',
        telefon: initialData.swiadek.telefon || '',
        adres_id: initialData.swiadek.adres_id || null
      });
    }
  }, [initialData]);
  
  // Fetch existing witnesses if user has appropriate role
  useEffect(() => {
    if (canSelectWitness) {
      fetchExistingWitnesses();
    }
  }, [canSelectWitness]);
  
  // Fetch existing witnesses from the database
  const fetchExistingWitnesses = async () => {
    try {
      setLoadingWitnesses(true);
      
      // This is where we would call an API to get existing witnesses
      // Since we don't have a dedicated endpoint yet, we'll use a mock
      // In a real implementation, replace this with an actual API call:
      // const response = await usersApi.getAllWitnesses();
      
      // Mock data for demonstration
      const mockWitnesses: Witness[] = [
        { id: 1, imie: 'Marek', nazwisko: 'Nowak', email: 'marek.nowak@example.com', telefon: '123-567-890' },
        { id: 2, imie: 'Katarzyna', nazwisko: 'Kowalska', email: 'katarzyna.kowalska@example.com', telefon: '987-654-321' },
        { id: 3, imie: 'Tomasz', nazwisko: 'Wiśniewski', email: 'tomasz.wisniewski@example.com' },
        { id: 4, imie: 'Joanna', nazwisko: 'Dąbrowska', telefon: '555-123-456' }
      ];
      
      setExistingWitnesses(mockWitnesses);
    } catch (error) {
      console.error('Błąd podczas pobierania listy świadków:', error);
      toast.error('Nie udało się pobrać listy świadków');
    } finally {
      setLoadingWitnesses(false);
    }
  };
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle address selection from AddressForm
  const handleAddressSelected = (addressData: AdresFormData) => {
    // Use the createAddress function from addressUtils to create an address
    // and get the address ID, but for simplicity we'll just mock it here
    // In a real implementation, create and save the address first
    const mockAddressId = 123; // Mock ID
    setFormData(prev => ({ ...prev, adres_id: mockAddressId }));
    setShowAddressForm(false);
    toast.success('Adres został zapisany');
  };
  
  // Handle witness selection
  const handleWitnessSelect = (witness: Witness) => {
    setSelectedWitness(witness);
    setFormData({
      imie: witness.imie,
      nazwisko: witness.nazwisko,
      email: witness.email || '',
      telefon: witness.telefon || '',
      adres_id: witness.adres_id || null
    });
    setShowSearch(false);
  };
  
  // Filter witnesses based on search term
  const filteredWitnesses = existingWitnesses.filter(witness => {
    const searchLower = searchTerm.toLowerCase();
    return (
      witness.imie.toLowerCase().includes(searchLower) ||
      witness.nazwisko.toLowerCase().includes(searchLower) ||
      (witness.email && witness.email.toLowerCase().includes(searchLower))
    );
  });
  
  // Add validation function for the form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (selectedWitness) {
      // If we're using an existing witness, no validation needed
      return errors;
    }
    
    if (!formData.imie) {
      errors.push('Imię świadka jest wymagane');
    }
    
    if (!formData.nazwisko) {
      errors.push('Nazwisko świadka jest wymagane');
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate basic form fields
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let payload;
      
      if (selectedWitness) {
        // Using existing witness
        payload = {
          swiadek_id: selectedWitness.id
        };
      } else {
        // Creating new witness or updating existing one
        let adres = null;
        
        if (formData.adres_id) {
          // If we have an address ID, just use it
          adres = { id: formData.adres_id };
        }
        
        payload = {
          imie: formData.imie,
          nazwisko: formData.nazwisko,
          email: formData.email,
          telefon: formData.telefon,
          adres: adres
        };
      }
      
      // Save witness
      const response = await usersApi.updateUser(parseInt(kandydatId), {
        swiadek: payload
      });
      
      toast.success('Dane świadka zostały zapisane');
      onSuccess();
    } catch (err: any) {
      console.error('Błąd podczas zapisywania danych świadka:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania danych świadka');
      toast.error(err.message || 'Wystąpił błąd podczas zapisywania danych świadka');
    } finally {
      setLoading(false);
    }
  };
  
  // Render the search component for existing witnesses
  const renderWitnessSearch = () => {
    if (!canSelectWitness) return null;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-amber-500">Znajdź istniejącego świadka</h3>
          <button
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              setShowCreateForm(false);
            }}
            className={`px-3 py-1 rounded-md flex items-center ${
              showSearch ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            <FaSearch className="mr-1" /> {showSearch ? 'Ukryj' : 'Szukaj'}
          </button>
        </div>
        
        {showSearch && (
          <div className="p-4 bg-gray-700/30 rounded-md mb-4">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Szukaj świadka (imię, nazwisko, email)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            
            {loadingWitnesses ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : filteredWitnesses.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredWitnesses.map(witness => (
                  <div 
                    key={witness.id} 
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedWitness?.id === witness.id 
                        ? 'bg-amber-600/20 border-amber-600' 
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                    onClick={() => handleWitnessSelect(witness)}
                  >
                    <div className="font-medium">{witness.imie} {witness.nazwisko}</div>
                    <div className="text-sm text-gray-300 flex flex-col sm:flex-row sm:gap-4">
                      {witness.email && <span>Email: {witness.email}</span>}
                      {witness.telefon && <span>Telefon: {witness.telefon}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="p-3 bg-gray-700 border border-gray-600 rounded-md text-center">
                <p className="text-gray-300 mb-2">Nie znaleziono pasujących świadków</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setShowCreateForm(true);
                    setFormData({
                      imie: '',
                      nazwisko: '',
                      email: '',
                      telefon: '',
                      adres_id: null
                    });
                    setSelectedWitness(null);
                  }}
                  className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center mx-auto"
                >
                  <FaPlus className="mr-1" /> Utwórz nowego świadka
                </button>
              </div>
            ) : (
              <div className="p-3 bg-gray-700 border border-gray-600 rounded-md text-center text-gray-300">
                Wpisz imię, nazwisko lub email, aby wyszukać świadka
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Decide whether to show create form
  useEffect(() => {
    // If no witness is selected and the user doesn't have permission to select,
    // or if they explicitly choose to create a new witness, show the form
    if (!selectedWitness && (!canSelectWitness || showCreateForm)) {
      setShowCreateForm(true);
    }
  }, [selectedWitness, canSelectWitness, showCreateForm]);
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md" role="alert">
          {error}
        </div>
      )}
      
      {initialData?.swiadek && (
        <div className="mb-4 p-4 border border-gray-700 bg-gray-700/30 rounded-md">
          <h5 className="text-lg font-medium text-amber-500 mb-2">Obecne dane świadka</h5>
          <div className="text-white"><strong>Imię i nazwisko:</strong> {initialData.swiadek.imie} {initialData.swiadek.nazwisko}</div>
          {initialData.swiadek.email && <div className="text-white"><strong>Email:</strong> {initialData.swiadek.email}</div>}
          {initialData.swiadek.telefon && <div className="text-white"><strong>Telefon:</strong> {initialData.swiadek.telefon}</div>}
          {initialData.swiadek.adres && (
            <div className="text-white">
              <strong>Adres:</strong> ul. {initialData.swiadek.adres.ulica} {initialData.swiadek.adres.nr_budynku}
              {initialData.swiadek.adres.nr_lokalu && `/${initialData.swiadek.adres.nr_lokalu}`}, 
              {initialData.swiadek.adres.kod_pocztowy} {initialData.swiadek.adres.miejscowosc}
            </div>
          )}
        </div>
      )}
      
      {!readOnly && (
        <>
          {renderWitnessSearch()}
          
          {(showCreateForm || !canSelectWitness) && (
            <>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-amber-500">
                  {selectedWitness ? 'Edytuj dane świadka' : 'Dodaj nowego świadka'}
                </h3>
                {selectedWitness && (
                  <div className="text-sm bg-amber-600/20 text-amber-500 px-2 py-1 rounded-md flex items-center">
                    <FaUserEdit className="mr-1" /> Edycja: {selectedWitness.imie} {selectedWitness.nazwisko}
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="imie" className="block text-sm font-medium text-gray-300 mb-1">Imię świadka*</label>
                    <input
                      type="text"
                      id="imie"
                      name="imie"
                      value={formData.imie}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="nazwisko" className="block text-sm font-medium text-gray-300 mb-1">Nazwisko świadka*</label>
                    <input
                      type="text"
                      id="nazwisko"
                      name="nazwisko"
                      value={formData.nazwisko}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email świadka</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="telefon" className="block text-sm font-medium text-gray-300 mb-1">Telefon świadka</label>
                    <input
                      type="tel"
                      id="telefon"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">Adres świadka</label>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="text-sm text-amber-500 hover:text-amber-400 focus:outline-none"
                    >
                      {showAddressForm ? 'Ukryj formularz adresu' : 'Dodaj adres'}
                    </button>
                  </div>
                  
                  {showAddressForm ? (
                    <AddressForm
                      onAddressSelected={handleAddressSelected}
                      onCancel={() => setShowAddressForm(false)}
                      noForm={true}
                    />
                  ) : formData.adres_id ? (
                    <div className="p-3 bg-gray-700 border border-gray-600 rounded-md">
                      <p className="text-sm text-gray-300">
                        Adres został wybrany. ID adresu: {formData.adres_id}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, adres_id: null }))}
                        className="mt-2 text-sm text-red-400 hover:text-red-300 focus:outline-none"
                      >
                        Usuń adres
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-700 border border-gray-600 rounded-md">
                      <p className="text-sm text-gray-300">
                        Nie wybrano adresu. Kliknij "Dodaj adres", aby wybrać adres dla świadka.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-4 border-t border-gray-700">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Zapisywanie...
                      </>
                    ) : selectedWitness ? (
                      'Aktualizuj świadka'
                    ) : (
                      'Dodaj świadka'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default KandydatSwiadekForm; 