import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
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
let role = null;
let lastPrices = {};

/* ================= MARKET ================= */

const BASE = {
  AAPL: 150,
  TSLA: 700,
  INFY: 1400,
  BTC: 50000
};

/* ================= CREATE ================= */

window.createRoom = async function () {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", id), {
    mode: "versus",
    tick: 0,
    market: BASE,
    players: {
      host: { cash: 1000000, holdings: {} }
    }
  });

  roomId = id;
  role = "host";

  document.getElementById("roomDisplay").innerText = id;

  startLoop(id);
  listen(id);
};

/* ================= JOIN ================= */

window.joinRoom = async function () {
  const id = document.getElementById("roomCode").value.toUpperCase();

  await setDoc(doc(db, "rooms", id), snap => snap); // safe merge fallback not used

  roomId = id;
  role = "friend";

  document.getElementById("roomDisplay").innerText = id;

  startLoop(id);
  listen(id);
};

/* ================= BUY ================= */

window.buy = async function (stock) {
  const ref = doc(db, "rooms", roomId);

  const snap = await fetchRoom(ref);
  const room = snap;

  const player = room.players[role];
  const price = room.market[stock];

  if (player.cash < price) {
    flash("❌ Not enough cash");
    return;
  }

  player.cash -= price;
  player.holdings[stock] = (player.holdings[stock] || 0) + 1;

  await setDoc(ref, room);

  flash(`✔ Bought ${stock}`);
};

/* ================= GAME LOOP ================= */

function startLoop(id) {
  setInterval(async () => {
    const ref = doc(db, "rooms", id);

    const room = await fetchRoom(ref);

    /* MARKET MOVEMENT (REALISTIC FEEL) */
    for (let s in room.market) {
      let old = room.market[s];

      let momentum = (old - (lastPrices[s] || old)) * 0.2;

      let noise = (Math.random() - 0.5) * 8;

      let newPrice = old + momentum + noise;

      lastPrices[s] = old;

      room.market[s] = Math.max(1, Math.round(newPrice));
    }

    room.tick++;

    await setDoc(ref, room);

  }, 1500); // faster = more “alive” feeling
}

/* ================= SNAPSHOT ================= */

function listen(id) {
  const ref = doc(db, "rooms", id);

  onSnapshot(ref, (snap) => {
    const room = snap.data();
    if (!room) return;

    const p = room.players[role];

    let net = p.cash;
    for (let s in p.holdings) {
      net += p.holdings[s] * room.market[s];
    }

    render(room, p, net);
  });
}

/* ================= FETCH ================= */

async function fetchRoom(ref) {
  const snap = await getDoc(ref);
  return snap.data();
}

/* ================= EXPORT ================= */

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.buy = buy;
/* ================= UI FEEL ENGINE ================= */

function render(room, player, netWorth) {
  document.getElementById("debug").innerHTML = `
    <div style="font-family:monospace">

    <h2>📊 OVERDRIVE TRADING DESK</h2>

    <b>NET WORTH:</b> ${netWorth.toLocaleString()}<br>
    <b>CASH:</b> ${player.cash.toLocaleString()}<br>
    <b>TICK:</b> ${room.tick}<br><br>

    <h3>📈 MARKET</h3>
    AAPL: ${spark(room.market.AAPL)}<br>
    TSLA: ${spark(room.market.TSLA)}<br>
    INFY: ${spark(room.market.INFY)}<br>
    BTC: ${spark(room.market.BTC)}<br>

    <br>
    <h3>📦 HOLDINGS</h3>
    AAPL: ${player.holdings.AAPL || 0}<br>
    TSLA: ${player.holdings.TSLA || 0}<br>
    INFY: ${player.holdings.INFY || 0}<br>
    BTC: ${player.holdings.BTC || 0}<br>

    </div>
  `;
}

/* ================= PRICE FEEL ================= */

function spark(price) {
  if (!price) return "—";

  if (price > 10000) return `🔥 ${price}`;
  if (price > 1000) return `📈 ${price}`;
  if (price < 100) return `📉 ${price}`;

  return price;
}

/* ================= FEEDBACK FLASH ================= */

function flash(msg) {
  let d = document.getElementById("debug");

  d.style.transition = "0.1s";
  d.style.transform = "scale(1.02)";

  setTimeout(() => {
    d.style.transform = "scale(1)";
  }, 100);

  console.log(msg);
}
