import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, type MotionProps, useScroll } from 'framer-motion'
import { HiX, HiMenu, HiLockClosed, HiUserCircle, HiShieldCheck, HiLogout, HiHome } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'

/**
 * Definicje typów dla komponentów motion z obsługą TypeScript
 * Umożliwiają użycie właściwości framer-motion wraz z standardowymi atrybutami HTML
 */
const MotionImage = motion.img as React.ComponentType<React.ImgHTMLAttributes<HTMLImageElement> & MotionProps>
const MotionH1 = motion.h1 as React.ComponentType<React.HTMLAttributes<HTMLHeadingElement> & MotionProps>
const MotionP = motion.p as React.ComponentType<React.HTMLAttributes<HTMLParagraphElement> & MotionProps>
const MotionDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & MotionProps>
const MotionA = motion.a as React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement> & MotionProps>
const MotionHeader = motion.header as React.ComponentType<React.HTMLAttributes<HTMLElement> & MotionProps>
const MotionButton = motion.button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & MotionProps>

/**
 * Komponent nagłówka aplikacji, zawierający logo, tytuł i menu hamburgerowe
 * Header jest "przyklejony" do góry ekranu i reaguje na przewijanie zmianą przezroczystości i efektem rozmycia
 */
const Header = (): React.ReactElement => {
  // Stan określający, czy menu jest otwarte
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Hook do śledzenia pozycji przewijania strony
  const { scrollY } = useScroll()

  // Hook do sprawdzania stanu uwierzytelnienia
  const { isAuthenticated, user, hasRole, logout } = useAuth()
  
  // Hook do nawigacji
  const navigate = useNavigate()

  /**
   * Funkcja obliczająca style nagłówka w zależności od pozycji przewijania
   * W miarę przewijania w dół, nagłówek staje się bardziej przezroczysty i ma większy efekt rozmycia
   * @returns Obiekt ze stylami nagłówka
   */
  const getHeaderStyles = () => {
    const scrollPos = scrollY.get()
    let opacity = 1
    let blur = 0
    let shadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    let bg = 'rgba(17, 24, 39, 1)'
    
    if (scrollPos > 0) {
      const factor = Math.min(scrollPos / 100, 1)
      opacity = 1 - (factor * 0.2) // 1 -> 0.8
      blur = factor * 8 // 0 -> 8px
      bg = `rgba(17, 24, 39, ${1 - factor * 0.15})` // 1 -> 0.85 opacity
      shadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
    }
    
    return {
      backgroundColor: bg,
      boxShadow: shadow,
      backdropFilter: `blur(${blur}px)`,
      opacity
    }
  }

  // Klasy CSS dla elementów menu
  const menuItemClasses = "block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg \
                          transition-all duration-300 font-medium tracking-wide"

  return (
    <>
      {/* Nagłówek "przyklejony" do góry ekranu */}
      <MotionHeader 
        className="fixed top-0 left-0 right-0 z-50 w-full"
        style={getHeaderStyles()}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo i tytuł - przekierowuje na stronę główną */}
            <Link to="/" className="flex items-center space-x-4 group">
              <MotionImage 
                src="/logo/logo.png" 
                alt="Logo Parafii" 
                className="h-12 w-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <div>
                <MotionH1 
                  className="text-xl font-bold"
                  whileHover={{ 
                    scale: 1.05, 
                    color: "#F59E0B" // amber-500
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 10 
                  }}
                >
                  Parafia Matki Bożej Bolesnej
                </MotionH1>
                <MotionP 
                  className="text-sm text-gray-400"
                  whileHover={{ color: "#9CA3AF" }} // gray-400 -> gray-300
                  transition={{ duration: 0.2 }}
                >
                  w Mysłowicach
                </MotionP>
                <MotionP 
                  className="text-sm text-amber-500"
                  whileHover={{ 
                    scale: 1.05,
                    textShadow: "0 0 8px rgba(245, 158, 11, 0.5)" 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  Bierzmowanie 2025
                </MotionP>
              </div>
            </Link>
            
            {/* Prawa strona nagłówka z przyciskami */}
            <div className="flex items-center space-x-3">
              {/* Przycisk "Mój profil" - widoczny tylko dla zalogowanych użytkowników */}
              {isAuthenticated && (
                <MotionButton
                  onClick={() => {
                    // Przekierowanie do odpowiedniego panelu w zależności od roli
                    if (hasRole('administrator')) {
                      navigate('/admin');
                    } else if (hasRole('duszpasterz')) {
                      navigate('/duszpasterz');
                    } else if (hasRole('kancelaria')) {
                      navigate('/kancelaria');
                    } else if (hasRole('rodzic')) {
                      navigate('/rodzic');
                    } else if (hasRole('kandydat')) {
                      navigate('/kandydat');
                    } else {
                      navigate('/');
                    }
                    
                    // Zamknij menu, jeśli jest otwarte
                    if (isMenuOpen) {
                      setIsMenuOpen(false);
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 10 
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HiUserCircle className="mr-2" size={18} />
                  <span className="hidden sm:inline">Mój profil</span>
                </MotionButton>
              )}

              {/* Przycisk logowania/wylogowania */}
              <MotionButton
                onClick={() => {
                  if (isAuthenticated) {
                    logout();
                    navigate('/');
                  } else {
                    navigate('/login');
                  }
                }}
                className="flex items-center px-4 py-2 mr-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                whileHover={{
                  scale: 1.05,
                  transition: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 10 
                  }
                }}
                whileTap={{ scale: 0.95 }}
              >
                {isAuthenticated ? (
                  <>
                    <HiLogout className="mr-2" size={18} />
                    <span className="hidden sm:inline">Wyloguj się</span>
                  </>
                ) : (
                  <>
                    <HiLockClosed className="mr-2" size={18} />
                    <span className="hidden sm:inline">Zaloguj się</span>
                  </>
                )}
              </MotionButton>

              {/* Przycisk menu hamburgerowego */}
              <MotionButton
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors relative"
                aria-label="Menu"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
              </MotionButton>
            </div>
          </div>
        </div>
      </MotionHeader>

      {/* Przyciemnione tło, widoczne gdy menu jest otwarte */}
      <AnimatePresence>
        {isMenuOpen && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel bocznego menu */}
      <motion.aside 
        className="fixed right-0 top-0 h-full w-72 bg-gray-900 shadow-xl z-50 overflow-y-auto"
        initial={{ x: '100%' }}
        animate={{ x: isMenuOpen ? 0 : '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex flex-col h-full p-6">
          {/* Nagłówek menu z przyciskiem zamykania */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Menu</h2>
            <MotionButton
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <HiX size={24} />
            </MotionButton>
          </div>

          {/* Nawigacja - ZMIENIONA KOLEJNOŚĆ */}
          <nav className="space-y-4">
            {/* Link do strony parafii */}
            <MotionA
              href="https://parafiabrzeczkowice.pl"
              target="_blank"
              rel="noopener noreferrer"
              className={menuItemClasses}
              whileHover={{ x: 8, backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
            >
              <span className="font-bold">Strona Parafii</span>
            </MotionA>
            
            {/* Separator */}
            <MotionDiv 
              className="h-0.5 bg-gradient-to-r from-transparent via-gray-600 to-transparent my-3"
              whileHover={{ scaleX: 1.1 }}
              initial={{ scaleX: 0.8, opacity: 0.5 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Sekcja uwierzytelniania i paneli */}
            {isAuthenticated ? (
              <>
                {/* Jeśli użytkownik jest zalogowany, pokaż informacje o użytkowniku */}
                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <HiUserCircle size={24} className="text-amber-500 mr-2" />
                    <span className="text-white font-medium">{user?.username}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {user?.roles?.join(', ') || 'Brak ról'}
                  </div>
                </div>
                
                {/* Link do panelu administratora (widoczny tylko dla administratorów) */}
                {hasRole('administrator') && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={menuItemClasses}
                  >
                    <MotionDiv
                      whileHover={{ x: 8 }}
                      className="w-full flex items-center"
                    >
                      <HiShieldCheck className="mr-2 text-amber-500" size={20} />
                      Panel Administratora
                    </MotionDiv>
                  </Link>
                )}
                
                {/* Link do panelu duszpasterza (widoczny tylko dla duszpasterzy) */}
                {hasRole('duszpasterz') && (
                  <Link
                    to="/duszpasterz"
                    onClick={() => setIsMenuOpen(false)}
                    className={menuItemClasses}
                  >
                    <MotionDiv
                      whileHover={{ x: 8 }}
                      className="w-full flex items-center"
                    >
                      <HiShieldCheck className="mr-2 text-amber-500" size={20} />
                      Panel Duszpasterza
                    </MotionDiv>
                  </Link>
                )}
                
                {/* Link do panelu kandydata (widoczny tylko dla kandydatów) */}
                {hasRole('kandydat') && (
                  <Link
                    to="/kandydat"
                    onClick={() => setIsMenuOpen(false)}
                    className={menuItemClasses}
                  >
                    <MotionDiv
                      whileHover={{ x: 8 }}
                      className="w-full flex items-center"
                    >
                      <HiUserCircle className="mr-2 text-amber-500" size={20} />
                      Panel Kandydata
                    </MotionDiv>
                  </Link>
                )}
              </>
            ) : (
              // Jeśli użytkownik nie jest zalogowany, pokaż link do logowania
              <Link 
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className={menuItemClasses}
              >
                <MotionDiv
                  whileHover={{ x: 8 }}
                  className="w-full flex items-center"
                >
                  <HiLockClosed className="mr-2 text-amber-500" size={20} />
                  Logowanie
                </MotionDiv>
              </Link>
            )}
            
            {/* Separator */}
            <MotionDiv 
              className="h-0.5 bg-gradient-to-r from-transparent via-gray-600 to-transparent my-3"
              whileHover={{ scaleX: 1.1 }}
              initial={{ scaleX: 0.8, opacity: 0.5 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Link do strony głównej */}
            <Link 
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={menuItemClasses}
            >
              <MotionDiv
                whileHover={{ x: 8 }}
                className="w-full flex items-center"
              >
                <HiHome className="mr-2 text-amber-500" size={20} />
                Strona główna
              </MotionDiv>
            </Link>

            {/* Link do polityki prywatności */}
            <Link 
              to="/privacy-policy"
              onClick={() => setIsMenuOpen(false)}
              className={menuItemClasses}
            >
              <MotionDiv
                whileHover={{ x: 8 }}
                className="w-full"
              >
                Polityka Prywatności
              </MotionDiv>
            </Link>

            {/* Link do warunków korzystania */}
            <Link 
              to="/terms-of-use"
              onClick={() => setIsMenuOpen(false)}
              className={menuItemClasses}
            >
              <MotionDiv
                whileHover={{ x: 8 }}
                className="w-full"
              >
                Warunki Korzystania
              </MotionDiv>
            </Link>
          </nav>

          {/* Stopka z informacją o prawach autorskich */}
          <div className="mt-auto pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 text-center">
              © 2025 ks. Sebastian Kreczmański
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Header 