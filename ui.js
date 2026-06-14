import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { db, roomId, role } from "./engine.js";

export function initUI() {
  listen();
}

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
      <div class="panel">
        <h1>📈 OVERDRIVE MARKET</h1>

        <div>MODE: LIVE TRADING SIM</div>
        <div>TICK: ${room.tick}</div>

        <hr>

        <div><b>CASH:</b> ${player.cash}</div>
        <div><b>NET:</b> ${Math.round(net)}</div>

        <hr>

        <div>📊 AAPL ${room.market.AAPL}</div>
        <div>📊 TSLA ${room.market.TSLA}</div>
        <div>📊 INFY ${room.market.INFY}</div>
        <div>📊 BTC ${room.market.BTC}</div>

        <hr>

        <div>📦 HOLDINGS</div>
        <div>AAPL: ${player.holdings.AAPL || 0}</div>
        <div>TSLA: ${player.holdings.TSLA || 0}</div>
        <div>INFY: ${player.holdings.INFY || 0}</div>
        <div>BTC: ${player.holdings.BTC || 0}</div>
      </div>
    `;
  });
}
