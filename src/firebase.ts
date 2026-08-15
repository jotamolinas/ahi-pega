import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDerTOkrcgL_mMVD7UMLuvf5P3CQmnfJtc",
  authDomain: "ahi-pega.firebaseapp.com",
  projectId: "ahi-pega",
  storageBucket: "ahi-pega.firebasestorage.app",
  messagingSenderId: "746424557823",
  appId: "1:746424557823:web:aef1aeb9c4e7c59c0f6cca",
  measurementId: "G-RSY50033PN"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

