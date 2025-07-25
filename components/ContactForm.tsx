
import React, { useState, useEffect, useCallback } from 'react';
import { Contact, PartialContact } from '../types';
import { parseBusinessCard, parseTextToContact } from '../services/geminiService';
import { parseVcf, parseCsv } from '../services/fileParserService';
import { IconX, IconUpload, IconSparkles, IconFileImport, IconCamera } from './icons';
import Spinner from './Spinner';
import CameraCapture from './CameraCapture';

interface ContactFormProps {
  onClose: () => void;
  onSave: (contact: Contact) => void;
  contactToEdit: Contact | null;
}

const initialFormState: PartialContact = {
  name: '',
  email: '',
  phoneWork: '',
  phoneMobile: '',
  company: '',
  title: '',
  address: '',
  website: '',
  notes: '',
  groups: [],
};

const ContactForm: React.FC<ContactFormProps> = ({ onClose, onSave, contactToEdit }) => {
  const [formData, setFormData] = useState<PartialContact>(initialFormState);
  const [isScanning, setIsScanning] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (contactToEdit) {
      setFormData(contactToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [contactToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGroupsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, groups: value.split(',').map(group => group.trim()).filter(Boolean) }));
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if(!file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
    }

    setIsScanning(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const parsedData = await parseBusinessCard(base64String, file.type);
        setFormData(prev => ({ ...prev, ...parsedData }));
      };
      reader.onerror = () => {
        throw new Error("Failed to read the image file.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during scanning.");
    } finally {
      setIsScanning(false);
    }
    // Reset file input value to allow re-uploading the same file
    e.target.value = '';
  }, []);
  
  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['vcf', 'vcard', 'csv', 'txt'].includes(extension || '')) {
        setError("Invalid file type. Please upload a .vcf, .csv, or .txt file.");
        return;
    }

    setIsParsingFile(true);
    setError(null);

    try {
      const text = await file.text();
      let parsedData: PartialContact | undefined;

      if (extension === 'vcf' || extension === 'vcard') {
          const result = parseVcf(text);
          if(result.errors.length > 0 && result.contacts.length === 0) throw new Error(result.errors[0].message);
          parsedData = result.contacts[0];
      } else if (extension === 'csv') {
           const result = parseCsv(text);
          if(result.errors.length > 0 && result.contacts.length === 0) throw new Error(result.errors[0].message);
          parsedData = result.contacts[0];
      } else { // txt file
          parsedData = await parseTextToContact(text);
      }
      
      if (parsedData) {
        setFormData(prev => ({ ...prev, ...parsedData }));
      } else {
        throw new Error("No valid contact found in the file.");
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred during parsing.";
      setError(`Failed to parse ${file.name}: ${message}`);
    } finally {
      setIsParsingFile(false);
    }
    // Reset file input
    e.target.value = '';
  }, []);

  const handleCameraCapture = useCallback(async (base64Image: string, mimeType: string) => {
    setIsScanning(true);
    setError(null);
    try {
      const parsedData = await parseBusinessCard(base64Image, mimeType);
      setFormData(prev => ({ ...prev, ...parsedData }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during scanning.");
    } finally {
      setIsScanning(false);
      setIsCameraOpen(false);
    }
  }, []);

  const openCamera = () => {
    setIsCameraOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Name is a required field.");
      return;
    }
    const contactToSave: Contact = {
      ...(contactToEdit || { id: '', createdAt: '', updatedAt: '', photoUrl: '' }),
      ...formData,
    };
    onSave(contactToSave);
  };
  
  const InputField: React.FC<{name: keyof Omit<PartialContact, 'groups' | 'notes'>, label: string, type?: string}> = ({ name, label, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={formData[name] as string || ''}
            onChange={handleChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
  );


  return (
    <div className="fixed inset-0 bg-black/70 z-30 flex items-center justify-center animate-fade-in-fast backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{contactToEdit ? 'Edit Contact' : 'Add New Contact'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <IconX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-center">{error}</div>}
          
          <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 mb-4 text-center hover:border-blue-500 transition-colors">
            {isScanning ? (
                <div className="flex flex-col items-center justify-center h-[120px]">
                    <Spinner />
                    <p className="mt-2 text-blue-400">Scanning with AI...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        Scan Business Card with AI
                        <IconSparkles className="inline-block h-5 w-5 ml-2 text-blue-400" />
                    </h3>

                    {/* Check if device has camera */}
                    {'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices ? (
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                            {/* Camera Option */}
                            <button
                                type="button"
                                onClick={openCamera}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                            >
                                <IconCamera className="h-5 w-5" />
                                <span>Take Photo</span>
                            </button>

                            {/* File Upload Option */}
                            <label htmlFor="card-upload" className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-md transition-colors cursor-pointer flex items-center justify-center space-x-2">
                                <IconUpload className="h-5 w-5" />
                                <span>Upload Image</span>
                                <input id="card-upload" name="card-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    ) : (
                        /* Fallback for devices without camera */
                        <label htmlFor="card-upload" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors cursor-pointer flex items-center space-x-2">
                            <IconUpload className="h-5 w-5" />
                            <span>Upload Business Card Image</span>
                            <input id="card-upload" name="card-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    )}

                    <p className="text-xs text-gray-500">Automatically fills the form from business card image</p>
                </div>
            )}
          </div>

          <div className="text-center mb-6">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-full border-t border-gray-700"></span>
              <span className="relative bg-gray-800 px-2 text-sm text-gray-500">OR</span>
            </div>
            {isParsingFile ? (
                <div className="flex items-center justify-center h-[40px] mt-4">
                    <Spinner />
                    <p className="ml-2 text-blue-400">Parsing file...</p>
                </div>
            ) : (
                <label htmlFor="file-import" className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-blue-400 bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors">
                    <IconFileImport className="-ml-1 mr-2 h-5 w-5" />
                    <span>Import from file</span>
                    <input id="file-import" name="file-import" type="file" className="sr-only" accept="text/vcard,.vcf,.vcard,text/csv,.csv,text/plain,.txt" onChange={handleFileImport} />
                </label>
            )}
            <p className="text-xs text-gray-500 mt-1">Accepts .vcf, .csv, or .txt files</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField name="name" label="Full Name" />
            <InputField name="email" label="Email" type="email" />
            <InputField name="phoneWork" label="Work Phone" type="tel"/>
            <InputField name="phoneMobile" label="Mobile Phone" type="tel" />
            <InputField name="company" label="Company" />
            <InputField name="title" label="Job Title" />
            <div className="md:col-span-2">
              <InputField name="address" label="Address" />
            </div>
             <div className="md:col-span-2">
              <InputField name="website" label="Website" type="url"/>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="groups" className="block text-sm font-medium text-gray-400 mb-1">Groups (comma-separated)</label>
                <input
                    type="text"
                    id="groups"
                    name="groups"
                    value={formData.groups.join(', ')}
                    onChange={handleGroupsChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-700 mt-auto bg-gray-800/50 flex justify-end space-x-3">
          <button onClick={onClose} type="button" className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors" disabled={isScanning || isParsingFile || !formData.name}>
            {isScanning ? 'Scanning...' : (isParsingFile ? 'Parsing...' : 'Save Contact')}
          </button>
        </div>
      </div>

      {/* Camera Capture for Business Cards */}
      <CameraCapture
        isOpen={isCameraOpen}
        onCapture={handleCameraCapture}
        onClose={() => setIsCameraOpen(false)}
      />
    </div>
  );
};

export default ContactForm;
