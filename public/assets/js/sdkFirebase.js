// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLH-i2Flzbyj9RzQfXfs9P2wExWxt4EQ0",
  authDomain: "matheus-bonotto.firebaseapp.com",
  projectId: "matheus-bonotto",
  storageBucket: "matheus-bonotto.appspot.com",
  messagingSenderId: "631615517217",
  appId: "1:631615517217:web:cdee8b4ea273d15a596960",
  measurementId: "G-1X9X6K7R71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


/* iniciar cli server 
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
*/