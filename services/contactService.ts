
import { Contact, PartialContact } from '../types';

const CONTACTS_KEY = 'cognicard_contacts';

const getDomainFromContact = (contact: Pick<PartialContact, 'website' | 'email'>): string | null => {
    try {
        if (contact.website) {
            const urlString = contact.website.trim();
            if (urlString) {
                const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
                const hostname = url.hostname;
                return hostname.replace(/^www\./, '');
            }
        }
        if (contact.email) {
            const emailDomain = contact.email.split('@')[1];
            if (emailDomain) {
                return emailDomain;
            }
        }
    } catch (error) {
        console.warn("Could not parse domain from contact", { website: contact.website, email: contact.email, error });
        return null;
    }
    return null;
};

const generatePhotoUrl = (contact: Pick<PartialContact, 'name' | 'website' | 'email'>): string => {
    const domain = getDomainFromContact(contact);
    if (domain) {
        return `https://logo.clearbit.com/${domain}`;
    }
    return `https://picsum.photos/seed/${encodeURIComponent(contact.name)}/200`;
};

export const getContacts = (): Contact[] => {
  try {
    const contactsJson = localStorage.getItem(CONTACTS_KEY);
    if (!contactsJson) return [];
    const contacts = JSON.parse(contactsJson) as Contact[];
    // Sort contacts by name
    return contacts.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to parse contacts from localStorage", error);
    return [];
  }
};

export const saveContact = (contact: Contact): Contact => {
  const contacts = getContacts();
  const now = new Date().toISOString();
  let savedContact: Contact;
  
  // If the photoUrl is a base64 data URL (from upload), keep it.
  // Otherwise, regenerate it based on company/website info.
  let photoUrlToSave = contact.photoUrl;
  if (!photoUrlToSave || !photoUrlToSave.startsWith('data:image')) {
    photoUrlToSave = generatePhotoUrl(contact);
  }

  if (contact.id) {
    // Update existing contact
    const index = contacts.findIndex(c => c.id === contact.id);
    savedContact = { ...contact, updatedAt: now, photoUrl: photoUrlToSave };
    if (index !== -1) {
      contacts[index] = savedContact;
    } else {
        // If not found, treat as new.
        savedContact.id = crypto.randomUUID();
        savedContact.createdAt = now;
        contacts.push(savedContact);
    }
  } else {
    // Create new contact
    savedContact = { ...contact, id: crypto.randomUUID(), createdAt: now, updatedAt: now, photoUrl: photoUrlToSave };
    contacts.push(savedContact);
  }

  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  return savedContact;
};

export const saveMultipleContacts = (newContacts: PartialContact[]): void => {
  if (newContacts.length === 0) return;
  const contacts = getContacts();
  const now = new Date().toISOString();
  
  const contactsToSave: Contact[] = newContacts.map(contact => ({
    ...initialContactFromPartial(contact),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    photoUrl: generatePhotoUrl(contact), 
  }));

  const updatedContacts = [...contacts, ...contactsToSave];
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
};

// Helper to ensure a partial contact has all keys of a full Contact
const initialContactFromPartial = (partial: PartialContact): Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'photoUrl'> => {
  return {
    name: partial.name || '',
    email: partial.email || '',
    phoneWork: partial.phoneWork || '',
    phoneMobile: partial.phoneMobile || '',
    company: partial.company || '',
    title: partial.title || '',
    address: partial.address || '',
    website: partial.website || '',
    notes: partial.notes || '',
    groups: partial.groups || [],
  }
}

export const getContactById = (id: string): Contact | undefined => {
  const contacts = getContacts();
  return contacts.find(c => c.id === id);
};

export const deleteContact = (id: string): void => {
  let contacts = getContacts();
  contacts = contacts.filter(c => c.id !== id);
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
};
