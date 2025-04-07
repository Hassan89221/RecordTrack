// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWge62vhwLphZOaaZo10o2wxxkRYZ6Y7o",
  authDomain: "bm-milk-shop.firebaseapp.com",
  databaseURL: "https://bm-milk-shop-default-rtdb.firebaseio.com",
  projectId: "bm-milk-shop",
  storageBucket: "bm-milk-shop.firebasestorage.app",
  messagingSenderId: "911684504039",
  appId: "1:911684504039:web:9542c3cf2792d755269542",
};
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage),
// });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
