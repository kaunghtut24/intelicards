
export interface Contact {
  id: string;
  name: string;
  email: string;
  phoneWork: string;
  phoneMobile: string;
  company: string;
  title: string;
  address: string;
  website: string;
  notes: string;
  groups: string[];
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type PartialContact = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'photoUrl'>;