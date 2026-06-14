import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* ================= FIREBASE ================= */

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

/* ================= GLOBAL STATE ================= */

let currentRoom = null;
let myRole = null;

/* ================= MARKET BASE ================= */

const BASE_MARKET = {
  AAPL: 150,
  TSLA: 700,
  INFY: 1400,
  BTC: 50000
};

/* ================= CREATE ROOM ================= */

window.createRoom = async function () {
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", roomCode), {
    mode: "coop",
    market: BASE_MARKET,
    players: {
      host: { cash: 1000000, holdings: {} }
    },
    ai: {
      ai1: { cash: 1000000, holdings: {} }
    }
  });

  currentRoom = roomCode;
  myRole = "host";

  document.getElementById("roomDisplay").innerText = roomCode;

  startListener(roomCode);

  alert("Room Created: " + roomCode);
};

/* ================= JOIN ROOM ================= */

window.joinRoom = async function () {
  const roomCode = document.getElementById("roomCode").value.toUpperCase();

  const ref = doc(db, "rooms", roomCode);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Room not found");
    return;
  }

  const data = snap.data();

  await setDoc(ref, {
    ...data,
    players: {
      ...data.players,
      friend: { cash: 1000000, holdings: {} }
    }
  });

  currentRoom = roomCode;
  myRole = "friend";

  document.getElementById("roomDisplay").innerText = roomCode;

  startListener(roomCode);

  alert("Joined Room: " + roomCode);
};

/* ================= BUY SYSTEM ================= */

window.buy = async function (stock) {
  if (!currentRoom) return;

  const ref = doc(db, "rooms", currentRoom);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const room = snap.data();

  const player = room.players[myRole];
  const price = room.market[stock];

  if (!player || player.cash < price) {
    alert("Not enough cash");
    return;
  }

  player.cash -= price;
  player.holdings[stock] = (player.holdings[stock] || 0) + 1;

  await setDoc(ref, room);
};

/* ================= LIVE LISTENER ================= */

function startListener(roomCode) {
  const ref = doc(db, "rooms", roomCode);

  onSnapshot(ref, (snap) => {
    const room = snap.data();
    if (!room) return;

    const player = room.players[myRole];

    document.getElementById("debug").innerHTML = `
      <b>ROLE:</b> ${myRole}<br>
      <b>CASH:</b> ${player.cash}<br>
      <br>
      AAPL: ${player.holdings.AAPL || 0}<br>
      TSLA: ${player.holdings.TSLA || 0}<br>
      INFY: ${player.holdings.INFY || 0}<br>
      BTC: ${player.holdings.BTC || 0}
    `;
  });
}

/* ================= EXPORT TO HTML ================= */

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.buy = buy;
/* ================= MARKET + AI LOOP ================= */

const STOCKS = ["AAPL", "TSLA", "INFY", "BTC"];

setInterval(async () => {
  if (!currentRoom) return;

  const ref = doc(db, "rooms", currentRoom);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const room = snap.data();

  /* ---- PRICE MOVEMENT ---- */
  Object.keys(room.market).forEach(stock => {
    let price = room.market[stock];

    let change = (Math.random() - 0.5) * 0.05;
    price = price * (1 + change);

    room.market[stock] = Math.max(1, Math.round(price));
  });

  /* ---- AI TRADING ---- */
  Object.keys(room.ai).forEach(ai => {
    let bot = room.ai[ai];

    let stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
    let price = room.market[stock];

    let r = Math.random();

    if (r < 0.6 && bot.cash > price) {
      bot.cash -= price;
      bot.holdings[stock] = (bot.holdings[stock] || 0) + 1;
    }
  });

  await setDoc(ref, room);

}, 3000);
