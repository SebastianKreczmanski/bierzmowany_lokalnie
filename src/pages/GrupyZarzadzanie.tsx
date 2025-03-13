import React, { useState } from 'react';
import GrupyList from '../components/GrupyList';
import GrupaDetails from '../components/GrupaDetails';
import { Helmet } from 'react-helmet';

const GrupyZarzadzanie: React.FC = () => {
  // Stan wybranej grupy do wyświetlenia szczegółów
  const [selectedGrupaId, setSelectedGrupaId] = useState<number | null>(null);
  
  // Funkcja obsługująca kliknięcie w przycisk szczegółów grupy
  const handleViewGrupaDetails = (grupa: any) => {
    setSelectedGrupaId(grupa.id);
  };
  
  // Funkcja zamykająca szczegóły grupy
  const handleCloseGrupaDetails = () => {
    setSelectedGrupaId(null);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Zarządzanie grupami formacyjnymi | Bierzmowańcy</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold text-amber-500 mb-6">
        Zarządzanie grupami formacyjnymi
      </h1>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Jeśli grupa jest wybrana, pokazujemy jej szczegóły */}
        {selectedGrupaId ? (
          <div className="bg-gray-850 rounded-lg shadow-lg overflow-hidden">
            <GrupaDetails 
              grupaId={selectedGrupaId}
              onClose={handleCloseGrupaDetails}
            />
          </div>
        ) : (
          // W przeciwnym razie pokazujemy listę grup
          <GrupyList onViewDetails={handleViewGrupaDetails} />
        )}
      </div>
    </div>
  );
};

export default GrupyZarzadzanie; 