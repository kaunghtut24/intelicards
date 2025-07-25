
import { PartialContact } from '../types';

interface ParseResult {
    contacts: PartialContact[];
    errors: { message: string, rowIndex: number }[];
}

const parseSingleVcf = (vcfString: string): PartialContact => {
    const contact: PartialContact = {
        name: '', email: '', phoneWork: '', phoneMobile: '',
        company: '', title: '', address: '', website: '', notes: '', groups: []
    };

    const lines = vcfString.split(/\r\n|\r|\n/);

    lines.forEach(line => {
        if (line.startsWith('FN:')) contact.name = line.substring(3).trim();
        else if (line.startsWith('FN;')) contact.name = line.split(':').slice(1).join(':').trim(); // Handles FN;CHARSET=...
        else if (line.includes('EMAIL')) contact.email = line.split(':').slice(1).join(':').trim();
        else if (line.includes('TEL;')) {
            const value = line.split(':').slice(1).join(':').trim();
            if (line.includes('TYPE=work') || line.includes('TYPE=office')) {
                contact.phoneWork = value;
            } else if (line.includes('TYPE=cell') || line.includes('TYPE=mobile')) {
                contact.phoneMobile = value;
            } else if (!contact.phoneWork) { // Fallback for generic TEL
                contact.phoneWork = value;
            }
        }
        else if (line.startsWith('ORG:')) contact.company = line.substring(4).trim();
        else if (line.startsWith('TITLE:')) contact.title = line.substring(6).trim();
        else if (line.startsWith('URL:')) contact.website = line.substring(4).trim();
        else if (line.startsWith('NOTE:')) contact.notes = line.substring(5).trim();
        else if (line.startsWith('ADR;')) {
            const parts = line.split(':').slice(1).join(':').split(';').map(p => p.trim());
            contact.address = parts.slice(2).filter(Boolean).join(', '); 
        }
        else if (line.startsWith('CATEGORIES:')) contact.groups = line.substring(11).split(',').map(t => t.trim());
    });

    if (!contact.name) {
        throw new Error("VCF entry does not contain a name (FN field).");
    }

    return contact;
}

export const parseVcf = (vcfString: string): ParseResult => {
    const result: ParseResult = { contacts: [], errors: [] };
    const vcardEntries = vcfString.split('BEGIN:VCARD').slice(1);

    if (vcardEntries.length === 0 && vcfString.trim() !== '') {
        result.errors.push({ message: "File does not appear to be a valid VCF.", rowIndex: 0 });
        return result;
    }

    vcardEntries.forEach((entry, index) => {
        const vcardText = 'BEGIN:VCARD\n' + entry;
        try {
            const contact = parseSingleVcf(vcardText);
            result.contacts.push(contact);
        } catch(e) {
            const message = e instanceof Error ? e.message : "Unknown error parsing VCF entry.";
            result.errors.push({ message, rowIndex: index + 1 });
        }
    });

    return result;
};


export const parseCsv = (csvString: string): ParseResult => {
    const result: ParseResult = { contacts: [], errors: [] };
    const lines = csvString.trim().split(/\r\n|\r|\n/);
    if (lines.length < 2) {
        if(lines.length > 0 && lines[0].trim() !== '') {
            result.errors.push({ message: "CSV file must contain a header row and at least one data row.", rowIndex: 0 });
        }
        return result;
    }
    
    // Naive CSV split, doesn't handle quotes with commas inside well.
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        try {
            const values = line.split(',');
            const contactData: { [key: string]: any } = {};
            headers.forEach((header, index) => {
                if (values[index]) {
                    contactData[header] = values[index].trim();
                }
            });

            const contact: PartialContact = {
                name: contactData.name || '',
                email: contactData.email || '',
                phoneWork: contactData.phonework || contactData['phone work'] || '',
                phoneMobile: contactData.phonemobile || contactData['phone mobile'] || '',
                company: contactData.company || '',
                title: contactData.title || '',
                address: contactData.address || '',
                website: contactData.website || '',
                notes: contactData.notes || '',
                groups: contactData.groups ? String(contactData.groups).split(';').map(t => t.trim()) : [],
            };

            if (!contact.name) {
                throw new Error("Row does not contain a 'name' or the name is empty.");
            }
            result.contacts.push(contact);

        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to parse row.";
            result.errors.push({ message, rowIndex: i + 1 });
        }
    }
    
    return result;
};
