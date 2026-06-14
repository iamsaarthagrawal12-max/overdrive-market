import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
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

let currentRoom = null;
let myRole = "host";

const STOCKS = {
  AAPL: 150,
  TSLA: 700,
  INFY: 1400,
  BTC: 50000
};

export async function createRoom() {
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", roomCode), {
    market: STOCKS,
    players: {
      host: { cash: 1000000, holdings: {} }
    }
  });

  currentRoom = roomCode;
  myRole = "host";

  document.getElementById("roomDisplay").innerText = roomCode;

  listenRoom(roomCode);

  alert("Room Created: " + roomCode);
}

export async function joinRoom() {
  const roomCode = document.getElementById("roomCode").value.toUpperCase();

  const roomRef = doc(db, "rooms", roomCode);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    alert("Room not found");
    return;
  }

  const data = snap.data();

  await setDoc(roomRef, {
    ...data,
    players: {
      ...data.players,
      friend: { cash: 1000000, holdings: {} }
    }
  });

  currentRoom = roomCode;
  myRole = "friend";

  document.getElementById("roomDisplay").innerText = roomCode;

  listenRoom(roomCode);

  alert("Joined room " + roomCode);
}

export async function buy(stock) {
  if (!currentRoom) return;

  const roomRef = doc(db, "rooms", currentRoom);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) return;

  const room = snap.data();

  const playerKey = myRole;
  const player = room.players[playerKey];

  const price = room.market[stock];

  if (player.cash < price) {
    alert("Not enough cash");
    return;
  }

  player.cash -= price;
  player.holdings[stock] = (player.holdings[stock] || 0) + 1;

  await setDoc(roomRef, room);
}

function listenRoom(roomCode) {
  const roomRef = doc(db, "rooms", roomCode);

  onSnapshot(roomRef, (snap) => {
    const room = snap.data();
    if (!room) return;

    const player = room.players[myRole];

    document.getElementById("debug").innerHTML = `
      <b>PLAYER:</b> ${myRole}<br>
      <b>CASH:</b> ${player.cash}<br><br>
      <b>HOLDINGS:</b><br>
      AAPL: ${player.holdings.AAPL || 0}<br>
      TSLA: ${player.holdings.TSLA || 0}<br>
      INFY: ${player.holdings.INFY || 0}<br>
      BTC: ${player.holdings.BTC || 0}<br>
    `;
  });
}

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.buy = buy;
