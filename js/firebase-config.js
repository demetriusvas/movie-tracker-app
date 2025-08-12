// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyALgpv8ODob2U_zH1k03_cPSp0gVTSGCPw",
  authDomain: "movie-tracker-app-840ec.firebaseapp.com",
  projectId: "movie-tracker-app-840ec",
  storageBucket: "movie-tracker-app-840ec.firebasestorage.app",
  messagingSenderId: "812051314502",
  appId: "1:812051314502:web:f1e390a0c59be54b2a5747",
  measurementId: "G-TEYD33DYGB"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Referências
const auth = firebase.auth();
const db = firebase.firestore && firebase.firestore();