import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Komponent stopki aplikacji, zawierający informacje kontaktowe,
 * linki do dokumentów oraz informację o prawach autorskich.
 * Stopka jest w pełni responsywna za pomocą klas Tailwind.
 */
const Footer = (): React.ReactElement => {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Sekcja z podziałem na kolumny (1 kolumna na małych, 12 na większych ekranach) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sekcja kontaktowa - zajmuje 8/12 kolumn na większych ekranach */}
          <div className="md:col-span-8 space-y-4">
            <h3 className="text-xl font-semibold mb-4">Kontakt</h3>
            <address className="not-italic space-y-2 text-sm sm:text-base text-gray-300">
              <p>Parafia Matki Bożej Bolesnej w Mysłowicach</p>
              <p>ul. Gen. J. Ziętka 25</p>
              <p>41-412 Mysłowice</p>
              <p>Email: <a href="mailto:informacje@bierzmowancy.pl" 
                className="text-blue-300 hover:text-blue-200 transition-colors">
                informacje@bierzmowancy.pl
              </a></p>
            </address>
          </div>
          
          {/* Sekcja dokumentów - zajmuje 4/12 kolumn na większych ekranach */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-xl font-semibold mb-4">Dokumenty</h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <Link to="/privacy-policy" className="text-blue-300 hover:text-blue-200 transition-colors">
                  Polityka Prywatności
                </Link>
              </li>
              <li>
                <Link to="/terms-of-use" className="text-blue-300 hover:text-blue-200 transition-colors">
                  Warunki Korzystania
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Prawa autorskie - zawsze na dole stopki */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>© 2025 ks. Sebastian Kreczmański. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 