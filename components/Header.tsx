
import React from 'react';
import { IconPlus, IconSearch, IconUserGroup, IconFileCsv, IconFileImport } from './icons';

interface HeaderProps {
  onAddContact: () => void;
  onSearch: (term: string) => void;
  onExportCsv: () => void;
  onImport: () => void;
  numSelected: number;
}

const Header: React.FC<HeaderProps> = ({ onAddContact, onSearch, onExportCsv, onImport, numSelected }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm h-16 flex items-center justify-between px-4 md:px-6 border-b border-gray-700 sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <IconUserGroup className="h-8 w-8 text-blue-400" />
        <h1 className="text-xl font-bold text-white hidden sm:block">CogniCard</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 flex-grow justify-end md:flex-grow-0 md:w-auto">
        <div className="relative flex-grow max-w-xs md:flex-grow-0 md:w-auto">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search contacts"
          />
        </div>
         <button
          onClick={onExportCsv}
          title={numSelected > 0 ? `Export ${numSelected} selected contacts to CSV` : "Export all to CSV"}
          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold p-2 rounded-md transition-colors duration-200 relative"
        >
          <IconFileCsv className="h-5 w-5" />
          {numSelected > 0 && (
            <span className="ml-1.5 text-xs bg-blue-600 text-white font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {numSelected}
            </span>
          )}
        </button>
        <button
          onClick={onImport}
          title="Batch Import Contacts"
          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold p-2 rounded-md transition-colors duration-200"
        >
          <IconFileImport className="h-5 w-5" />
        </button>
        <button
          onClick={onAddContact}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition-colors duration-200"
        >
          <IconPlus className="h-5 w-5" />
          <span className="hidden sm:inline">Add</span>
          <span className="hidden md:inline">Contact</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
