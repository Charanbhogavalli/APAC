import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  onSnapshot,
  deleteField
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { Participant, LocalSessionProfile } from '../types';

const COLLECTION_NAME = 'participants';
const SESSION_STORAGE_KEY = 'apac_rural_connect_session_v1';

// Client session storage helpers
export function getLocalSession(): LocalSessionProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSessionProfile;
  } catch {
    return null;
  }
}

export function saveLocalSession(session: LocalSessionProfile): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Unable to persist session to localStorage', err);
  }
}

export function clearLocalSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Unable to clear session from localStorage', err);
  }
}

export function generateProfileId(name: string): string {
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const rand = Math.random().toString(36).substring(2, 8);
  return cleanName ? `${cleanName}-${rand}` : `delegate-${rand}`;
}

export function generateEditToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const cryptoObj = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(32);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < values.length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

/**
 * Fetch all participants from Firestore
 */
export async function fetchParticipants(): Promise<Participant[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Participant[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Participant;
      list.push(data);
    });
    // Sort descending by creation date
    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
  }
}

/**
 * Subscribe to real-time updates for participants directory
 */
export function subscribeParticipants(
  onData: (participants: Participant[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    collection(db, COLLECTION_NAME),
    (snapshot) => {
      const list: Participant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Participant;
        list.push(data);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  );
}

/**
 * Fetch single participant by profileId
 */
export async function fetchParticipantById(profileId: string): Promise<Participant | null> {
  if (!profileId) return null;
  const path = `${COLLECTION_NAME}/${profileId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, profileId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data() as Participant;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * Clean data for setDoc: omit any fields that are undefined, null, or empty string.
 * Ensures Firestore only stores fields that actually exist and never encounters undefined.
 */
export function sanitizeCreatePayload<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Clean data for updateDoc: converts undefined, null, or empty strings to deleteField()
 * if the field previously existed in the document, or omits it completely so Firestore never encounters undefined.
 */
export function sanitizeUpdatePayload(
  updates: Record<string, unknown>,
  existingDocData: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    if (isEmpty) {
      if (key in existingDocData) {
        payload[key] = deleteField();
      }
    } else {
      payload[key] = value;
    }
  }

  return payload;
}

/**
 * Save new participant to Firestore
 */
export async function createParticipant(data: Participant): Promise<Participant> {
  const path = `${COLLECTION_NAME}/${data.profileId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, data.profileId);
    const sanitized = sanitizeCreatePayload(data as unknown as Record<string, unknown>);
    await setDoc(docRef, sanitized);
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Update existing participant in Firestore
 */
export async function updateParticipant(
  profileId: string, 
  editToken: string, 
  updates: Partial<Participant>
): Promise<void> {
  const path = `${COLLECTION_NAME}/${profileId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, profileId);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      throw new Error('Profile does not exist.');
    }
    const currentData = existing.data() as Participant;
    if (currentData.editToken && currentData.editToken !== editToken) {
      throw new Error('Unauthorized: Invalid edit token for this profile.');
    }

    const payload = sanitizeUpdatePayload(
      {
        ...updates,
        updatedAt: new Date().toISOString(),
        editToken, // Must supply matching editToken as enforced by firestore.rules
      },
      currentData as unknown as Record<string, unknown>
    );

    await updateDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Helper to compress image in browser to WebP/JPEG under 200KB
 */
export async function compressImageToDataUrl(file: Blob | File, maxWidth = 500, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Try webp then jpeg
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload profile photo to Firebase Storage with automatic fallback
 */
export async function uploadProfilePhoto(fileOrBlob: File | Blob, profileId: string): Promise<string> {
  try {
    // Attempt Firebase Storage first
    const fileExt = (fileOrBlob instanceof File && fileOrBlob.name.split('.').pop()) || 'jpg';
    const storagePath = `participants/${profileId}/avatar_${Date.now()}.${fileExt}`;
    const fileRef = ref(storage, storagePath);
    
    // We upload with a 15-second timeout safeguard
    const uploadTask = uploadBytesResumable(fileRef, fileOrBlob, {
      contentType: fileOrBlob.type || 'image/jpeg',
    });

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Storage upload timed out'));
      }, 12000);

      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        async () => {
          clearTimeout(timeout);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });

    return downloadUrl;
  } catch (storageError) {
    console.warn('Firebase Storage upload failed or restricted, falling back to optimized inline format:', storageError);
    // Reliable fallback: optimized client data URL
    const optimized = await compressImageToDataUrl(fileOrBlob, 480, 0.82);
    return optimized;
  }
}
