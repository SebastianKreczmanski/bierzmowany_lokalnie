import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import { UserDetails as UserDetailsType } from '../types/user';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap, FaUsers } from 'react-icons/fa';

interface UserDetailsProps {
  userId: number;
  onClose: () => void;
}

/**
 * Komponent wyświetlający szczegóły użytkownika
 */
const UserDetails: React.FC<UserDetailsProps> = ({ userId, onClose }) => {
  const [userDetails, setUserDetails] = useState<UserDetailsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pobieranie szczegółów użytkownika
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const data = await usersApi.getUserDetails(userId);
        setUserDetails(data);
        setError(null);
      } catch (err) {
        console.error('Błąd podczas pobierania szczegółów użytkownika:', err);
        setError('Nie udało się pobrać szczegółów użytkownika');
        toast.error('Nie udało się pobrać szczegółów użytkownika');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Błąd!</strong>
        <span className="block sm:inline"> {error || 'Nie udało się pobrać danych użytkownika'}</span>
        <div className="mt-3">
          <button
            onClick={onClose}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Nagłówek z podstawowymi informacjami */}
      <div className="bg-gray-700 p-6">
        <div className="flex items-center">
          <div className="bg-amber-600 rounded-full p-3 mr-4">
            <FaUser className="text-white text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {userDetails.imie} {userDetails.nazwisko}
            </h2>
            <p className="text-gray-300">@{userDetails.username}</p>
          </div>
        </div>
      </div>

      {/* Zawartość */}
      <div className="p-6 space-y-6">
        {/* Sekcja: Podstawowe informacje */}
        <div>
          <h3 className="text-lg font-medium text-amber-400 mb-3">Podstawowe informacje</h3>
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">ID użytkownika</p>
                <p className="text-gray-200">{userDetails.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Data urodzenia</p>
                <p className="text-gray-200">
                  {userDetails.data_urodzenia 
                    ? new Date(userDetails.data_urodzenia).toLocaleDateString('pl-PL') 
                    : 'Nie podano'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sekcja: Role */}
        <div>
          <h3 className="text-lg font-medium text-amber-400 mb-3">Role</h3>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {userDetails.roles.map(role => (
                <span
                  key={role}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    role === 'administrator'
                      ? 'bg-red-900 text-red-200'
                      : role === 'duszpasterz'
                      ? 'bg-purple-900 text-purple-200'
                      : role === 'kancelaria'
                      ? 'bg-blue-900 text-blue-200'
                      : role === 'animator'
                      ? 'bg-green-900 text-green-200'
                      : role === 'rodzic'
                      ? 'bg-yellow-900 text-yellow-200'
                      : role === 'swiadek'
                      ? 'bg-pink-900 text-pink-200'
                      : 'bg-gray-900 text-gray-200'
                  }`}
                >
                  <FaUsers className="mr-1" />
                  {getRoleDisplayName(role)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sekcja: Kontakt */}
        <div>
          <h3 className="text-lg font-medium text-amber-400 mb-3">Kontakt</h3>
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            {userDetails.emails && userDetails.emails.length > 0 ? (
              <div className="flex items-start">
                <FaEnvelope className="text-gray-400 mt-1 mr-2" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-gray-200">{userDetails.emails[0].email}</p>
                </div>
              </div>
            ) : null}

            {userDetails.phones && userDetails.phones.length > 0 ? (
              <div className="flex items-start">
                <FaPhone className="text-gray-400 mt-1 mr-2" />
                <div>
                  <p className="text-gray-400 text-sm">Telefon</p>
                  <p className="text-gray-200">{userDetails.phones[0].numer}</p>
                </div>
              </div>
            ) : null}

            {userDetails.adres ? (
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-gray-400 mt-1 mr-2" />
                <div>
                  <p className="text-gray-400 text-sm">Adres</p>
                  <p className="text-gray-200">
                    {userDetails.adres.ulica} {userDetails.adres.nr_budynku}
                    {userDetails.adres.nr_lokalu ? `/${userDetails.adres.nr_lokalu}` : ''}, {userDetails.adres.kod_pocztowy} {userDetails.adres.miejscowosc}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sekcja: Dane kandydata (jeśli jest kandydatem) */}
        {userDetails.uczen && (
          <div>
            <h3 className="text-lg font-medium text-amber-400 mb-3">Dane szkolne</h3>
            <div className="bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start">
                <FaGraduationCap className="text-gray-400 mt-1 mr-2" />
                <div>
                  <p className="text-gray-400 text-sm">Szkoła</p>
                  <p className="text-gray-200">{userDetails.uczen.szkola}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Klasa</p>
                  <p className="text-gray-200">{userDetails.uczen.klasa}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rok szkolny</p>
                  <p className="text-gray-200">{userDetails.uczen.rok_szkolny}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sekcja: Dane rodzica (jeśli jest rodzicem) */}
        {userDetails.rodzic && userDetails.rodzic.dzieci && userDetails.rodzic.dzieci.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-amber-400 mb-3">Dzieci</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              <ul className="space-y-2">
                {userDetails.rodzic.dzieci.map(dziecko => (
                  <li key={dziecko.id} className="flex items-center">
                    <FaUser className="text-gray-400 mr-2" />
                    <span className="text-gray-200">
                      {dziecko.imie} {dziecko.nazwisko} (ID: {dziecko.id})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Stopka z przyciskami */}
      <div className="bg-gray-700 p-4 flex justify-end">
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
};

export default UserDetails; 