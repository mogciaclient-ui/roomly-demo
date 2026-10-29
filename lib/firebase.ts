import { initializeApp, getApps } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, signInAnonymously, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

let guestSignIn: Promise<User> | null = null;

export async function getGuestUser() {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  if (!guestSignIn) {
    guestSignIn = setPersistence(auth, browserLocalPersistence)
      .then(() => signInAnonymously(auth))
      .then((credential) => credential.user)
      .finally(() => { guestSignIn = null; });
  }
  return guestSignIn;
}
