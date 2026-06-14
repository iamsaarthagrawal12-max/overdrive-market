let myRole = null;
let currentRoomCode = null;
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
  storageBucket: "overdrive-market.firebasestorage.app",
  projectId: "overdrive-market",
  messagingSenderId: "213364020052",
  appId: "1:213364020052:web:33d3e4fa353ed08112aec1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.createRoom = async function () {
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", roomCode), {
    createdAt: Date.now(),
    mode: "coop",
    started: false,

    market: {
      AAPL: { price: 150 },
      TSLA: { price: 700 },
      INFY: { price: 1400 },
      BTC: { price: 50000 }
    },

    players: {
      host: {
        cash: 1000000,
        holdings: {}
      }
    },

    aiTeams: {
      ai1: { cash: 1000000, holdings: {} },
      ai2: { cash: 1000000, holdings: {} }
    }
  });

  document.getElementById("roomDisplay").textContent = roomCode;
  currentRoomCode = roomCode;
  myRole = "host";
  alert("Room Created: " + roomCode);
};

window.joinRoom = async function () {
  const roomCode = document.getElementById("roomCode").value.toUpperCase();
  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room not found");
    return;
  }

  const roomData = roomSnap.data();

  // 👉 assign role properly
  myRole = roomData.players.friend ? "friend" : "host";

  await setDoc(roomRef, {
    ...roomData,
    players: {
      ...roomData.players,
      friend: roomData.players.friend || {
        cash: 1000000,
        holdings: {}
      }
    }
  });

  document.getElementById("roomDisplay").textContent = roomCode;
  currentRoomCode = roomCode;
  myRole = roomData.players.friend ? "friend" : "friend";
  alert("Joined room " + roomCode + " as " + myRole);

  startGameLoop(roomCode);
};

window.buy = async function(stock) {
  if (!currentRoomCode) {
    alert("No room selected");
    return;
  }

  const roomRef = doc(db, "rooms", currentRoomCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room missing");
    return;
  }

  let room = roomSnap.data();

  // FIX: correct player selection
  let playerKey = myRole === "host" ? "host" : "friend";

  if (!room.players[playerKey]) {
    alert("Player not found in room");
    return;
  }

  let player = room.players[playerKey];
  let price = room.market[stock].price;

  if (player.cash < price) {
    alert("Not enough cash");
    return;
  }

  player.cash -= price;
  player.holdings[stock] = (player.holdings[stock] || 0) + 1;

  await setDoc(roomRef, room);

  console.log("BUY SUCCESS:", stock, playerKey, player.cash);
};
const STOCKS = ["AAPL", "TSLA", "INFY", "BTC"];

async function startGameLoop(roomCode) {
  setInterval(async () => {
    const roomRef = doc(db, "rooms", roomCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    let room = roomSnap.data();
    let market = room.market;

    // 📊 MARKET MOVEMENT
    STOCKS.forEach(stock => {
      let price = market[stock].price;

      let change = (Math.random() - 0.5) * 0.06;
      let shock = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.2 : 0;

      let newPrice = price * (1 + change + shock);
      market[stock].price = Math.max(1, Math.round(newPrice));
    });

    // 🤖 AI TRADING
   Object.keys(room.aiTeams).forEach(ai => {
  let bot = room.aiTeams[ai];

  let stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
  let price = market[stock].price;

  let r = Math.random();

  if (r < 0.6 && bot.cash > price) {
    bot.cash = bot.cash - price;
    bot.holdings[stock] = (bot.holdings[stock] || 0) + 1;
  } 
  else if (r < 0.8 && bot.holdings[stock] > 0) {
    bot.cash = bot.cash + price;
    bot.holdings[stock] -= 1;
  }
});

    await setDoc(roomRef, room);
    updateUI(room);
  }, 3000);
}

 function updateUI(room) {
  const playerKey = myRole === "friend" ? "friend" : "host";
  const player = room.players[playerKey];

  document.getElementById("debug").innerHTML = `
    CASH: ${player.cash}<br>
    AAPL: ${player.holdings.AAPL || 0}<br>
    TSLA: ${player.holdings.TSLA || 0}
  `;
}
