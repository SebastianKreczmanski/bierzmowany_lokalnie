import React, { useEffect } from 'react';
import { grupyApi } from '../services/api';
import toast from 'react-hot-toast';
import GrupaForm from './GrupaForm';
import { IoClose } from 'react-icons/io5';

interface GrupaAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrupaAdded?: () => void;
  editGrupa?: {
    id: number;
    nazwa: string;
    animator_id: number | null;
    czlonkowie?: number[];
  } | null;
}

const GrupaAddModal: React.FC<GrupaAddModalProps> = ({
  isOpen,
  onClose,
  onGrupaAdded,
  editGrupa = null
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Blokowanie przewijania body kiedy modal jest otwarty
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Zamykanie modala po kliknięciu w tło
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Obsługa wysłania formularza
  const handleSubmit = async (grupaData: any) => {
    setIsSubmitting(true);
    
    try {
      if (editGrupa) {
        // Aktualizacja istniejącej grupy
        await grupyApi.updateGrupa(editGrupa.id, {
          nazwa: grupaData.nazwa,
          animator_id: grupaData.animator_id
        });
        
        // Aktualizacja członków grupy
        await grupyApi.updateGrupaCzlonkowie(editGrupa.id, grupaData.czlonkowie || []);
        
        toast.success('Grupa została zaktualizowana!');
      } else {
        // Tworzenie nowej grupy
        const grupaId = await grupyApi.createGrupa({
          nazwa: grupaData.nazwa,
          animator_id: grupaData.animator_id
        });
        
        // Dodawanie członków do grupy
        if (grupaData.czlonkowie && grupaData.czlonkowie.length > 0) {
          await grupyApi.updateGrupaCzlonkowie(grupaId, grupaData.czlonkowie);
        }
        
        toast.success('Grupa została utworzona!');
      }
      
      // Zamknięcie modala i odświeżenie listy grup
      onClose();
      if (onGrupaAdded) {
        onGrupaAdded();
      }
    } catch (error: any) {
      toast.error(`Błąd: ${error.message || 'Nie udało się zapisać grupy'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jeśli modal nie jest otwarty, nie renderuj niczego
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-medium text-white">
            {editGrupa ? 'Edytuj grupę' : 'Dodaj nową grupę'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
            aria-label="Zamknij"
          >
            <IoClose size={24} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <GrupaForm
            initialData={editGrupa || undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default GrupaAddModal; 