
import { Contact } from '../types';

const escapeCsvField = (field: string | string[]) => {
    if (field === null || field === undefined) {
        return '';
    }
    const stringField = Array.isArray(field) ? field.join(';') : String(field);
    
    // If field contains a comma, newline, or double quote, wrap it in double quotes.
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
        // Also, double up any existing double quotes.
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const exportContactsToCsv = (contacts: Contact[]) => {
    if (contacts.length === 0) {
        alert("No contacts to export.");
        return;
    }

    const headers: (keyof Contact)[] = [
        'id', 'name', 'email', 'phoneWork', 'phoneMobile', 'company', 
        'title', 'address', 'website', 'notes', 'groups', 
        'createdAt', 'updatedAt'
    ];
    
    const csvRows = [headers.join(',')]; // Header row

    contacts.forEach(contact => {
        const row = headers.map(header => {
            return escapeCsvField(contact[header]);
        });
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cognicard_contacts.csv');
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};