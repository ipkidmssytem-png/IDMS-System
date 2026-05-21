import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDFeNEJe2QewImpIAO2lAAvAZv3MKD_YVg",
  authDomain: "idms-system.firebaseapp.com",
  projectId: "idms-system",
  storageBucket: "idms-system.firebasestorage.app",
  messagingSenderId: "238737922393",
  appId: "1:238737922393:web:abfc4aee6a05268f299448",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
             