
import React, { useState } from 'react';
import { Contact } from '../types';
import { 
    IconPencil, IconTrash, IconDownload, IconMail, IconPhone, IconBuilding, 
    IconBriefcase, IconLocation, IconNote, IconArrowLeft, IconMessage, 
    IconWorld, IconSparkles, IconX, IconCamera, IconLinkedin, IconTwitter, IconGithub, IconFolder
} from './icons';
import { getContactIntel } from '../services/geminiService';
import type { IntelData } from '../services/geminiService';
import Spinner from './Spinner';
import ContactPhoto from './ContactPhoto';
import * as contactService from '../services/contactService';

interface ContactDetailProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onExport: (contact: Contact) => void;
  onBack: () => void;
  onUpdate: () => void;
}

type EmbedType = 'linkedin' | 'twitter' | 'github' | 'news' | 'blog' | 'other';

const EmbedCard: React.FC<{ type: EmbedType; url: string; title: string }> = ({ type, url, title }) => {
    let IconComponent: React.FC<{className?: string}>;
    let typeColorClass: string;
    let typeLabel: string;

    switch (type) {
        case 'linkedin':
            IconComponent = IconLinkedin;
            typeColorClass = 'text-white bg-[#0077b5]'; // LinkedIn blue
            typeLabel = 'LinkedIn';
            break;
        case 'twitter':
            IconComponent = IconTwitter;
            typeColorClass = 'text-white bg-black';
            typeLabel = 'X / Twitter';
            break;
        case 'github':
            IconComponent = IconGithub;
            typeColorClass = 'text-white bg-[#181717]';
            typeLabel = 'GitHub';
            break;
        case 'blog':
            IconComponent = IconNote;
            typeColorClass = 'text-gray-900 bg-yellow-400';
            typeLabel = 'Blog/Article';
            break;
        case 'news':
            IconComponent = IconWorld;
            typeColorClass = 'text-white bg-green-600';
            typeLabel = 'News';
            break;
        default:
            IconComponent = IconWorld;
            typeColorClass = 'bg-gray-600 text-white';
            typeLabel = 'Website';
            break;
    }

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-900/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700 space-x-4"
        >
            <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md ${typeColorClass}`}>
                 <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-grow truncate">
                <p className="font-semibold text-white truncate" title={title}>{title || 'Untitled Page'}</p>
                <p className="text-sm text-blue-400 hover:underline truncate" title={url}>{url}</p>
            </div>
            <div className="flex-shrink-0 text-xs text-gray-500 font-mono hidden sm:block">
                {typeLabel}
            </div>
        </a>
    );
};


const IntelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    data: IntelData | null;
    contactName: string;
}> = ({ isOpen, onClose, isLoading, error, data, contactName }) => {
    if (!isOpen) return null;

    const categorizeUrl = (url: string): EmbedType => {
        try {
            const hostname = new URL(url).hostname.replace(/^www\./, '');
            if (hostname.includes('linkedin.com')) return 'linkedin';
            if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
            if (hostname.includes('github.com')) return 'github';
            if (['forbes.com', 'techcrunch.com', 'wsj.com', 'nytimes.com', 'bloomberg.com', 'reuters.com'].includes(hostname)) return 'news';
            if (['medium.com', 'dev.to'].includes(hostname) || url.includes('/blog/')) return 'blog';
        } catch (e) {
            // Invalid URL, fall through to 'other'
        }
        return 'other';
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center animate-fade-in-fast backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <IconSparkles className="h-6 w-6 mr-3 text-blue-400" />
                        AI Intel for {contactName}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <IconX className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-48">
                            <Spinner />
                            <p className="mt-4 text-gray-400">Researching contact... this may take a moment.</p>
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">
                            <p className="font-semibold">Research Failed</p>
                            <p className="mt-1 text-sm">{error}</p>
                        </div>
                    )}
                    {data && !isLoading && (
                         <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{data.summary}</p>

                            {data.sources.length > 0 && (
                                <>
                                <h3 className="text-lg font-semibold text-white mt-6 mb-3 border-t border-gray-700 pt-4">Online Presence & Sources</h3>
                                <div className="space-y-3">
                                    {data.sources.map((source, index) => (
                                        <EmbedCard
                                            key={index}
                                            url={source.uri}
                                            title={source.title}
                                            type={categorizeUrl(source.uri)}
                                        />
                                    ))}
                                </div>
                                </>
                            )}
                         </div>
                    )}
                </div>
                 <div className="p-4 border-t border-gray-700 mt-auto bg-gray-800/50 flex justify-end">
                    <button onClick={onClose} type="button" className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode; isLink?: boolean; href?: string }> = ({ icon, label, value, isLink, href }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    const content = isLink ? (
        <a href={href} className="text-blue-400 hover:underline break-words" target="_blank" rel="noopener noreferrer">
            {value}
        </a>
    ) : (
        <span className="text-gray-300 break-words">{value}</span>
    );
    
    return (
        <div className="flex items-start py-3">
            <div className="text-gray-400 w-8 mr-4 flex-shrink-0 pt-1">{icon}</div>
            <div className="flex-grow">
                <p className="text-sm text-gray-500">{label}</p>
                {content}
            </div>
        </div>
    );
};

const ActionButton: React.FC<{href: string; icon: React.ReactNode; label: string}> = ({ href, icon, label}) => (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label} className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300 space-y-1 w-20">
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </a>
);


const ContactDetail: React.FC<ContactDetailProps> = ({ contact, onEdit, onDelete, onExport, onBack, onUpdate }) => {
  const websiteUrl = contact.website && !contact.website.startsWith('http') ? `https://` + contact.website : contact.website;
  const [isIntelModalOpen, setIsIntelModalOpen] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [intelData, setIntelData] = useState<IntelData | null>(null);
  const [intelError, setIntelError] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file (e.g., PNG, JPG, GIF).");
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        try {
            const newPhotoUrl = reader.result as string;
            const updatedContact = { ...contact, photoUrl: newPhotoUrl };
            contactService.saveContact(updatedContact);
            onUpdate();
        } catch (error) {
            console.error("Error saving contact photo:", error);
            alert("There was an error saving the new photo.");
        }
    };
    reader.onerror = () => {
        console.error("Failed to read the selected file.");
        alert("There was an error reading the selected file.");
    };
  };

  const handleGetIntel = async () => {
      setIsIntelModalOpen(true);
      setIsResearching(true);
      setIntelError(null);
      setIntelData(null);

      try {
          const data = await getContactIntel(contact.name, contact.company);
          setIntelData(data);
      } catch (err) {
          setIntelError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
          setIsResearching(false);
      }
  };

  const handleCloseIntelModal = () => {
      setIsIntelModalOpen(false);
  };
  
  return (
    <>
    <div className="animate-fade-in h-full">
      <button onClick={onBack} className="md:hidden flex items-center space-x-2 text-blue-400 hover:underline mb-4">
          <IconArrowLeft className="h-5 w-5" />
          <span>All Contacts</span>
      </button>

      <div className="flex flex-col md:flex-row items-start mb-6">
        <div className="relative group flex-shrink-0">
            <ContactPhoto
                contact={contact}
                className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover mr-8 mb-4 md:mb-0 border-4 border-gray-700"
            />
            <label
                htmlFor="photo-upload"
                className="absolute inset-0 h-28 w-28 md:h-32 md:w-32 mr-8 mb-4 md:mb-0 rounded-full bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
                <IconCamera className="h-8 w-8 text-white" />
                <span className="sr-only">Change photo</span>
            </label>
            <input
                type="file"
                id="photo-upload"
                onChange={handlePhotoChange}
                className="sr-only"
                accept="image/*"
            />
        </div>
        <div className="flex-grow">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">{contact.name}</h2>
          {contact.title && (
            <p className="text-lg md:text-xl text-gray-400 mt-2 flex items-center">
              <IconBriefcase className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" />
              <span>{contact.title}</span>
            </p>
          )}
          {contact.company && (
            <p className="text-base md:text-lg text-gray-300 mt-1 flex items-center">
              <IconBuilding className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" />
              <span>{contact.company}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {contact.phoneWork && <ActionButton href={`tel:${contact.phoneWork}`} icon={<IconPhone className="h-6 w-6"/>} label="Call Work"/>}
        {contact.phoneMobile && <ActionButton href={`tel:${contact.phoneMobile}`} icon={<IconPhone className="h-6 w-6"/>} label="Call Mobile"/>}
        {contact.phoneMobile && <ActionButton href={`sms:${contact.phoneMobile}`} icon={<IconMessage className="h-6 w-6"/>} label="Message"/>}
        {contact.email && <ActionButton href={`mailto:${contact.email}`} icon={<IconMail className="h-6 w-6"/>} label="Email"/>}
        {contact.address && <ActionButton href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`} icon={<IconLocation className="h-6 w-6"/>} label="Map"/>}
        {contact.website && <ActionButton href={websiteUrl} icon={<IconWorld className="h-6 w-6"/>} label="Website"/>}
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2 border-b border-gray-700 pb-3 flex justify-between items-center">
            <span>Details</span>
            <div className="flex space-x-2">
                <button onClick={handleGetIntel} title="AI Intel" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors duration-200">
                    <IconSparkles className="h-5 w-5" />
                </button>
                <button onClick={onEdit} title="Edit" className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors duration-200">
                    <IconPencil className="h-5 w-5" />
                </button>
                <button onClick={() => onExport(contact)} title="Export vCard" className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors duration-200">
                    <IconDownload className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(contact.id)} title="Delete" className="bg-gray-700 hover:bg-red-800/50 text-white p-2 rounded-full transition-colors duration-200">
                    <IconTrash className="h-5 w-5" />
                </button>
            </div>
        </h3>
        <div className="divide-y divide-gray-700">
            <DetailRow icon={<IconMail className="h-6 w-6"/>} label="Email" value={contact.email} isLink href={`mailto:${contact.email}`} />
            <DetailRow icon={<IconPhone className="h-6 w-6"/>} label="Work Phone" value={contact.phoneWork} isLink href={`tel:${contact.phoneWork}`} />
            <DetailRow icon={<IconPhone className="h-6 w-6"/>} label="Mobile Phone" value={contact.phoneMobile} isLink href={`tel:${contact.phoneMobile}`} />
            <DetailRow icon={<IconWorld className="h-6 w-6"/>} label="Website" value={contact.website} isLink href={websiteUrl} />
            <DetailRow icon={<IconLocation className="h-6 w-6"/>} label="Address" value={contact.address} />
            <DetailRow icon={<IconNote className="h-6 w-6"/>} label="Notes" value={contact.notes ? <span className="whitespace-pre-wrap">{contact.notes}</span> : null} />
            <DetailRow icon={<IconFolder className="h-6 w-6"/>} label="Groups" value={contact.groups.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                    {contact.groups.map(group => (
                        <span key={group} className="bg-blue-900/50 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">{group}</span>
                    ))}
                </div>
            ) : null}/>
        </div>
      </div>
    </div>

    <IntelModal 
        isOpen={isIntelModalOpen}
        onClose={handleCloseIntelModal}
        isLoading={isResearching}
        error={intelError}
        data={intelData}
        contactName={contact.name}
    />
    </>
  );
};

export default ContactDetail;