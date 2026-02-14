import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 지연 초기화 (빌드 시 초기화 방지)
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop: string) {
    if (!_auth) _auth = getAuth(getApp());
    return (_auth as AnyRecord)[prop];
  },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_, prop: string) {
    if (!_db) _db = getFirestore(getApp());
    return (_db as AnyRecord)[prop];
  },
});

export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_, prop: string) {
    if (!_storage) _storage = getStorage(getApp());
    return (_storage as AnyRecord)[prop];
  },
});

// eslint-disable-next-line import/no-anonymous-default-export
const appProxy: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_, prop: string) {
    return (getApp() as AnyRecord)[prop];
  },
});
export default appProxy;
