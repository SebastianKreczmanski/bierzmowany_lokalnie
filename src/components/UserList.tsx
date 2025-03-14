import React, { useState, useEffect } from 'react';
import { usersApi, locationsApi } from '../services/api';
import { User } from '../types/user';
import { FaUserEdit, FaTrash, FaEye, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import UserForm from './UserForm';
import UserDetails from './UserDetails';

/**
 * Komponent wyświetlający listę użytkowników pogrupowanych według ról
 */
const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showEditUserModal, setShowEditUserModal] = useState<boolean>(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userDetailsForEdit, setUserDetailsForEdit] = useState<User | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState<boolean>(false);

  // Pobieranie użytkowników
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Błąd podczas pobierania użytkowników:', err);
      setError('Nie udało się pobrać listy użytkowników');
      toast.error('Nie udało się pobrać listy użytkowników');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Grupowanie użytkowników według ról
  const getUsersByRole = () => {
    const roleGroups: { [key: string]: User[] } = {};
    
    users.forEach(user => {
      user.roles.forEach(role => {
        if (!roleGroups[role]) {
          roleGroups[role] = [];
        }
        roleGroups[role].push(user);
      });
    });
    
    return roleGroups;
  };

  // Obsługa usuwania użytkownika
  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      try {
        await usersApi.deleteUser(userId);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        toast.success('Użytkownik został usunięty');
      } catch (err) {
        console.error('Błąd podczas usuwania użytkownika:', err);
        toast.error('Nie udało się usunąć użytkownika');
      }
    }
  };

  // Obsługa wyświetlania szczegółów użytkownika
  const handleViewUserDetails = (userId: number) => {
    setSelectedUser(userId);
    setShowUserDetailsModal(true);
  };

  /**
   * Obsługa edycji użytkownika - pobiera pełne dane użytkownika i adresu
   * @param userId ID użytkownika do edycji
   */
  const handleEditUser = async (userId: number) => {
    setSelectedUser(userId);
    setLoadingUserDetails(true);
    
    console.log('Edycja użytkownika - pobieranie danych dla userId:', userId);
    
    try {
      // Pobierz dane użytkownika
      const userData = await usersApi.getUserDetails(userId);
      console.log('Pobrane dane użytkownika:', userData);
      
      if (!userData) {
        toast.error('Nie udało się pobrać danych użytkownika');
        setLoadingUserDetails(false);
        return;
      }
      
      // Jeśli użytkownik ma adres, pobierz szczegóły adresu
      if (userData.adres_id) {
        console.log('Użytkownik ma adres_id:', userData.adres_id, '- pobieranie szczegółów adresu');
        
        try {
          const addressDetails = await locationsApi.getAddressDetails(userData.adres_id);
          console.log('Pobrane szczegóły adresu:', addressDetails);
          console.log('Pola w obiekcie addressDetails:', Object.keys(addressDetails || {}));
          
          if (addressDetails) {
            // Sprawdź czy mamy wszystkie potrzebne dane
            if (!addressDetails.ulica_id || !addressDetails.miejscowosc_id) {
              console.warn('Brakujące dane adresu: ulica_id lub miejscowosc_id:', {
                ulica_id: addressDetails.ulica_id,
                miejscowosc_id: addressDetails.miejscowosc_id
              });
            }
            
            // Dodaj obiekt adresu do danych użytkownika
            userData.adres = {
              id: userData.adres_id,
              ulica_id: addressDetails.ulica_id,
              miejscowosc_id: addressDetails.miejscowosc_id,
              nr_budynku: addressDetails.nr_budynku || '',
              nr_lokalu: addressDetails.nr_lokalu || '',
              kod_pocztowy: addressDetails.kod_pocztowy || '',
              ulica_nazwa: addressDetails.ulica_nazwa,
              miejscowosc_nazwa: addressDetails.miejscowosc_nazwa
            };
            
            console.log('Utworzono obiekt adresu dla użytkownika:', userData.adres);
            console.log('Kompletne pola adresu:', Object.keys(userData.adres));
          } else {
            console.warn(`Nie znaleziono adresu o ID ${userData.adres_id}`);
            toast.error('Nie udało się pobrać szczegółów adresu użytkownika');
          }
        } catch (addressError) {
          console.error('Błąd podczas pobierania szczegółów adresu:', addressError);
          toast.error('Nie udało się pobrać szczegółów adresu użytkownika');
        }
      } else {
        console.log('Użytkownik nie ma przypisanego adresu (brak adres_id)');
      }
      
      // Zabezpieczenie, że zawsze mamy obiekt adresu nawet pusty
      userData.adres = userData.adres || {
        id: null,
        ulica_id: null,
        miejscowosc_id: null,
        nr_budynku: '',
        nr_lokalu: '',
        kod_pocztowy: ''
      };
      
      setUserDetailsForEdit(userData);
      setShowEditUserModal(true);
    } catch (error) {
      console.error('Błąd podczas pobierania danych użytkownika:', error);
      toast.error('Nie udało się pobrać danych użytkownika');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Obsługa dodawania nowego użytkownika
  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  // Obsługa sukcesu dodawania/edycji użytkownika
  const handleUserFormSuccess = () => {
    setShowAddUserModal(false);
    setShowEditUserModal(false);
    fetchUsers();
  };

  // Mapowanie nazw ról na polskie odpowiedniki
  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'administrator': 'Administrator',
      'duszpasterz': 'Duszpasterz',
      'kancelaria': 'Pracownik kancelarii',
      'animator': 'Animator',
      'rodzic': 'Rodzic',
      'kandydat': 'Kandydat do bierzmowania',
      'swiadek': 'Świadek bierzmowania'
    };
    
    return roleMap[role] || role;
  };

  // Sortowanie ról według priorytetu
  const getSortedRoles = (): string[] => {
    const roleGroups = getUsersByRole();
    const rolePriority = [
      'administrator',
      'duszpasterz',
      'kancelaria',
      'animator',
      'rodzic',
      'swiadek',
      'kandydat'
    ];
    
    return Object.keys(roleGroups).sort((a, b) => {
      const indexA = rolePriority.indexOf(a);
      const indexB = rolePriority.indexOf(b);
      
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Błąd!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const roleGroups = getUsersByRole();
  const sortedRoles = getSortedRoles();
  const filteredRoles = selectedRole ? [selectedRole] : sortedRoles;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-amber-500">Zarządzanie Użytkownikami</h2>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
        >
          <FaUserPlus /> Dodaj użytkownika
        </button>
      </div>

      {/* Filtrowanie według roli */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedRole(null)}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedRole === null
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Wszystkie role
        </button>
        {sortedRoles.map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedRole === role
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {getRoleDisplayName(role)}
          </button>
        ))}
      </div>

      {/* Lista użytkowników pogrupowanych według ról */}
      <div className="space-y-8">
        <AnimatePresence>
          {filteredRoles.map(role => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-gray-700 px-4 py-3">
                <h3 className="text-lg font-medium text-amber-400">{getRoleDisplayName(role)}</h3>
                <p className="text-sm text-gray-300">Liczba użytkowników: {roleGroups[role].length}</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nazwa użytkownika
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Imię i nazwisko
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {roleGroups[role].map(user => (
                      <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.imie} {user.nazwisko}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map(r => (
                              <span
                                key={r}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  r === 'administrator'
                                    ? 'bg-red-900 text-red-200'
                                    : r === 'duszpasterz'
                                    ? 'bg-purple-900 text-purple-200'
                                    : r === 'kancelaria'
                                    ? 'bg-blue-900 text-blue-200'
                                    : r === 'animator'
                                    ? 'bg-green-900 text-green-200'
                                    : r === 'rodzic'
                                    ? 'bg-yellow-900 text-yellow-200'
                                    : r === 'swiadek'
                                    ? 'bg-pink-900 text-pink-200'
                                    : 'bg-gray-900 text-gray-200'
                                }`}
                              >
                                {getRoleDisplayName(r)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewUserDetails(user.id)}
                              className="text-blue-500 hover:text-blue-400"
                              title="Zobacz szczegóły"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="text-amber-500 hover:text-amber-400"
                              title="Edytuj użytkownika"
                            >
                              <FaUserEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-500 hover:text-red-400"
                              title="Usuń użytkownika"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal dodawania nowego użytkownika */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-amber-500 mb-4">Dodaj nowego użytkownika</h2>
                <UserForm 
                  onSubmit={handleUserFormSuccess} 
                  onCancel={() => setShowAddUserModal(false)} 
                  isEditMode={false}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal edycji użytkownika */}
      <AnimatePresence>
        {showEditUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-amber-500 mb-4">
                  {loadingUserDetails ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-amber-500 rounded-full"></div>
                      <span>Ładowanie danych użytkownika...</span>
                    </div>
                  ) : (
                    `Edytuj użytkownika: ${userDetailsForEdit?.imie} ${userDetailsForEdit?.nazwisko}`
                  )}
                </h2>
                {loadingUserDetails ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                  </div>
                ) : (
                  <UserForm 
                    onSubmit={handleUserFormSuccess} 
                    onCancel={() => setShowEditUserModal(false)} 
                    initialData={userDetailsForEdit}
                    isEditMode={true}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal szczegółów użytkownika */}
      <AnimatePresence>
        {showUserDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-amber-500 mb-4">
                  Szczegóły użytkownika
                </h2>
                {selectedUser && (
                  <UserDetails 
                    userId={selectedUser} 
                    onClose={() => setShowUserDetailsModal(false)}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserList; 