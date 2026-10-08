export type ContactFieldKey = 'phone' | 'whatsapp' | 'email' | 'linkedin' | 'website' | 'instagram';

export type ContactVisibility = Record<ContactFieldKey, 'public' | 'private'>;

export interface Participant {
  profileId: string;
  name: string;
  ideaName: string;
  organization: string;
  country: string;
  role: string;
  photoUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  linkedin?: string;
  website?: string;
  instagram?: string;
  expertise: string[];
  bio?: string;
  visibility: ContactVisibility;
  editToken?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ViewState = 
  | { type: 'home' }
  | { type: 'explore' }
  | { type: 'create' }
  | { type: 'my-profile' }
  | { type: 'participant'; profileId: string }
  | { type: 'qr'; profileId?: string };

export interface LocalSessionProfile {
  profileId: string;
  editToken: string;
  name: string;
}
