
import React, { useState, useEffect } from 'react';
import type { Contact } from '../types';

interface ContactPhotoProps {
  contact: Contact;
  className?: string;
}

const ContactPhoto: React.FC<ContactPhotoProps> = ({ contact, className }) => {
  const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(contact.name)}/200`;
  const [imageSrc, setImageSrc] = useState(contact.photoUrl);
  
  // Update image src if contact prop changes
  useEffect(() => {
    if (contact.photoUrl) {
      setImageSrc(contact.photoUrl);
    } else {
      setImageSrc(fallbackUrl);
    }
  }, [contact.photoUrl, fallbackUrl]);
  
  const handleError = () => {
    // If the primary URL (e.g., from Clearbit) fails, use the fallback
    if (imageSrc !== fallbackUrl) {
      setImageSrc(fallbackUrl);
    }
  };
  
  return (
    <img
      src={imageSrc}
      alt={contact.name}
      className={className}
      onError={handleError}
    />
  );
};

export default ContactPhoto;
