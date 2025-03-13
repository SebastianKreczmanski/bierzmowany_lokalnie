import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import Header from './components/Header'
import Footer from './components/Footer'
import Countdown from './components/Countdown'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfUse from './pages/TermsOfUse'
import CookieConsent from './components/CookieConsent'
import Login from './components/Login'
import Admin from './pages/Admin'
import Duszpasterz from './pages/Duszpasterz'
import Kandydat from './pages/Kandydat'
import Kancelaria from './pages/Kancelaria'
import Rodzic from './pages/Rodzic'
import KandydatManagement from './components/KandydatManagement'
import { AuthProvider } from './contexts/AuthContext'

/**
 * Główny komponent aplikacji, odpowiedzialny za:
 * - Konfigurację routingu aplikacji
 * - Renderowanie nagłówka, stopki i komponentu zgody na pliki cookie
 * - Animacje przejść między stronami
 */
const App = (): React.ReactElement => {
  // Pobieranie aktualnej lokalizacji dla animacji przejść między stronami
  const location = useLocation()

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Nagłówek - widoczny na wszystkich stronach */}
        <Header />
        
        {/* Toaster do wyświetlania powiadomień */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {/* Only show the icon if it's not null (we set null for session expired) */}
                  {icon !== null && icon}
                  {message}
                  {t.type !== 'loading' && (
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="ml-4 text-white hover:text-gray-200 transition-transform hover:scale-125 focus:outline-none"
                      aria-label="Zamknij"
                    >
                      <span className="transform hover:rotate-90 inline-block transition-transform duration-300">✕</span>
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>

        {/* Główna zawartość strony */}
        <main className="flex-grow">
          {/* Obsługa animacji przejść między stronami */}
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Strona główna z odliczaniem */}
              <Route path="/" element={<Countdown />} />
              
              {/* Strona z polityką prywatności */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Strona z warunkami korzystania */}
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              
              {/* Strona logowania */}
              <Route path="/login" element={<Login />} />
              
              {/* Strona administratora */}
              <Route path="/admin" element={<Admin />} />
              
              {/* Strona duszpasterza */}
              <Route path="/duszpasterz" element={<Duszpasterz />} />
              
              {/* Strona kandydata */}
              <Route path="/kandydat" element={<Kandydat />} />
              
              {/* Strona zarządzania danymi kandydata */}
              <Route path="/kandydat/management/:id" element={<KandydatManagement />} />
              
              {/* Strona pracownika kancelarii */}
              <Route path="/kancelaria" element={<Kancelaria />} />
              
              {/* Strona rodzica */}
              <Route path="/rodzic" element={<Rodzic />} />
            </Routes>
          </AnimatePresence>
        </main>
        
        {/* Stopka - widoczna na wszystkich stronach */}
        <Footer />
        
        {/* Zgoda na pliki cookie */}
        <CookieConsent />
      </div>
    </AuthProvider>
  )
}

export default App 