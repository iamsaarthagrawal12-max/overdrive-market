import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  increment,
  runTransaction
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

let roomId = null;
let role = null;
let loopStarted = false;

/* ================= BASE STATE ================= */

const BASE = {
  AAPL: 150,
  TSLA: 700,
  INFY: 1400,
  BTC: 50000
};

/* ================= ROOM CREATION ================= */

window.createRoom = async function () {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", id), {
    mode: "versus",
    tick: 0,
    market: BASE,
    players: {
      host: { cash: 1000000, holdings: {} }
    },
    lock: false
  });

  roomId = id;
  role = "host";

  document.getElementById("roomDisplay").innerText = id;

  startEngine();
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

  await updateDoc(ref, {
    [`players.friend`]: { cash: 1000000, holdings: {} }
  });

  roomId = id;
  role = "friend";

  document.getElementById("roomDisplay").innerText = id;

  startEngine();
  listen();

  alert("Joined: " + id);
};
window.buy = async function (stock) {
  if (!roomId) return;

  const ref = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const room = snap.data();
    const player = room.players?.[role];

    const price = room.market?.[stock];
    if (!player || !price) return;

    if (player.cash < price) return;

    const newCash = player.cash - price;
    const newHoldings = {
      ...player.holdings,
      [stock]: (player.holdings?.[stock] || 0) + 1
    };

    tx.update(ref, {
      [`players.${role}.cash`]: newCash,
      [`players.${role}.holdings`]: newHoldings
    });
  });
};
function startEngine() {
  if (loopStarted) return;
  loopStarted = true;

  setInterval(async () => {
    if (!roomId) return;

    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const room = snap.data();

    const market = { ...room.market };

    /* REALISTIC MARKET MOVEMENT */
    for (let s in market) {
      let p = market[s];

      let drift = (Math.random() - 0.5) * 0.04;
      let shock = Math.random() < 0.015 ? (Math.random() - 0.5) * 0.25 : 0;

      p = p * (1 + drift + shock);

      market[s] = Math.max(1, Math.round(p));
    }

    await updateDoc(ref, {
      market,
      tick: increment(1)
    });

  }, 2000);
}
function listen() {
  const ref = doc(db, "rooms", roomId);

  onSnapshot(ref, (snap) => {
    const room = snap.data();
    if (!room) return;

    const player = room.players?.[role];
    if (!player) return;

    let net = player.cash;

    for (let s in player.holdings) {
      net += player.holdings[s] * room.market[s];
    }

    document.getElementById("debug").innerHTML = `
      <h2>OVERDRIVE MARKET</h2>
      MODE: ${room.mode} | TICK: ${room.tick}<br><br>

      CASH: ${player.cash}<br>
      NET WORTH: ${Math.round(net)}<br><br>

      MARKET:<br>
      AAPL ${room.market.AAPL}<br>
      TSLA ${room.market.TSLA}<br>
      INFY ${room.market.INFY}<br>
      BTC ${room.market.BTC}<br><br>

      HOLDINGS:<br>
      AAPL ${player.holdings.AAPL || 0}<br>
      TSLA ${player.holdings.TSLA || 0}<br>
      INFY ${player.holdings.INFY || 0}<br>
      BTC ${player.holdings.BTC || 0}
    `;
  });
}

/* EXPORT */
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.buy = buy;
