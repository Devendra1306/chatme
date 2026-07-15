import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDQrLOOJmuevuUMx_dLq2eG-Gdi7w63H4w",
  authDomain: "ajraksha-bedcb.firebaseapp.com",
  projectId: "ajraksha-bedcb",
  storageBucket: "ajraksha-bedcb.appspot.com",
  messagingSenderId: "123456789", 
  appId: "1:123456789:web:abcdef" 
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
