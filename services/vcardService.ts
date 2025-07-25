
import { Contact } from '../types';

export const generateVCard = (contact: Contact): string => {
  const vCardParts = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `FN:${contact.name}`,
  ];

  if(contact.company) vCardParts.push(`ORG:${contact.company}`);
  if(contact.title) vCardParts.push(`TITLE:${contact.title}`);
  if(contact.email) vCardParts.push(`EMAIL:${contact.email}`);
  if(contact.phoneWork) vCardParts.push(`TEL;TYPE=work,voice:${contact.phoneWork}`);
  if(contact.phoneMobile) vCardParts.push(`TEL;TYPE=cell,voice:${contact.phoneMobile}`);
  if(contact.address) vCardParts.push(`ADR;TYPE=WORK:;;${contact.address.replace(/,/g, ';')}`);
  if(contact.website) vCardParts.push(`URL:${contact.website}`);
  if(contact.notes) vCardParts.push(`NOTE:${contact.notes}`);
  if(contact.groups && contact.groups.length > 0) vCardParts.push(`CATEGORIES:${contact.groups.join(',')}`);
  
  vCardParts.push(`REV:${new Date().toISOString()}`);
  vCardParts.push('END:VCARD');
  
  return vCardParts.join('\n');
};

export const downloadVCard = (contact: Contact): void => {
  const vCardString = generateVCard(contact);
  const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const sanitizedName = contact.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${sanitizedName}.vcf`);
  
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};