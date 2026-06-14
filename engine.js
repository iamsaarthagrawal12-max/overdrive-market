import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
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

export let roomId = null;
export let role = null;

const BASE = {
  AAPL: 150,
  TSLA: 700,
  INFY: 1400,
  BTC: 50000
};

let running = false;

/* CREATE ROOM */
export async function createRoom() {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", id), {
    tick: 0,
    market: BASE,
    players: {
      host: { cash: 1000000, holdings: {} }
    }
  });

  roomId = id;
  role = "host";

  startLoop();
}

/* JOIN ROOM */
export async function joinRoom(id) {
  const ref = doc(db, "rooms", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return alert("Room not found");

  await updateDoc(ref, {
    [`players.friend`]: { cash: 1000000, holdings: {} }
  });

  roomId = id;
  role = "friend";

  startLoop();
}

/* MARKET ENGINE */
function startLoop() {
  if (running) return;
  running = true;

  setInterval(async () => {
    if (!roomId) return;

    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    const room = snap.data();

    const market = { ...room.market };

    for (let s in market) {
      let p = market[s];

      let drift = (Math.random() - 0.5) * 0.04;
      let shock = Math.random() < 0.02 ? (Math.random() - 0.5) * 0.3 : 0;

      market[s] = Math.max(1, Math.round(p * (1 + drift + shock)));
    }

    await updateDoc(ref, {
      market,
      tick: increment(1)
    });

  }, 2000);
}
