import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { HiMail, HiUser } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

/**
 * Komponent formularza logowania
 */
const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginType, setLoginType] = useState<'email' | 'username'>('email');
  
  const { login, isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  // Funkcja pomocnicza sprawdzająca, czy podany ciąg jest emailem
  const isEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };
  
  // Wykrywanie typu logowania na podstawie wprowadzonej wartości
  const detectLoginType = (value: string): void => {
    setLoginType(isEmail(value) ? 'email' : 'username');
  };
  
  // Przekieruj, jeśli użytkownik jest już zalogowany przy pierwszym renderowaniu
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Użytkownik już zalogowany przy montowaniu komponentu Login');
      
      // Przekieruj użytkownika na podstawie roli
      if (hasRole('administrator')) {
        console.log('Przekierowuję do /admin, bo użytkownik już zalogowany');
        navigate('/admin');
      } else if (hasRole('duszpasterz')) {
        console.log('Przekierowuję do /duszpasterz, bo użytkownik już zalogowany');
        navigate('/duszpasterz');
      } else if (hasRole('kancelaria')) {
        console.log('Przekierowuję do /kancelaria, bo użytkownik już zalogowany');
        navigate('/kancelaria');
      } else if (hasRole('rodzic')) {
        console.log('Przekierowuję do /rodzic, bo użytkownik już zalogowany');
        navigate('/rodzic');
      } else if (hasRole('kandydat')) {
        console.log('Przekierowuję do /kandydat, bo użytkownik już zalogowany');
        navigate('/kandydat');
      } else {
        console.log('Przekierowuję do strony głównej /, bo użytkownik już zalogowany');
        navigate('/');
      }
    }
  }, [isAuthenticated, user, hasRole, navigate]);
  
  // Obserwuj zmiany w obiekcie user i przekieruj po zalogowaniu
  useEffect(() => {
    if (user && isAuthenticated) {
      console.log('User data z useEffect:', user);
      console.log('Czy ma rolę administrator:', hasRole('administrator'));
      console.log('Czy ma rolę duszpasterz:', hasRole('duszpasterz'));
      console.log('Czy ma rolę kancelaria:', hasRole('kancelaria'));
      console.log('Czy ma rolę rodzic:', hasRole('rodzic'));
      console.log('Czy ma rolę kandydat:', hasRole('kandydat'));
      
      // Przekieruj użytkownika na podstawie roli
      if (hasRole('administrator')) {
        console.log('Przekierowuję do /admin z useEffect');
        navigate('/admin');
      } else if (hasRole('duszpasterz')) {
        console.log('Przekierowuję do /duszpasterz z useEffect');
        navigate('/duszpasterz');
      } else if (hasRole('kancelaria')) {
        console.log('Przekierowuję do /kancelaria z useEffect');
        navigate('/kancelaria');
      } else if (hasRole('rodzic')) {
        console.log('Przekierowuję do /rodzic z useEffect');
        navigate('/rodzic');
      } else if (hasRole('kandydat')) {
        console.log('Przekierowuję do /kandydat z useEffect');
        navigate('/kandydat');
      } else {
        console.log('Przekierowuję do strony głównej / z useEffect');
        navigate('/');
      }
    }
  }, [user, isAuthenticated, hasRole, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      setError('Wypełnij wszystkie pola formularza.');
      return;
    }
    
    try {
      setIsLoggingIn(true);
      setError(null);
      
      // Przekaż login/email do funkcji logowania
      await login(identifier, password);
      
      // Dodajemy logowanie do konsoli
      console.log('Zalogowano pomyślnie!');
      console.log('User data:', user);
      // Uwaga: Przekierowanie jest teraz obsługiwane przez useEffect
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas logowania.');
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Animacje dla komponentów
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut" 
      }
    }
  };
  
  // Jeśli użytkownik jest już zalogowany, wyświetl informacje o koncie
  if (isAuthenticated && user) {
    return (
      <div className="pt-24 pb-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-600">
          Panel Użytkownika
        </h1>
        <motion.div 
          className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Zalogowano</h2>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Username:</span> {user.username}
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold">Role:</span> {user.roles?.join(', ') || 'Brak ról'}
            </p>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Wyloguj
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Formularz logowania
  return (
    <div className="pt-24 pb-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-amber-600">
        Logowanie do Systemu
      </h1>
      <motion.div 
        className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Podaj dane logowania</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="identifier" className="block text-gray-700 font-medium mb-2">
                Email lub nazwa użytkownika
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginType === 'email' ? (
                    <HiMail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <HiUser className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    detectLoginType(e.target.value);
                  }}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  disabled={isLoggingIn}
                  placeholder={loginType === 'email' ? 'jan.kowalski@example.com' : 'jankowalski'}
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {loginType === 'email' 
                  ? 'Wpisz swój adres email, np. jan.kowalski@example.com lub nazwę użytkownika (nick), np. jan_kowalski'
                  : ''
                }
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Możesz zalogować się używając adresu email lub nazwy użytkownika (nicku).
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Hasło
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                disabled={isLoggingIn}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors disabled:bg-amber-300"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logowanie...
                </span>
              ) : (
                'Zaloguj się'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 