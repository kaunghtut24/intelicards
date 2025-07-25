import React from 'react';
import { Contact } from '../types';
import ContactListItem from './ContactListItem';

interface ContactListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, selectedContact, onSelectContact, selectedIds, onToggleSelection, onToggleSelectAll }) => {
  const numSelected = selectedIds.size;
  const allSelected = contacts.length > 0 && numSelected === contacts.length;

  return (
    <div className="p-2">
      {contacts.length > 0 && (
        <div className="flex items-center p-3 mb-1 border-b border-gray-800">
            <input
                type="checkbox"
                className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
                checked={allSelected}
                onChange={onToggleSelectAll}
                title={allSelected ? "Deselect all" : "Select all visible"}
                ref={el => {
                  if (el) {
                    el.indeterminate = numSelected > 0 && !allSelected;
                  }
                }}
                aria-label={allSelected ? "Deselect all visible contacts" : "Select all visible contacts"}
            />
            <span className="ml-4 text-sm text-gray-400">
                {numSelected > 0 ? `${numSelected} selected` : 'Select contacts'}
            </span>
        </div>
      )}
      {contacts.length > 0 ? (
        <ul>
          {contacts.map(contact => (
            <ContactListItem
              key={contact.id}
              contact={contact}
              isSelectedForView={selectedContact?.id === contact.id}
              isChecked={selectedIds.has(contact.id)}
              onSelect={() => onSelectContact(contact)}
              onToggleCheck={() => onToggleSelection(contact.id)}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center p-8 text-gray-500">
            <p>No contacts found.</p>
        </div>
      )}
    </div>
  );
};

export default ContactList;