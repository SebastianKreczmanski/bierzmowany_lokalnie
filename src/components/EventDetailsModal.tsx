import React from 'react';
import { motion } from 'framer-motion';
import { Event } from '../services/api';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { FaCalendar, FaUsers, FaUserTag, FaInfoCircle, FaClock, FaExclamationTriangle, FaTag } from 'react-icons/fa';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

/**
 * Format date with time if available
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'd MMMM yyyy, HH:mm', { locale: pl });
};

/**
 * Get role names from comma-separated role IDs
 */
const getRoleNames = (roleIds: string): string => {
  if (!roleIds) return 'Wszyscy';
  
  // Handle 'wszystkie' as a special case
  if (roleIds.includes('wszystkie')) return 'Wszyscy';
  
  const roles: Record<string, string> = {
    '1': 'Administrator',
    '2': 'Duszpasterz',
    '3': 'Kancelaria',
    '4': 'Animator',
    '5': 'Rodzic',
    '6': 'Kandydat',
    '7': 'Świadek'
  };
  
  return roleIds.split(',')
    .map(id => roles[id.trim()] || `Rola ${id}`)
    .join(', ');
};

/**
 * Format group name for display
 */
const formatGroupName = (groupName: string): string => {
  if (!groupName || groupName === 'wszystkie') return 'Wszyscy';
  
  return groupName;
};

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  event 
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-gray-800 w-full max-w-2xl rounded-lg shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-amber-400">
            Szczegóły wydarzenia
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 flex items-start">
            <span
              className="w-4 h-4 rounded-full mt-1 mr-2 flex-shrink-0"
              style={{ backgroundColor: event.typ?.kolor || '#4B5563' }}
            ></span>
            <h3 className="text-2xl font-bold text-white">{event.nazwa}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <FaTag className="text-amber-400 mr-3" />
                <div>
                  <div className="text-gray-400 text-sm">Typ wydarzenia</div>
                  <div className="text-white">{event.typ?.nazwa || 'Nieokreślony'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <FaCalendar className="text-amber-400 mr-3" />
                <div>
                  <div className="text-gray-400 text-sm">Data rozpoczęcia</div>
                  <div className="text-white">{formatDateTime(event.data_rozpoczecia)}</div>
                </div>
              </div>
              
              {event.data_zakonczenia && (
                <div className="flex items-center">
                  <FaClock className="text-amber-400 mr-3" />
                  <div>
                    <div className="text-gray-400 text-sm">Data zakończenia</div>
                    <div className="text-white">{formatDateTime(event.data_zakonczenia)}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <FaExclamationTriangle className={`${event.obowiazkowe ? 'text-red-500' : 'text-gray-500'} mr-3`} />
                <div>
                  <div className="text-gray-400 text-sm">Obowiązkowe</div>
                  <div className="text-white">{event.obowiazkowe ? 'Tak' : 'Nie'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <FaUserTag className="text-amber-400 mr-3" />
                <div>
                  <div className="text-gray-400 text-sm">Role</div>
                  <div className="text-white">{getRoleNames(event.dlaroli)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <FaUsers className="text-amber-400 mr-3" />
                <div>
                  <div className="text-gray-400 text-sm">Grupa</div>
                  <div className="text-white">{formatGroupName(event.dlagrupy)}</div>
                </div>
              </div>
            </div>
          </div>
          
          {event.opis && (
            <div className="mt-6">
              <div className="flex items-center mb-2">
                <FaInfoCircle className="text-amber-400 mr-2" />
                <h4 className="text-lg font-medium text-gray-300">Opis</h4>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap bg-gray-750 p-4 rounded-md">
                {event.opis}
              </p>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Zamknij
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EventDetailsModal; 