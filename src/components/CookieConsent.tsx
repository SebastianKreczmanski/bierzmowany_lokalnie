import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HiX } from 'react-icons/hi'

const CookieConsent = (): React.ReactElement | null => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAcceptedCookies = localStorage.getItem('cookiesAccepted')
    if (!hasAcceptedCookies) {
      // Show the consent banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="fixed bottom-6 right-6 z-50 max-w-md bg-gray-900 rounded-xl 
                   shadow-[0_0_25px_rgba(0,0,0,0.3)] border border-gray-800 overflow-hidden"
        >
          <div className="relative p-6">
            {/* Subtle animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-50" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <motion.div
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold text-amber-400">
                    Informacja o plikach cookies
                  </h3>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <button 
                    onClick={handleAccept}
                    className="p-1 rounded-full hover:bg-gray-800 transition-colors hover:rotate-90 hover:scale-110 active:scale-90"
                  >
                    <span className="sr-only">Zamknij</span>
                    <span className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-white">
                      <HiX />
                    </span>
                  </button>
                </motion.div>
              </div>

              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-300 text-sm mb-4"
              >
                <p className="mb-2">
                  Nasza strona wykorzystuje pliki cookies do poprawy doświadczenia użytkownika 
                  oraz do celów statystycznych. Korzystając z serwisu, wyrażasz zgodę na używanie 
                  plików cookies zgodnie z aktualnymi ustawieniami przeglądarki.
                </p>
                <p>
                  Więcej informacji znajdziesz w naszej{' '}
                  <Link to="/privacy-policy" className="text-amber-400 hover:text-amber-300 font-medium underline">
                    Polityce Prywatności
                  </Link>.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative overflow-hidden rounded-lg">
                  <button
                    onClick={handleAccept}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white 
                            rounded-lg transition-all duration-300 font-medium relative overflow-hidden 
                            hover:scale-102 transform hover:shadow-[0_0_15px_rgba(217,119,6,0.5)]
                            group"
                  >
                    {/* Shine effect */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent 
                                  -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></span>
                    Akceptuję
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CookieConsent 