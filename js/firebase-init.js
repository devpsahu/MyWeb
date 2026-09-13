// ---- Firebase setup ----
// 1. Go to https://console.firebase.google.com → create a project (free Spark plan is enough).
// 2. Add a Web App to the project, copy the config object it gives you, and paste it below.
// 3. In the Firebase Console enable:
//      - Authentication → Sign-in method → Email/Password
//      - Firestore Database → Create database (production mode)
//      - Storage → Get started
// 4. Create your one admin user: Authentication → Users → Add user (your email + a password).
// 5. Deploy firestore.rules and storage.rules (see README.md) so only that logged-in
//    user can write data, while everyone can read the public content.

const firebaseConfig = {
  apiKey: "AIzaSyCWDBtIucQXm9VBsqXBv9Jp2_ti-as3YQg",
  authDomain: "mywebapp-54a30.firebaseapp.com",
  projectId: "mywebapp-54a30",
  storageBucket: "mywebapp-54a30.firebasestorage.app",
  messagingSenderId: "865041236992",
  appId: "1:865041236992:web:32ad660382ec65af5704e5",
  measurementId: "G-XRKXNCXL7G"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
