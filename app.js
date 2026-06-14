import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIyGEBhM4UWhyS4bm8yLoSFKdVVNzcPQY",
  authDomain: "overdrive-market.firebaseapp.com",
  projectId: "overdrive-market",
  storageBucket: "overdrive-market.firebasestorage.app",
  messagingSenderId: "213364020052",
  appId: "1:213364020052:web:33d3e4fa353ed08112aec1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.createRoom = async function () {
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", roomCode), {
    createdAt: Date.now(),
    cash: 1000000,
    players: []
  });

  document.getElementById("roomDisplay").textContent = roomCode;

  alert("Room Created: " + roomCode);
};

window.joinRoom = async function () {
  const roomCode =
    document.getElementById("roomCode").value.toUpperCase();

  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room not found");
    return;
  }

  document.getElementById("roomDisplay").textContent = roomCode;

  alert("Joined room " + roomCode);
};

window.buy = function(stock){
  alert("Buying " + stock + " (trading engine coming next)");
};
