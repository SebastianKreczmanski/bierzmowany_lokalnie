import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BishopSection from './BishopSection'

/**
 * Interfejs reprezentujący pozostały czas do docelowej daty
 */
interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Główny komponent strony startowej, zawierający informację o sakramencie,
 * sekcję z informacjami o biskupie oraz licznik odliczający czas
 * do sakramentu bierzmowania
 */
const Countdown = (): React.ReactElement => {
  // Referencje dla sekcji - używane tylko do animacji wejścia
  const welcomeRef = useRef<HTMLDivElement>(null)
  const countdownRef = useRef<HTMLDivElement>(null)
  const countdownContainerRef = useRef<HTMLDivElement>(null)

  // Stan przechowujący pozostały czas do wydarzenia
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Stan do obsługi efektu hover na liczniku
  const [isHovered, setIsHovered] = useState(false)

  // Efekt pobierający aktualny czas i obliczający pozostały czas
  useEffect(() => {
    // Ustawiamy docelową datę na sobotę, 21 czerwca 2025, godz. 14:00
    const targetDate = new Date('2025-06-21T14:00:00')

    /**
     * Funkcja obliczająca pozostały czas do docelowej daty
     * i aktualizująca stan komponentu
     */
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        // Jeśli data już minęła, pokazujemy zera
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        })
      }
    }

    // Wywołanie funkcji i ustawienie interwału do cyklicznego odświeżania
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000) // Aktualizacja co minutę zamiast co sekundę
    
    // Czyszczenie interwału przy odmontowaniu komponentu
    return () => clearInterval(timer)
  }, [])

  /**
   * Funkcja zwracająca odpowiednią formę gramatyczną jednostki czasu w języku polskim
   * @param number Liczba jednostek czasu (dni, godzin, minut, sekund)
   * @param forms Tablica trzech form gramatycznych (np. ['dzień', 'dni', 'dni'])
   * @returns Odpowiednia forma gramatyczna
   */
  const getPolishLabel = (number: number, forms: [string, string, string]) => {
    const n = Math.abs(number)
    if (n === 1) return forms[0]
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return forms[1]
    return forms[2]
  }

  return (
    <>
      {/* Sekcja z informacją zachęcającą */}
      <motion.div
        ref={welcomeRef}
        className="w-full bg-gray-900 pt-28 md:pt-32 pb-8 px-4 sm:px-6 relative overflow-hidden"
      >
        {/* Bez tła - jednolity kolor tła z klasy bg-gray-900 wyżej */}

        <motion.div
          className="container mx-auto text-center max-w-4xl relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Przygotowanie do bierzmowania
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
            Zapraszamy do wspólnego przeżycia drogi przygotowania do przyjęcia sakramentu bierzmowania.
            Dołącz do nas na tej ważnej duchowej podróży!
          </p>
        </motion.div>
      </motion.div>

      {/* Sekcja z informacją o biskupie */}
      <BishopSection />

      {/* Sekcja z licznikiem odliczającym czas do bierzmowania */}
      <motion.div
        ref={countdownRef}
        className="min-h-[50vh] flex flex-col items-center justify-center px-4 sm:px-6 py-16 md:py-24 bg-gray-900 relative overflow-hidden"
      >
        {/* Bez gradientu - jednolity kolor tła z klasy bg-gray-900 wyżej */}

        <motion.div
          className="text-center mb-8 md:mb-12 max-w-3xl relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
            Sakrament bierzmowania będzie udzielony w sobotę, 21 czerwca 2025 r. o godz. 14:00
          </p>
        </motion.div>

        {/* Licznik z animacjami */}
        <motion.div
          ref={countdownContainerRef}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl
                   relative overflow-hidden border border-gray-800 w-full max-w-4xl mx-auto z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: 1.02 }}
        >
          {/* Animacja efektu shine przy najechaniu */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gray-800/0 via-gray-700/10 to-gray-800/0"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                exit={{ x: '100%' }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
            )}
          </AnimatePresence>

          <motion.h2
            className="text-xl sm:text-2xl font-medium text-center mb-8 md:mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Do sakramentu bierzmowania pozostało:
          </motion.h2>

          {/* Grid z jednostkami czasu - tylko dni, godziny i minuty */}
          <div className="grid grid-cols-3 gap-3 sm:gap-8 md:gap-12">
            {[
              { value: timeLeft.days, labels: ['dzień', 'dni', 'dni'] },
              { value: timeLeft.hours, labels: ['godzina', 'godziny', 'godzin'] },
              { value: timeLeft.minutes, labels: ['minuta', 'minuty', 'minut'] }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="relative inline-block">
                  {/* Wartość liczbowa */}
                  <div className="text-3xl sm:text-4xl md:text-6xl font-bold tabular-nums bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
                    {item.value.toString().padStart(2, '0')}
                  </div>
                  {/* Etykieta (dzień/dni, godzina/godziny/godzin, itd.) */}
                  <div className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-400">
                    {getPolishLabel(item.value, item.labels as [string, string, string])}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pulsujący wskaźnik */}
          <motion.div
            className="absolute bottom-4 right-4 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
              boxShadow: [
                '0 0 0 0 rgba(245, 158, 11, 0.4)',
                '0 0 0 10px rgba(245, 158, 11, 0)',
                '0 0 0 0 rgba(245, 158, 11, 0.4)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </motion.div>
    </>
  )
}

export default Countdown 