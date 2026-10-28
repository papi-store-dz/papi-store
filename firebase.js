
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDG01vYc6SIca7aY-5mpszrumLo8I_rX5w",
  authDomain: "papi-store-db.firebaseapp.com",
  projectId: "papi-store-db",
  storageBucket: "papi-store-db.firebasestorage.app",
  messagingSenderId: "424889455107",
  appId: "1:424889455107:web:70aff0cd55970e775cb436"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
