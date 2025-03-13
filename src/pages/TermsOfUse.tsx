import React, { useEffect } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import DocumentSection from '../components/DocumentSection'

const TermsOfUse = (): React.ReactElement => {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    // Przewiń na górę strony przy jej wczytaniu
    window.scrollTo(0, 0)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-900 text-white pt-24 pb-32 relative"
    >
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-amber-500 origin-left z-40"
        style={{ scaleX }}
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Warunki Korzystania
            </h1>
            <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full" />
          </motion.div>

          <motion.div 
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg overflow-hidden border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <DocumentSection title="1. Postanowienia ogólne" delay={0.1}>
              <p className="text-gray-300">
                Niniejsze warunki korzystania określają zasady dostępu i korzystania z serwisu bierzmowancy.pl, 
                prowadzonego przez Parafię Matki Bożej Bolesnej w Mysłowicach.
              </p>
            </DocumentSection>
            
            <DocumentSection title="2. Definicje" delay={0.2}>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>
                  <strong className="text-amber-400">Serwis</strong> - strona internetowa dostępna pod adresem bierzmowancy.pl
                </li>
                <li>
                  <strong className="text-amber-400">Użytkownik</strong> - osoba korzystająca z Serwisu
                </li>
                <li>
                  <strong className="text-amber-400">Administrator</strong> - Parafia Matki Bożej Bolesnej w Mysłowicach
                </li>
              </ul>
            </DocumentSection>
            
            <DocumentSection title="3. Zasady korzystania z serwisu" delay={0.3}>
              <p className="text-gray-300">Użytkownik zobowiązuje się do:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>Korzystania z Serwisu zgodnie z obowiązującym prawem</li>
                <li>Przestrzegania zasad kultury i dobrych obyczajów</li>
                <li>Nienaruszania praw innych użytkowników</li>
                <li>Zachowania poufności swoich danych dostępowych</li>
              </ul>
            </DocumentSection>
            
            <DocumentSection title="4. Odpowiedzialność" delay={0.4}>
              <p className="text-gray-300">
                Administrator dokłada wszelkich starań, aby Serwis funkcjonował prawidłowo, 
                jednak nie ponosi odpowiedzialności za:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>Przerwy w działaniu Serwisu wynikające z przyczyn technicznych</li>
                <li>Działania osób trzecich</li>
                <li>Skutki nieprawidłowego korzystania z Serwisu przez Użytkowników</li>
              </ul>
            </DocumentSection>
            
            <DocumentSection title="5. Prawa autorskie" delay={0.5}>
              <p className="text-gray-300">
                Wszelkie prawa do treści zamieszczonych w Serwisie, w tym prawa autorskie, 
                należą do Administratora lub podmiotów trzecich. Korzystanie z tych treści 
                wymaga zgody uprawnionych podmiotów.
              </p>
            </DocumentSection>
            
            <DocumentSection title="6. Zmiany warunków" delay={0.6}>
              <p className="text-gray-300">
                Administrator zastrzega sobie prawo do zmiany niniejszych warunków korzystania. 
                O wszelkich zmianach Użytkownicy zostaną poinformowani poprzez publikację 
                zaktualizowanej wersji na stronie Serwisu.
              </p>
            </DocumentSection>
            
            <DocumentSection title="7. Kontakt" delay={0.7}>
              <p className="text-gray-300">
                W przypadku pytań lub wątpliwości dotyczących warunków korzystania, 
                prosimy o kontakt pod adresem: {' '}
                <motion.a 
                  href="mailto:informacje@bierzmowancy.pl"
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  informacje@bierzmowancy.pl
                </motion.a>
              </p>
            </DocumentSection>
            
            <DocumentSection title="8. Data ostatniej aktualizacji" delay={0.8}>
              <p className="text-gray-300">Data ostatniej aktualizacji: 12 stycznia 2025 r.</p>
            </DocumentSection>
          </motion.div>
        </div>
      </main>
    </motion.div>
  )
}

export default TermsOfUse 