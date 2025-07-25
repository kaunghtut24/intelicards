
import React from 'react';
import { Contact } from '../types';
import ContactPhoto from './ContactPhoto';

interface ContactListItemProps {
  contact: Contact;
  isSelectedForView: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
}

const ContactListItem: React.FC<ContactListItemProps> = ({ contact, isSelectedForView, isChecked, onSelect, onToggleCheck }) => {
  return (
    <li
      onClick={onSelect}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
        isSelectedForView ? 'bg-blue-600/30' : 'hover:bg-gray-700/50'
      } ${isChecked && !isSelectedForView ? 'bg-gray-700/60' : ''}`}
      aria-selected={isSelectedForView}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggleCheck}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500 mr-4 flex-shrink-0"
        aria-label={`Select ${contact.name}`}
      />
      <ContactPhoto
        contact={contact}
        className="h-10 w-10 rounded-full object-cover mr-4 flex-shrink-0"
      />
      <div className="truncate">
        <p className={`font-semibold truncate ${isSelectedForView ? 'text-white' : 'text-gray-200'}`}>{contact.name}</p>
        <p className={`text-sm truncate ${isSelectedForView ? 'text-gray-300' : 'text-gray-400'}`}>{contact.company}</p>
      </div>
    </li>
  );
};

export default ContactListItem;
