import { doc, getDoc, updateDoc, runTransaction } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { db, roomId, role } from "./engine.js";

export function initActions() {
  window.buy = buy;
}

export async function buy(stock) {
  const ref = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const room = snap.data();

    const player = room.players[role];
    const price = room.market[stock];

    if (player.cash < price) return;

    tx.update(ref, {
      [`players.${role}.cash`]: player.cash - price,
      [`players.${role}.holdings.${stock}`]:
        (player.holdings?.[stock] || 0) + 1
    });
  });
}
