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

/* ================= STATE ================= */

let roomId = null;
let role = "host";
let loopStarted = false;

/* ================= MARKET ================= */

const BASE_MARKET = {
  AAPL: 150,
  TSLA: 700,
  INFY: 1400,
  BTC: 50000
};

/* ================= CREATE ROOM ================= */

window.createRoom = async function () {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", id), {
    market: BASE_MARKET,
    tick: 0,
    players: {
      host: { cash: 1000000, holdings: {} }
    }
  });

  roomId = id;
  role = "host";

  document.getElementById("roomDisplay").innerText = id;

  startLoop();
  listen();

  alert("Room Created: " + id);
};

/* ================= JOIN ROOM ================= */

window.joinRoom = async function () {
  const id = document.getElementById("roomCode").value.toUpperCase();

  const ref = doc(db, "rooms", id);
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

  roomId = id;
  role = "friend";

  document.getElementById("roomDisplay").innerText = id;

  startLoop();
  listen();

  alert("Joined Room: " + id);
};

/* ================= BUY ================= */

window.buy = async function (stock) {
  if (!roomId) return;

  const ref = doc(db, "rooms", roomId);
  const snap = await getDoc(ref);

  const room = snap.data();
  const player = room.players[role];

  const price = room.market[stock];

  if (!player || player.cash < price) return;

  player.cash -= price;
  player.holdings[stock] = (player.holdings[stock] || 0) + 1;

  await setDoc(ref, room);
};

/* ================= GAME LOOP ================= */

function startLoop() {
  if (loopStarted) return;
  loopStarted = true;

  setInterval(async () => {
    if (!roomId) return;

    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);

    const room = snap.data();

    if (!room) return;

    /* MARKET MOVEMENT */
    for (let s in room.market) {
      let p = room.market[s];

      let change = (Math.random() - 0.5) * 0.04;
      p = p * (1 + change);

      room.market[s] = Math.max(1, Math.round(p));
    }

    room.tick++;

    await setDoc(ref, room);

  }, 2000);
}

/* ================= LIVE UI ================= */

function listen() {
  const ref = doc(db, "rooms", roomId);

  onSnapshot(ref, (snap) => {
    const room = snap.data();
    if (!room) return;

    const player = room.players[role];

    let net = player.cash;
    for (let s in player.holdings) {
      net += player.holdings[s] * room.market[s];
    }

    document.getElementById("debug").innerHTML = `
      <b>ROLE:</b> ${role}<br>
      <b>CASH:</b> ${player.cash}<br>
      <b>NET:</b> ${net}<br>
      <b>TICK:</b> ${room.tick}<br><br>

      AAPL: ${room.market.AAPL}<br>
      TSLA: ${room.market.TSLA}<br>
      INFY: ${room.market.INFY}<br>
      BTC: ${room.market.BTC}<br>
    `;
  });
}

/* expose */
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.buy = buy;
