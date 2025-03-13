import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

/**
 * Komponent prezentujący informacje o biskupie, który będzie udzielał sakramentu bierzmowania.
 * Zawiera zdjęcie, imię i nazwisko oraz biogram biskupa.
 * Zawiera animacje pojawiania się elementów przy wejściu w widok oraz efekty hover.
 */
const BishopSection = (): React.ReactElement => {
  // Konfiguracja obserwacji widoczności sekcji do animacji
  const [ref, inView] = useInView({
    triggerOnce: false, // Animacja uruchamia się przy każdym wejściu w widok
    threshold: 0.2, // Animacja uruchamia się gdy 20% elementu jest widoczne
    rootMargin: "-50px 0px" // Mały offset, aby animacja uruchamiała się nieco wcześniej
  })

  return (
    <motion.section
      ref={ref}
      className="relative py-12 md:py-20 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Tło z efektem rozmycia */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(/backgrounds/cathedral.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(12px)'
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Nagłówek sekcji z animacją hover */}
        <motion.div
          className="text-center mb-8 md:mb-16"
          initial={{ y: 20, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4 inline-block"
            whileHover={{ 
              color: "#F59E0B", // amber-500
              textShadow: "0 0 8px rgba(245, 158, 11, 0.4)" 
            }}
            transition={{ duration: 0.3 }}
          >
            Szafarz Bierzmowania
          </motion.h2>
          
          <motion.div 
            className="w-24 h-1 bg-amber-400 mx-auto rounded-full"
            whileHover={{ 
              scaleX: 1.5, 
              backgroundColor: "#FBBF24", // amber-400 jaśniejszy
              boxShadow: "0 0 10px rgba(245, 158, 11, 0.6)" 
            }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>

        {/* Zawartość sekcji - zdjęcie i opis */}
        <div className="flex flex-col lg:flex-row items-start gap-8 md:gap-12 max-w-7xl mx-auto">
          {/* Zdjęcie biskupa z efektami */}
          <motion.div
            className="w-full lg:w-1/3 relative group mb-8 lg:mb-0"
            initial={{ x: -50, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl h-full">
              <img
                src="/biskup/wodarczyk.jpg"
                alt="Biskup Adam Wodarczyk"
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                style={{ minHeight: '350px', maxHeight: '500px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Efekt błysku przy najechaniu */}
              <div
                className="absolute inset-0 bg-white/30 translate-x-[-100%] skew-x-12 group-hover:translate-x-[100%] pointer-events-none transition-transform duration-1000"
              />
            </div>
          </motion.div>

          {/* Informacje o biskupie */}
          <motion.div
            className="w-full lg:w-2/3"
            initial={{ x: 50, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Stylizowany tytuł z efektem 3D */}
            <motion.div
              className="mb-6 md:mb-8 perspective-1000"
              initial={{ rotateX: -90 }}
              animate={inView ? { rotateX: 0 } : { rotateX: -90 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="relative transform-gpu group cursor-default">
                {/* Tło z gradientem */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg transform-gpu -skew-x-12 group-hover:skew-x-0 transition-transform duration-300 opacity-75"
                  style={{
                    backdropFilter: 'blur(8px)',
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
                  }}
                />

                {/* Główny kontener */}
                <div
                  className="relative bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-lg p-4 md:p-6 transform-gpu hover:scale-105 transition-all duration-300 shadow-2xl border border-gray-700/50"
                  style={{
                    boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)'
                  }}
                >
                  <h3
                    className="text-2xl md:text-3xl font-bold text-white tracking-wider"
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    bp Adam Wodarczyk
                  </h3>

                  {/* Podkreślenie */}
                  <div
                    className="w-24 h-0.5 bg-amber-400/50 mt-2 transform-gpu group-hover:scale-x-150 transition-all duration-300"
                    style={{
                      boxShadow: '0 0 10px rgba(217,119,6,0.5)'
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Opis biskupa */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-white/10">
              <div className="prose prose-lg max-w-none prose-invert">
                <p className="text-gray-300 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
                  Biskup Adam Wodarczyk, biskup pomocniczy i wikariusz generalny archidiecezji katowickiej, urodził się 3 stycznia 1968 r. w Tarnowskich Górach.
                  Święcenia kapłańskie przyjął w 1994 r., a w 2014 r. został mianowany biskupem pomocniczym katowickim.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
                  Przez wiele lat związany z Ruchem Światło-Życie jako animator, moderator i moderator generalny.
                  Jest postulatorem procesu beatyfikacyjnego ks. Franciszka Blachnickiego i angażuje się w nową ewangelizację.
                  W archidiecezji katowickiej odpowiada m.in. za życie konsekrowane oraz ruchy i stowarzyszenia katolickie.
                </p>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                  W Konferencji Episkopatu Polski działa w Radzie ds. Kultury i Ochrony Dziedzictwa Kulturowego,
                  Radzie ds. Rodziny i Zespole ds. Nowej Ewangelizacji. Jest również delegatem KEP ds. Ruchów i Stowarzyszeń Katolickich.
                  Honorowy obywatel Tarnowskich Gór.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

export default BishopSection 