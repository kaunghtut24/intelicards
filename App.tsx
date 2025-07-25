
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Contact, PartialContact } from './types';
import * as contactService from './services/contactService';
import * as vcardService from './services/vcardService';
import { exportContactsToCsv } from './services/csvService';
import Header from './components/Header';
import ContactList from './components/ContactList';
import ContactDetail from './components/ContactDetail';
import ContactForm from './components/ContactForm';
import GroupList from './components/GroupList';
import BatchImportModal from './components/BatchImportModal';
import { IconUsers } from './components/icons';

const App: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadContacts = useCallback(() => {
    const allContacts = contactService.getContacts();
    setContacts(allContacts);
    if (selectedContact) {
      const updatedSelected = allContacts.find(c => c.id === selectedContact.id) || null;
      setSelectedContact(updatedSelected);
    }
  }, [selectedContact]);

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenForm = (contact: Contact | null = null) => {
    setContactToEdit(contact);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setContactToEdit(null);
  };

  const handleSaveContact = (contact: Contact) => {
    const savedContact = contactService.saveContact(contact);
    loadContacts();
    handleCloseForm();
    setSelectedContact(savedContact);
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      contactService.deleteContact(id);
      setSelectedIds(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(id);
        return newSelection;
      });
      if (selectedContact?.id === id) {
        const remainingContacts = contactService.getContacts();
        // On desktop, select the next contact. On mobile, go back to the list.
        if (window.innerWidth >= 768) {
            setSelectedContact(remainingContacts.length > 0 ? remainingContacts[0] : null);
        } else {
            setSelectedContact(null);
        }
      }
      loadContacts();
    }
  };
  
  const handleExportVCard = (contact: Contact) => {
    vcardService.downloadVCard(contact);
  };

  const handleExportCsv = () => {
    const contactsToExport = selectedIds.size > 0
        ? contacts.filter(c => selectedIds.has(c.id))
        : contacts;
    exportContactsToCsv(contactsToExport);
  };

  const handleOpenImportModal = () => setIsImportModalOpen(true);
  const handleCloseImportModal = () => setIsImportModalOpen(false);

  const handleBatchImport = (importedContacts: PartialContact[]) => {
      contactService.saveMultipleContacts(importedContacts);
      loadContacts();
      handleCloseImportModal();
  };

  const handleBatchDelete = () => {
    const numSelected = selectedIds.size;
    if (numSelected === 0) return;

    const confirmMessage = numSelected === 1
      ? 'Are you sure you want to delete this contact?'
      : `Are you sure you want to delete ${numSelected} contacts?`;

    if (window.confirm(confirmMessage)) {
      const idsToDelete = Array.from(selectedIds);
      contactService.deleteMultipleContacts(idsToDelete);

      // Clear selection
      setSelectedIds(new Set());

      // If the currently selected contact was deleted, clear it
      if (selectedContact && selectedIds.has(selectedContact.id)) {
        const remainingContacts = contactService.getContacts();
        // On desktop, select the next contact. On mobile, go back to the list.
        if (window.innerWidth >= 768) {
          setSelectedContact(remainingContacts.length > 0 ? remainingContacts[0] : null);
        } else {
          setSelectedContact(null);
        }
      }

      loadContacts();
    }
  };
  
  const { allGroups, groupCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const groups = new Set<string>();
    
    contacts.forEach(contact => {
      contact.groups.forEach(group => {
        if (group) {
          groups.add(group);
          counts[group] = (counts[group] || 0) + 1;
        }
      });
    });

    return {
      allGroups: Array.from(groups).sort(),
      groupCounts: counts,
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => contacts.filter(contact => {
    const isInGroup = selectedGroup ? contact.groups.includes(selectedGroup) : true;
    if (!isInGroup) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.company.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.groups.some(group => group.toLowerCase().includes(searchLower))
    );
  }), [contacts, selectedGroup, searchTerm]);
  
  useEffect(() => {
    // If a contact is selected, ensure it's still in the filtered list.
    const isSelectedContactVisible = filteredContacts.some(c => c.id === selectedContact?.id);
    if (!isSelectedContactVisible) {
        // Auto-select the first contact in the new filtered list on desktop
        if (window.innerWidth >= 768) {
            setSelectedContact(filteredContacts.length > 0 ? filteredContacts[0] : null);
        } else {
            setSelectedContact(null);
        }
    }
    // Also clear multi-selection when filter changes
    setSelectedIds(new Set());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredContacts]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };
  
  const handleBackToList = () => {
    setSelectedContact(null);
  };
  
  const handleSelectGroup = (group: string | null) => {
    setSelectedGroup(group);
    if (window.innerWidth < 768) {
      setSelectedContact(null); // On mobile, viewing a group takes you to the list view
    }
  };

  const handleToggleSelection = (contactId: string) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(contactId)) {
        newSelection.delete(contactId);
      } else {
        newSelection.add(contactId);
      }
      return newSelection;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      const allFilteredIds = new Set(filteredContacts.map(c => c.id));
      setSelectedIds(allFilteredIds);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header onAddContact={() => handleOpenForm()} onSearch={setSearchTerm} onExportCsv={handleExportCsv} onImport={handleOpenImportModal} onBatchDelete={handleBatchDelete} numSelected={selectedIds.size} />
      
      <main className="flex h-[calc(100vh-64px)]">
        <aside className={`w-full md:w-1/3 md:flex flex-col border-r border-gray-700 overflow-y-auto ${selectedContact ? 'hidden md:block' : 'block'}`}>
          <GroupList
            groups={allGroups}
            groupCounts={groupCounts}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
            totalContacts={contacts.length}
          />
          <ContactList
            contacts={filteredContacts}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onToggleSelectAll={handleToggleSelectAll}
          />
        </aside>

        <section className={`w-full md:w-2/3 overflow-y-auto p-4 md:p-8 ${selectedContact ? 'block' : 'hidden md:block'}`}>
          {selectedContact ? (
            <ContactDetail
              contact={selectedContact}
              onEdit={() => handleOpenForm(selectedContact)}
              onDelete={handleDeleteContact}
              onExport={handleExportVCard}
              onBack={handleBackToList}
              onUpdate={loadContacts}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-500">
              <IconUsers className="w-24 h-24 mb-4" />
              <h2 className="text-2xl font-bold">No Contact Selected</h2>
              <p className="mt-2">
                {selectedGroup 
                  ? `Select a contact from the "${selectedGroup}" group.`
                  : 'Select a contact from the list or add a new one.'
                }
              </p>
            </div>
          )}
        </section>
      </main>

      {isFormOpen && (
        <ContactForm
          onClose={handleCloseForm}
          onSave={handleSaveContact}
          contactToEdit={contactToEdit}
        />
      )}

      {isImportModalOpen && (
        <BatchImportModal
            onClose={handleCloseImportModal}
            onImport={handleBatchImport}
        />
      )}
    </div>
  );
};

export default App;
