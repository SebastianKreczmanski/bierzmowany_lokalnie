import React, { useEffect } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import DocumentSection from '../components/DocumentSection'

const PrivacyPolicy = (): React.ReactElement => {
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
              Polityka Prywatności
            </h1>
            <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full" />
          </motion.div>

          <motion.div 
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg overflow-hidden border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <DocumentSection title="1. Informacje ogólne" delay={0.1}>
              <p className="text-gray-300">
                Niniejsza polityka prywatności opisuje zasady przetwarzania danych osobowych użytkowników witryny bierzmowancy.pl, prowadzonej przez Parafię Matki Bożej Bolesnej w Mysłowicach, ul. Gen. J. Ziętka 25, 41-412 Mysłowice.
              </p>
            </DocumentSection>
            
            <DocumentSection title="2. Dane osobowe" delay={0.2}>
              <motion.h2 
                className="font-semibold text-amber-400 mt-6"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                Administrator danych
              </motion.h2>
              <motion.p
                className="text-gray-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Administratorem danych osobowych jest Parafia Matki Bożej Bolesnej w Mysłowicach. W sprawach dotyczących danych osobowych prosimy o kontakt pod adresem e-mail: <a href="mailto:brzeczkowice@katowicka.pl" className="text-blue-300 hover:text-blue-200">brzeczkowice@katowicka.pl</a>.
              </motion.p>

              <motion.h2 
                className="font-semibold text-amber-400 mt-6"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                Zakres zbieranych danych
              </motion.h2>
              <motion.p
                className="text-gray-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Możemy zbierać następujące dane osobowe:
              </motion.p>
              <motion.ul
                className="text-gray-300 list-disc pl-5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <li>Imię i nazwisko</li>
                <li>Adres e-mail</li>
                <li>Inne dane podane dobrowolnie w formularzach kontaktowych</li>
              </motion.ul>

              <motion.h2 
                className="font-semibold text-amber-400 mt-6"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                Cel przetwarzania danych
              </motion.h2>
              <motion.p
                className="text-gray-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Dane osobowe przetwarzane są w celu:
              </motion.p>
              <motion.ul
                className="text-gray-300 list-disc pl-5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <li>Kontaktowania się z użytkownikami w sprawach związanych z przygotowaniem do sakramentu bierzmowania</li>
                <li>Odpowiedzi na zapytania przesłane za pośrednictwem formularzy kontaktowych</li>
              </motion.ul>

              <motion.h2 
                className="font-semibold text-amber-400 mt-6"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                Prawa użytkownika
              </motion.h2>
              <motion.p
                className="text-gray-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Użytkownik ma prawo do:
              </motion.p>
              <motion.ul
                className="text-gray-300 list-disc pl-5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <li>Dostępu do swoich danych</li>
                <li>Sprostowania danych</li>
                <li>Usunięcia danych</li>
                <li>Ograniczenia przetwarzania</li>
              </motion.ul>
              <motion.p
                className="text-gray-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                W celu realizacji tych praw prosimy o kontakt pod adresem: <a href="mailto:informacje@bierzmowancy.pl" className="text-blue-300 hover:text-blue-200">informacje@bierzmowancy.pl</a>.
              </motion.p>
            </DocumentSection>
            
            <DocumentSection title="3. Bezpieczeństwo danych" delay={0.3}>
              <p className="text-gray-300">
                Dokładamy wszelkich starań, aby dane osobowe były przetwarzane w sposób bezpieczny i zgodny z obowiązującymi przepisami.
              </p>
            </DocumentSection>
            
            <DocumentSection title="4. Zmiany polityki prywatności" delay={0.4}>
              <p className="text-gray-300">
                Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej polityce prywatności. Wszelkie zmiany zostaną opublikowane na tej stronie.
              </p>
            </DocumentSection>
            
            <DocumentSection title="5. Data ostatniej aktualizacji" delay={0.5}>
              <p className="text-gray-300">Data ostatniej aktualizacji: 12 stycznia 2025 r.</p>
            </DocumentSection>
          </motion.div>
        </div>
      </main>
    </motion.div>
  )
}

export default PrivacyPolicy 