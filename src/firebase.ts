import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, onSnapshot, query, orderBy, getDocFromServer } from 'firebase/firestore';

// Load configuration from environment variables with hardcoded fallbacks
// This ensures the app works both in AI Studio and when deployed to Vercel/Netlify
// even if the firebase-applet-config.json file is not committed to the repository.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCOYwtHiAA6UnUZSskHPajpyXsexQWDuzw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0091807776.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0091807776",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0091807776.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "354081876167",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:354081876167:web:be18c08068001891b6f6e2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-79b06c49-dd9f-498e-8696-26006e56bd92"
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation Connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

// Helper functions for App.tsx
export const saveSettingsToDB = async (settings: any) => {
  const path = 'settings/global';
  try {
    await setDoc(doc(db, path), settings, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const loadSettingsFromDB = async () => {
  const path = 'settings/global';
  try {
    const docSnap = await getDoc(doc(db, path));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const addImageToDB = async (imageData: any) => {
  const path = `gallery/${Date.now()}`;
  try {
    await setDoc(doc(db, path), { ...imageData, id: path.split('/')[1] });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const deleteImageFromDB = async (imageId: string) => {
  const path = `gallery/${imageId}`;
  try {
    await deleteDoc(doc(db, path));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
};
