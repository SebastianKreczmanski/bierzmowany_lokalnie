import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
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

  // Obsługa edycji użytkownika
  const handleEditUser = (userId: number) => {
    setSelectedUser(userId);
    setShowEditUserModal(true);
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewUserDetails(user.id)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Zobacz szczegóły"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="text-amber-400 hover:text-amber-300 transition-colors"
                              title="Edytuj"
                            >
                              <FaUserEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Usuń"
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

      {/* Modalne okno dodawania użytkownika */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Dodaj nowego użytkownika</h2>
            <UserForm 
              onSubmit={handleUserFormSuccess} 
              onCancel={() => setShowAddUserModal(false)} 
            />
          </div>
        </div>
      )}

      {/* Modalne okno edycji użytkownika */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-amber-500 mb-4">Edytuj użytkownika</h2>
            <UserForm 
              onSubmit={handleUserFormSuccess} 
              onCancel={() => setShowEditUserModal(false)} 
              initialData={users.find(user => user.id === selectedUser)}
              isEditMode={true}
            />
          </div>
        </div>
      )}

      {/* Modalne okno szczegółów użytkownika */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <UserDetails 
              userId={selectedUser} 
              onClose={() => setShowUserDetailsModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList; 