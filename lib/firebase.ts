import { initializeApp, getApps } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, signInAnonymously, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyD4czZIYhnyiqQk58OnhY1KGbFOVkiByHY",
  authDomain: "roomly-demo.firebaseapp.com",
  projectId: "roomly-demo",
  storageBucket: "roomly-demo.firebasestorage.app",
  messagingSenderId: "609400114579",
  appId: "1:609400114579:web:9d3f46abb1df9d85a8ec66",
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
