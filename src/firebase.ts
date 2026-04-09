import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

// Presence logic
const SESSION_ID = Math.random().toString(36).substring(2, 15);
const presenceDocRef = doc(db, 'presence', SESSION_ID);

export const startPresence = () => {
  const updatePresence = async () => {
    try {
      await setDoc(presenceDocRef, {
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      // Silent fail for presence to avoid interrupting user experience
      console.warn('Presence update failed');
    }
  };

  updatePresence();
  const interval = setInterval(updatePresence, 60000); // Every minute

  // Cleanup on window close
  window.addEventListener('beforeunload', () => {
    deleteDoc(presenceDocRef).catch(() => {});
  });

  return () => {
    clearInterval(interval);
    deleteDoc(presenceDocRef).catch(() => {});
  };
};

export const incrementMonthlyVisitors = async () => {
  const visitorDocRef = doc(db, 'stats', 'visitors');
  const sessionKey = `voted_${new Date().toISOString().slice(0, 7)}`; // Monthly key
  
  if (localStorage.getItem(sessionKey)) return;

  try {
    const docSnap = await getDoc(visitorDocRef);
    if (!docSnap.exists()) {
      await setDoc(visitorDocRef, {
        monthlyCount: 1,
        lastReset: new Date().toISOString()
      });
    } else {
      await updateDoc(visitorDocRef, {
        monthlyCount: increment(1)
      });
    }
    localStorage.setItem(sessionKey, 'true');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'stats/visitors');
  }
};
