import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';

export interface Item {
  id: number;
  nazwa: string;
  miejscowosc_id?: number;
  [key: string]: any;
}

interface SearchableDropdownProps {
  items: Item[];
  placeholder: string;
  selectedItemId: number | null;
  onSelect: (item: Item | null) => void;
  onCreateNew: (name: string) => Promise<Item>;
  isLoading?: boolean;
  disabled?: boolean;
  createNewLabel?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  items,
  placeholder,
  selectedItemId,
  onSelect,
  onCreateNew,
  isLoading = false,
  disabled = false,
  createNewLabel = "Dodaj nowy"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>(items);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update filtered items when search term or items change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      setFilteredItems(
        items.filter(item => 
          item.nazwa.toLowerCase().includes(lowercasedTerm)
        )
      );
    }
  }, [searchTerm, items]);

  // Set selected item when selectedItemId changes
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(item => item.id === selectedItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [selectedItemId, items]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    onSelect(item);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateNew = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setIsCreating(true);
      const newItem = await onCreateNew(searchTerm.trim());
      handleSelectItem(newItem);
    } catch (error) {
      console.error("Error creating new item:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setSelectedItem(null);
    onSelect(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={selectedItem ? selectedItem.nazwa : placeholder}
          value={isOpen ? searchTerm : selectedItem?.nazwa || ''}
          onChange={handleSearchChange}
          onClick={handleInputClick}
          disabled={disabled || isLoading || isCreating}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {selectedItem && !isOpen && (
            <button
              type="button"
              className="text-gray-400 hover:text-white"
              onClick={handleClear}
              disabled={disabled || isLoading || isCreating}
            >
              ×
            </button>
          )}
          <span className="text-gray-400">
            {isLoading || isCreating ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaSearch />
            )}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div 
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-700"
              onClick={handleCreateNew}
              role="option"
            >
              <span className="text-amber-400">{createNewLabel} "{searchTerm}"</span>
              <FaPlus className="text-amber-400" />
            </div>
          ) : (
            <>
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-700 ${selectedItem?.id === item.id ? 'bg-gray-700' : ''}`}
                  onClick={() => handleSelectItem(item)}
                  role="option"
                >
                  {item.nazwa}
                </div>
              ))}
              
              {searchTerm.trim() !== '' && !filteredItems.some(item => 
                item.nazwa.toLowerCase() === searchTerm.trim().toLowerCase()
              ) && (
                <div 
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-700 border-t border-gray-600"
                  onClick={handleCreateNew}
                  role="option"
                >
                  <span className="text-amber-400">{createNewLabel} "{searchTerm}"</span>
                  <FaPlus className="text-amber-400" />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown; 