import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Event } from '../services/api';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { FaCalendar, FaUsers, FaUserTag, FaInfoCircle, FaClock, FaExclamationTriangle, FaTag, FaMapMarkerAlt } from 'react-icons/fa';

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
  
  // Check if all roles are present (1-6 which represent all user roles)
  const roleIdArray = roleIds.split(',').map(id => id.trim());
  const allRoleIds = ['1', '2', '3', '4', '5', '6'];
  const hasAllRoles = allRoleIds.every(roleId => roleIdArray.includes(roleId));
  
  if (hasAllRoles) {
    return 'Wszyscy';
  }
  
  return roleIdArray
    .map(id => roles[id] || `Rola ${id}`)
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
  // Add custom CSS for bg-gray-850
  useEffect(() => {
    // Create a style element for custom colors
    const styleEl = document.createElement('style');
    
    // Add the custom bg-gray-850 class
    styleEl.textContent = `
      .bg-gray-850 {
        background-color: #1a1d23;
      }
    `;
    
    // Append to document head
    document.head.appendChild(styleEl);
    
    // Clean up function
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-gray-800 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden border border-amber-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
          <h2 className="text-xl font-semibold text-amber-400">
            Szczegóły wydarzenia
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* Event title with color indicator */}
          <div className="mb-6 flex items-start">
            <span
              className="w-5 h-5 rounded-full mt-1.5 mr-3 flex-shrink-0 shadow-lg shadow-amber-500/20"
              style={{ backgroundColor: event.typ?.kolor || '#4B5563' }}
            ></span>
            <h3 className="text-2xl font-bold text-white">{event.nazwa}</h3>
          </div>
          
          {/* Main content card with enhanced styling */}
          <div className="bg-gray-850 rounded-lg p-5 shadow-lg mb-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="flex flex-col space-y-5">
                <div className="flex items-start">
                  <FaTag className="text-amber-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-amber-300 text-sm font-medium mb-1">Zapraszamy na</div>
                    <div className="text-white text-lg">{event.typ?.nazwa || 'Nieokreślony'}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCalendar className="text-amber-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-amber-300 text-sm font-medium mb-1">Data rozpoczęcia</div>
                    <div className="text-white">{formatDateTime(event.data_rozpoczecia)}</div>
                  </div>
                </div>
                
                {event.data_zakonczenia && (
                  <div className="flex items-start">
                    <FaClock className="text-amber-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <div className="text-amber-300 text-sm font-medium mb-1">Data zakończenia</div>
                      <div className="text-white">{formatDateTime(event.data_zakonczenia)}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right column */}
              <div className="flex flex-col space-y-5">
                <div className="flex items-start">
                  <FaUserTag className="text-amber-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-amber-300 text-sm font-medium mb-1">Dla kogo</div>
                    <div className="text-white text-lg">{getRoleNames(event.dlaroli)}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-amber-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-amber-300 text-sm font-medium mb-1">Grupa</div>
                    <div className="text-white">{formatGroupName(event.dlagrupy)}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaExclamationTriangle className={`${event.obowiazkowe ? 'text-red-500' : 'text-gray-500'} mt-1 mr-3 flex-shrink-0`} />
                  <div>
                    <div className="text-amber-300 text-sm font-medium mb-1">Obowiązkowe</div>
                    <div className="text-white">
                      {event.obowiazkowe ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-200">
                          Tak
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                          Nie
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Description section */}
          {event.opis && (
            <div className="mt-6 bg-gray-850 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center mb-3">
                <FaInfoCircle className="text-amber-400 mr-2" />
                <h4 className="text-lg font-medium text-amber-300">Opis</h4>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap bg-gray-800/50 p-4 rounded-md">
                {event.opis}
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-lg"
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