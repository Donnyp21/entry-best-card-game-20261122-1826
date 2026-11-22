// ai.js — one job: the rival's choices.
// The rival reads the table and plays the card that helps it most, one
// card at a time, until it can afford nothing worth playing. It is not a
// perfect player: it guards when it is hurt, spends damage spells when the
// player is nearly beaten, and otherwise plays its strongest creature.
// Because it re-scores after every card, a pact bonus can change its mind.

import { CARD_DEFS } from './cards.js';
import { canPlay, otherSide } from './state.js';

function scoreCard(game, who, handIndex) {
  const side = game[who];
  const foe = game[otherSide(who)];
  const id = side.hand[handIndex];
  const def = CARD_DEFS[id];
  let score = 0;
  if (def.kind === 'creature') {
    score = def.attack * 2 + def.health;
    if (def.keywords?.includes('guard') && side.life <= 14) score += 6;
    if (def.keywords?.includes('guard') && foe.table.length >= 2) score += 4;
    else if (def.keywords?.includes('guard') && foe.table.length > 0) score += 2;
    if (def.keywords?.includes('swift')) score += 2;
    if (def.keywords?.includes('drain') && side.life <= 20) score += 3;
    if (def.keywords?.includes('draw1')) score += 2;
    // A second card of a suit this turn fires its pact: worth reaching for.
    if (side.suitsPlayed.includes(def.suit) && !side.pactsDone.includes(def.suit)) score += 4;
    if (side.table.length >= 4) score = -100;
  } else if (def.effect === 'damage3') {
    score = foe.life <= 6 ? 12 : foe.life <= 12 ? 6 : 2;
    if (foe.shield >= 3) score -= 2;
  } else if (def.effect === 'draw2') {
    score = side.hand.length <= 3 ? 7 : 1;
  } else if (def.effect === 'shield6') {
    score = side.life <= 15 ? 8 : side.life <= 22 ? 3 : 0;
  } else if (def.effect === 'energy2') {
    score = side.hand.some((c) => CARD_DEFS[c].cost > side.energy) ? 5 : 0;
  }
  // Cheap cards are easier to fit in: prefer value per energy.
  return score / Math.max(1, def.cost);
}

// The rival's next move: the index of the best playable card, or -1 to stop.
export function chooseNextCard(game, who) {
  const side = game[who];
  let best = -1;
  let bestScore = 0.5;
  for (let i = 0; i < side.hand.length; i += 1) {
    if (!canPlay(game, who, i)) continue;
    const score = scoreCard(game, who, i);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
