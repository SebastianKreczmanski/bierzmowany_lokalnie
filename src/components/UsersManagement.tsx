import React, { useState, useEffect, useMemo } from 'react';
import { usersApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaHome, FaUser, FaGripLines } from 'react-icons/fa';
import UserAddModal from './UserAddModal';
import { User } from '../services/api';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [orderedRoles, setOrderedRoles] = useState<string[]>([]);
  // State for drag animation
  const [isDragging, setIsDragging] = useState(false);

  // Sanitize role names for use as IDs in react-beautiful-dnd
  const sanitizeId = (role: string): string => {
    // Remove any non-alphanumeric characters, replace spaces with dashes
    return `role-${role.replace(/[^\w-]/g, '').toLowerCase()}`;
  };
  
  // Tworzymy odwzorowanie sanityzowanych ID na oryginalne role
  const [roleIdMap, setRoleIdMap] = useState<Map<string, string>>(new Map());
  
  // Aktualizacja mapy ID ról po zmianie orderedRoles
  useEffect(() => {
    const newMap = new Map<string, string>();
    orderedRoles.forEach(role => {
      newMap.set(sanitizeId(role), role);
    });
    setRoleIdMap(newMap);
  }, [orderedRoles]);

  // Pobieranie użytkowników
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching users from API...');
      const fetchedUsers = await usersApi.getUsers();
      console.log(`Fetched ${fetchedUsers.length} users:`, fetchedUsers);
      setUsers(fetchedUsers);
      
      // If we successfully fetch users, clear any previous error
      if (error) setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Nie udało się pobrać listy użytkowników');
      toast.error('Błąd podczas pobierania użytkowników: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setLoading(false);
    }
  };

  // Pobieranie użytkowników przy pierwszym renderowaniu
  useEffect(() => {
    fetchUsers();
  }, []);

  // Initialize ordered roles when users are loaded
  useEffect(() => {
    if (users.length > 0) {
      // Try to load saved order from localStorage first
      const savedOrder = localStorage.getItem('userRolesOrder');
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          setOrderedRoles(parsedOrder);
          return;
        } catch (e) {
          console.error('Error parsing saved roles order', e);
        }
      }
      
      // If no saved order, generate one from current users
      const roles = new Set<string>();
      users.forEach(user => {
        if (user.roles && user.roles.length > 0) {
          user.roles.forEach(role => roles.add(role));
        }
      });
      
      // Add 'brak' for users without roles
      if (users.some(user => !user.roles || user.roles.length === 0)) {
        roles.add('brak');
      }
      
      // Set ordered roles if it's still empty
      if (orderedRoles.length === 0) {
        setOrderedRoles(Array.from(roles));
      }
    }
  }, [users, orderedRoles.length]);

  // Obsługa dodawania/edycji użytkownika
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = async (user: User) => {
    try {
      // Pobierz szczegóły użytkownika do edycji
      const userDetails = await usersApi.getUserDetails(user.id);
      console.log('Pobrane szczegóły użytkownika:', {
        ...userDetails,
        data_urodzenia: userDetails.data_urodzenia
      });
      setSelectedUser(userDetails);
      setShowAddModal(true);
    } catch (err: any) {
      console.error('Błąd podczas pobierania szczegółów użytkownika:', err);
      toast.error('Nie udało się pobrać danych użytkownika');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika ${user.imie} ${user.nazwisko}?`)) {
      return;
    }
    
    try {
      await usersApi.deleteUser(user.id);
      toast.success('Użytkownik został usunięty');
      fetchUsers(); // Odśwież listę użytkowników
    } catch (err: any) {
      toast.error('Nie udało się usunąć użytkownika');
    }
  };

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    // Add a class to the body to change cursor for the whole page during drag
    document.body.classList.add('grabbing');
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    // Reset dragging state
    setIsDragging(false);
    document.body.classList.remove('grabbing');
    
    console.log("DragEnd result:", result);
    
    // If no destination or dragged to the same place, do nothing
    if (!result.destination || result.destination.index === result.source.index) {
      console.log("No valid destination or same position, ignoring drag");
      return;
    }
    
    try {
      // Get source and destination indices
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      
      console.log(`Moving from index ${sourceIndex} to ${destinationIndex}`);
      console.log(`Current ordered roles:`, orderedRoles);
      
      if (sourceIndex < 0 || sourceIndex >= orderedRoles.length || 
          destinationIndex < 0 || destinationIndex >= orderedRoles.length) {
        console.error("Invalid source or destination index:", sourceIndex, destinationIndex);
        console.error("Current orderedRoles:", orderedRoles);
        toast.error("Błąd podczas zmiany kolejności. Spróbuj ponownie.");
        return;
      }
      
      // Create a new array of roles (important to create a new array to trigger re-render)
      const newOrderedRoles = Array.from(orderedRoles);
      
      // Remove the role from the source position
      const [movedRole] = newOrderedRoles.splice(sourceIndex, 1);
      
      // Insert the role at the destination position
      newOrderedRoles.splice(destinationIndex, 0, movedRole);
      
      console.log(`New ordered roles:`, newOrderedRoles);
      console.log(`Moved role:`, movedRole);
      
      // Update the state with the new order
      setOrderedRoles(newOrderedRoles);
      
      // Show feedback to the user
      toast.success(`Zmieniono kolejność: ${formatRoleName(movedRole)}`, {
        duration: 1500,
        icon: '🔄'
      });
      
      // Also save the new order to localStorage
      localStorage.setItem('userRolesOrder', JSON.stringify(newOrderedRoles));
    } catch (error) {
      console.error("Error during drag end processing:", error, error instanceof Error ? error.stack : '');
      toast.error("Wystąpił błąd podczas przesuwania elementu. Spróbuj ponownie.");
    }
  };

  // Save role order to localStorage
  const saveRoleOrder = () => {
    localStorage.setItem('userRolesOrder', JSON.stringify(orderedRoles));
    toast.success('Kolejność ról została zapisana', {
      duration: 2000,
      icon: '💾'
    });
  };

  // Auto-save when order changes
  useEffect(() => {
    if (orderedRoles.length > 0) {
      localStorage.setItem('userRolesOrder', JSON.stringify(orderedRoles));
    }
  }, [orderedRoles]);
  
  // Reset role order to default
  const resetRoleOrder = () => {
    localStorage.removeItem('userRolesOrder');
    // Generate default order from users
    const roles = new Set<string>();
    users.forEach(user => {
      if (user.roles && user.roles.length > 0) {
        user.roles.forEach(role => roles.add(role));
      }
    });
    
    // Add 'brak' for users without roles
    if (users.some(user => !user.roles || user.roles.length === 0)) {
      roles.add('brak');
    }
    
    setOrderedRoles(Array.from(roles));
    toast.success('Kolejność ról została zresetowana');
  };

  // Format role name for display
  const formatRoleName = (role: string): string => {
    // Replace with actual formatting logic as needed
    // This is a placeholder implementation
    const displayNameMap: Record<string, string> = {
      "admin": "Admin 🛡️",
      "animator": "Animator 🧑‍🏫",
      "kandydat": "Kandydat 👷‍",
      "koordynator": "Koordynator 📋",
      "ksiadz": "Ksiądz ✝️",
      "rodzic": "Rodzic 👪"
    };
    
    return displayNameMap[role] || role;
  };

  // Kolory dla ról
  const getRoleColor = (role: string): string => {
    switch(role) {
      case 'administrator': return '#FF5733'; // czerwony
      case 'duszpasterz': return '#33FF57';   // zielony
      case 'kancelaria': return '#3357FF';    // niebieski
      case 'animator': return '#F3FF33';      // żółty
      case 'rodzic': return '#FF33F3';        // różowy
      case 'kandydat': return '#33FFF3';      // turkusowy
      default: return '#B533FF';              // fioletowy
    }
  };

  // Get user roles for display with memoization
  const usersByRole = useMemo(() => {
    const roleGroups: { [key: string]: User[] } = {};
    
    users.forEach(user => {
      if (user.roles && user.roles.length > 0) {
        user.roles.forEach(role => {
          if (!roleGroups[role]) {
            roleGroups[role] = [];
          }
          // Dodaj użytkownika tylko jeśli nie został już dodany do tej grupy
          if (!roleGroups[role].some(u => u.id === user.id)) {
            roleGroups[role].push(user);
          }
        });
      } else {
        // Użytkownicy bez ról
        if (!roleGroups['brak']) {
          roleGroups['brak'] = [];
        }
        roleGroups['brak'].push(user);
      }
    });
    
    return roleGroups;
  }, [users]);

  // Ensure orderedRoles contains all roles present in usersByRole
  const displayRoles = useMemo(() => {
    // Start with the ordered roles
    const result = [...orderedRoles];
    
    // Add any roles that might not be in orderedRoles yet
    Object.keys(usersByRole || {}).forEach(role => {
      if (!result.includes(role)) {
        result.push(role);
      }
    });
    
    console.log("Computed displayRoles:", result);
    return result;
  }, [orderedRoles, usersByRole]);
  
  // Filter by selected role if specified
  const filteredRoleTypes = selectedRole ? [selectedRole] : displayRoles;
  
  // Log when filteredRoleTypes changes
  useEffect(() => {
    console.log("filteredRoleTypes updated:", filteredRoleTypes);
  }, [filteredRoleTypes]);

  // Modal callbacks
  const handleUserAdded = () => {
    console.log('User added/updated, refreshing user list...');
    fetchUsers();
    toast.success('Lista użytkowników została odświeżona');
  };

  // Add a refresh button
  const handleRefresh = () => {
    console.log('Manually refreshing user list...');
    fetchUsers();
    toast.success('Lista użytkowników została odświeżona');
  };

  // Display console logs to debug the state
  useEffect(() => {
    console.log("Role ID map:", roleIdMap);
    console.log("Ordered roles:", orderedRoles);
    
    // Debug each role with its sanitized ID
    orderedRoles.forEach(role => {
      console.log(`Role: ${role}, Sanitized ID: ${sanitizeId(role)}`);
    });
  }, [orderedRoles, roleIdMap]);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-amber-500">Zarządzanie użytkownikami</h2>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
        >
          <FaPlus /> Dodaj użytkownika
        </button>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-gray-300">Przeciągnij i upuść role, aby zmienić ich kolejność wyświetlania:</p>
            <p className="text-xs text-gray-400 mt-1">
              <span className="bg-gray-700 px-2 py-0.5 rounded">Wskazówka:</span> Po zmianie kolejności kliknij "Zapisz kolejność", aby zapamiętać ustawienia.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetRoleOrder}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
            >
              Resetuj
            </button>
            <button
              onClick={saveRoleOrder}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
            >
              Zapisz kolejność
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {/* "Wszystkie role" button outside of drag context */}
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
          
          {/* Draggable roles */}
          <DragDropContext 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Droppable droppableId="roles-droppable" direction="horizontal">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-wrap gap-2"
                >
                  {orderedRoles.map((role, index) => {
                    // Używamy sanitizedId dla poprawnej obsługi przeciągania
                    const sanitizedId = sanitizeId(role);
                    console.log(`Rendering draggable item: role=${role}, id=${sanitizedId}, index=${index}`);
                    
                    return (
                      <Draggable key={sanitizedId} draggableId={sanitizedId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center ${snapshot.isDragging ? 'z-10' : ''}`}
                            data-role={role}
                          >
                            <button
                              onClick={() => setSelectedRole(role)}
                              className={`px-3 py-1 rounded-full text-sm flex items-center shadow-md ${
                                selectedRole === role
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              } ${snapshot.isDragging ? 'ring-2 ring-white ring-opacity-70 scale-105' : ''}`}
                              style={{
                                backgroundColor: selectedRole === role 
                                  ? '' 
                                  : getRoleColor(role),
                                borderLeft: '3px solid rgba(255,255,255,0.3)',
                                transform: snapshot.isDragging ? 'rotate(-2deg)' : 'rotate(0)',
                                transition: 'transform 0.2s'
                              }}
                            >
                              {/* Drag handle */}
                              <div 
                                {...provided.dragHandleProps}
                                className="mr-2 cursor-grab active:cursor-grabbing"
                              >
                                <FaGripLines className="opacity-70" />
                              </div>
                              {formatRoleName(role)}
                              <span className="ml-2 px-1.5 py-0.5 bg-black bg-opacity-20 rounded-full text-xs">
                                {usersByRole[role]?.length || 0}
                              </span>
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Lista użytkowników pogrupowanych według ról */}
      <div className="space-y-8">
        {filteredRoleTypes.map(role => {
          // Skip roles with no users
          if (!usersByRole[role] || usersByRole[role].length === 0) {
            console.log(`Skipping role with no users: ${role}`);
            return null;
          }
          
          console.log(`Rendering table for role: ${role}`);
          return (
            <div
              key={role}
              className="bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-gray-700 px-4 py-3 flex items-center">
                <span
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: getRoleColor(role) }}
                ></span>
                <h3 className="text-lg font-medium text-amber-400">{formatRoleName(role)}</h3>
                <span className="ml-2 text-sm text-gray-300">
                  ({usersByRole[role].length} {usersByRole[role].length === 1 ? 'użytkownik' : usersByRole[role].length < 5 ? 'użytkowników' : 'użytkowników'})
                </span>
                <button
                  onClick={handleRefresh}
                  className="ml-auto flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  <span>Odśwież</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Użytkownik
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Login
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
                    {usersByRole[role].length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                          Brak użytkowników w tej roli
                        </td>
                      </tr>
                    ) : (
                      usersByRole[role].map(user => (
                        <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="font-medium">{user.imie} {user.nazwisko}</div>
                            {user.adres_id && (
                              <div className="text-xs flex items-center text-gray-400 mt-1">
                                <FaHome className="mr-1" /> ID adresu: {user.adres_id}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.map(userRole => (
                                <span
                                  key={userRole}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${getRoleColor(userRole)}40`,
                                    color: getRoleColor(userRole)
                                  }}
                                >
                                  <FaUser className="mr-1" size={10} />
                                  {formatRoleName(userRole)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-amber-400 hover:text-amber-300 transition-colors"
                                title="Edytuj"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Usuń"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Modal dodawania/edycji użytkownika */}
      <UserAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
        editUser={selectedUser}
      />
    </div>
  );
};

export default UsersManagement; 