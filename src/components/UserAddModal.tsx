import React, { useEffect, useState } from 'react';
import { usersApi, grupyApi } from '../services/api';
import UserForm from './UserForm';
import { toast } from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';

interface UserAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  editUser?: any;
}

const UserAddModal: React.FC<UserAddModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
  editUser = null
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handling modal close with animation
  const handleClose = () => {
    if (isSubmitting) {
      console.log('Cannot close modal while submitting');
      return; // Prevent closing while submitting
    }
    
    console.log('Closing modal with animation');
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Animation duration in ms
  };
  
  // Prevent scrolling of body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const isEditMode = !!editUser;
  
  const handleSubmit = async (userData: any) => {
    if (isSubmitting) {
      console.log('Preventing double submission...');
      return; // Prevent multiple submissions
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Attempting to submit user data:', { 
        ...userData, 
        password: userData.password ? '******' : undefined,
        data_urodzenia: userData.data_urodzenia 
      });
      
      // Make sure roles is an array
      if (!userData.roles) {
        userData.roles = [];
        console.warn('Roles was undefined, defaulting to empty array');
      } else if (!Array.isArray(userData.roles)) {
        userData.roles = [userData.roles];
        console.warn('Roles was not an array, converting to array:', userData.roles);
      }
      
      // Validate required fields
      const requiredFields = ['username', 'imie', 'nazwisko'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!userData[field]) {
          missingFields.push(field);
        }
      }
      
      if (!isEditMode && !userData.password) {
        missingFields.push('password');
      }
      
      if (userData.roles.length === 0) {
        missingFields.push('roles');
      }
      
      if (missingFields.length > 0) {
        throw new Error(`Brakuje wymaganych pól: ${missingFields.join(', ')}`);
      }
      
      // Sprawdź i sformatuj datę urodzenia
      if (userData.data_urodzenia) {
        try {
          console.log('Sprawdzanie formatu daty urodzenia:', userData.data_urodzenia);
          
          // Sprawdź, czy to format YYYY.MM.DD (preferowany format)
          const yyyymmddDotsRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
          const yyyymmddDotsMatch = userData.data_urodzenia.match(yyyymmddDotsRegex);
          
          if (yyyymmddDotsMatch) {
            const year = parseInt(yyyymmddDotsMatch[1], 10);
            const month = parseInt(yyyymmddDotsMatch[2], 10);
            const day = parseInt(yyyymmddDotsMatch[3], 10);
            
            // Walidacja wartości
            if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
              console.error('Nieprawidłowe wartości daty:', day, month, year);
              throw new Error(`Nieprawidłowa data urodzenia: ${userData.data_urodzenia}`);
            }
            
            // Stwórz datę w formacie YYYY-MM-DD dla bazy danych
            const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Sprawdź, czy data jest prawidłowa (np. 30 lutego nie jest prawidłową datą)
            const checkDate = new Date(formattedDate);
            if (isNaN(checkDate.getTime()) || 
                checkDate.getFullYear() !== year || 
                checkDate.getMonth() + 1 !== month || 
                checkDate.getDate() !== day) {
              console.error('Data nie istnieje w kalendarzu:', formattedDate);
              throw new Error(`Data ${userData.data_urodzenia} nie istnieje w kalendarzu`);
            }
            
            userData.data_urodzenia = formattedDate;
            console.log('Przekształcono datę z YYYY.MM.DD na YYYY-MM-DD dla bazy:', userData.data_urodzenia);
          }
          // Sprawdź, czy to format DD.MM.YYYY
          else {
            const ddmmyyyyRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
            const ddmmyyyyMatch = userData.data_urodzenia.match(ddmmyyyyRegex);
            
            if (ddmmyyyyMatch) {
              const day = parseInt(ddmmyyyyMatch[1], 10);
              const month = parseInt(ddmmyyyyMatch[2], 10);
              const year = parseInt(ddmmyyyyMatch[3], 10);
              
              // Walidacja wartości
              if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
                console.error('Nieprawidłowe wartości daty:', day, month, year);
                throw new Error(`Nieprawidłowa data urodzenia: ${userData.data_urodzenia}`);
              }
              
              // Stwórz datę w formacie YYYY-MM-DD dla bazy danych
              const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              
              // Sprawdź, czy data jest prawidłowa (np. 30 lutego nie jest prawidłową datą)
              const checkDate = new Date(formattedDate);
              if (isNaN(checkDate.getTime()) || 
                  checkDate.getFullYear() !== year || 
                  checkDate.getMonth() + 1 !== month || 
                  checkDate.getDate() !== day) {
                console.error('Data nie istnieje w kalendarzu:', formattedDate);
                throw new Error(`Data ${userData.data_urodzenia} nie istnieje w kalendarzu`);
              }
              
              userData.data_urodzenia = formattedDate;
              console.log('Przekształcono datę z DD.MM.YYYY na YYYY-MM-DD dla bazy:', userData.data_urodzenia);
            } 
            // Sprawdź, czy to już format YYYY-MM-DD
            else {
              const iso8601Regex = /^(\d{4})-(\d{2})-(\d{2})$/;
              if (iso8601Regex.test(userData.data_urodzenia)) {
                console.log('Data już w formacie YYYY-MM-DD dla bazy:', userData.data_urodzenia);
                
                // Dodatkowe sprawdzenie, czy data jest prawidłowa
                const [year, month, day] = userData.data_urodzenia.split('-').map(Number);
                
                // Walidacja wartości
                if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
                  console.error('Nieprawidłowe wartości daty:', day, month, year);
                  throw new Error(`Nieprawidłowa data urodzenia: ${userData.data_urodzenia}`);
                }
                
                // Sprawdź, czy data faktycznie istnieje w kalendarzu
                const checkDate = new Date(userData.data_urodzenia);
                if (isNaN(checkDate.getTime()) || 
                    checkDate.getFullYear() !== year || 
                    checkDate.getMonth() + 1 !== month || 
                    checkDate.getDate() !== day) {
                  console.error('Data nie istnieje w kalendarzu:', userData.data_urodzenia);
                  throw new Error(`Data ${userData.data_urodzenia} nie istnieje w kalendarzu`);
                }
              } else {
                console.error('Nieprawidłowy format daty urodzenia:', userData.data_urodzenia);
                throw new Error(`Nieprawidłowy format daty urodzenia: ${userData.data_urodzenia}. Wymagany format: RRRR.MM.DD`);
              }
            }
          }
        } catch (error) {
          console.error('Błąd podczas formatowania daty urodzenia:', error);
          throw new Error('Nieprawidłowy format daty urodzenia. Wymagany format: RRRR.MM.DD');
        }
      }
      
      if (isEditMode) {
        // Aktualizacja istniejącego użytkownika
        console.log('Updating existing user:', editUser.id);
        console.log('Data urodzenia do aktualizacji:', userData.data_urodzenia);
        await usersApi.updateUser(editUser.id, userData);
        
        // Jeśli użytkownik ma rolę rodzica i ma przypisanych kandydatów, aktualizujemy powiązania
        if (userData.roles?.includes('rodzic') && Array.isArray(userData.przypisani_kandydaci) && userData.przypisani_kandydaci.length > 0) {
          console.log('Assigning candidates to parent:', userData.przypisani_kandydaci);
          await usersApi.assignCandidatesToParent(editUser.id, userData.przypisani_kandydaci);
        }
        
        // Jeśli użytkownik ma rolę animatora i ma przypisane grupy, aktualizujemy powiązania
        if (userData.roles?.includes('animator') && Array.isArray(userData.przypisane_grupy) && userData.przypisane_grupy.length > 0) {
          console.log('Assigning groups to animator:', userData.przypisane_grupy);
          await grupyApi.assignGrupyToAnimator(editUser.id, userData.przypisane_grupy);
        }
        
        toast.success('Użytkownik został zaktualizowany');
        console.log('User updated successfully, calling onUserAdded callback');
        onUserAdded();
        handleClose();
      } else {
        // Utworzenie nowego użytkownika
        console.log('Creating new user with data:', {
          ...userData,
          password: '******',
          data_urodzenia: userData.data_urodzenia
        });
        
        // Tworzymy obiekt danych do wysłania do API
        const apiUserData = {
          ...userData,
          // Konwersja przypisani_kandydaci i przypisane_grupy na formaty API, jeśli istnieją
          przypisani_kandydaci: undefined,
          przypisane_grupy: undefined
        };
        
        // Tworzenie użytkownika
        const userId = await usersApi.createUser(apiUserData);
        console.log('User created successfully with ID:', userId);
        
        // Jeśli użytkownik ma rolę rodzica i ma przypisanych kandydatów, dodajemy powiązania
        if (userData.roles?.includes('rodzic') && Array.isArray(userData.przypisani_kandydaci) && userData.przypisani_kandydaci.length > 0) {
          console.log('Assigning candidates to new parent:', userData.przypisani_kandydaci);
          await usersApi.assignCandidatesToParent(userId, userData.przypisani_kandydaci);
        }
        
        // Jeśli użytkownik ma rolę animatora i ma przypisane grupy, dodajemy powiązania
        if (userData.roles?.includes('animator') && Array.isArray(userData.przypisane_grupy) && userData.przypisane_grupy.length > 0) {
          console.log('Assigning groups to new animator:', userData.przypisane_grupy);
          await grupyApi.assignGrupyToAnimator(userId, userData.przypisane_grupy);
        }
        
        console.log('All assignments completed, calling onUserAdded callback');
        onUserAdded();
        handleClose();
      }
    } catch (error: any) {
      console.error('Detailed error information:', error);
      
      let errorMessage = 'Wystąpił błąd podczas zapisywania użytkownika';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error response:', error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server:', error.request);
        errorMessage = 'Brak odpowiedzi z serwera. Sprawdź połączenie internetowe.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error configuring request:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Obsługa kliknięcia poza modalem, aby go zamknąć
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-gray-800 rounded-lg shadow-lg w-full max-w-6xl flex flex-col max-h-[90vh] transition-transform duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nagłówek - zawsze widoczny */}
        <div className="sticky top-0 z-10 flex justify-between items-center bg-gray-800 rounded-t-lg p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">
            {isEditMode ? 'Edytuj użytkownika' : 'Dodaj nowego użytkownika'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors duration-200 bg-gray-700 hover:bg-gray-600 rounded-full p-2 flex items-center justify-center"
            aria-label="Zamknij"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Zawartość formularza - scrollowana */}
        <div className="overflow-auto flex-1 p-6">
          <UserForm 
            onSubmit={handleSubmit}
            onCancel={handleClose}
            initialData={editUser}
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default UserAddModal; 