  const firebaseConfig = {
    apiKey: "AIzaSyCDJQKi7fpq_86mKfwmmLRkut-eQMy44Ns",
    authDomain: "ambikamber-c50b2.firebaseapp.com",
    projectId: "ambikamber-c50b2",
    storageBucket: "ambikamber-c50b2.firebasestorage.app",
    messagingSenderId: "417730230739",
    appId: "1:417730230739:web:e0b5c30e4bd79afb4fd726",
    measurementId: "G-WZ6KEX7KV6"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Collection reference for products
const productsCollection = db.collection('products');

// Export the database and collection references
const firebaseDB = {
  db,
  productsCollection
}; 
