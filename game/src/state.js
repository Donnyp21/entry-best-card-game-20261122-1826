// state.js — one job: the rules of Ember Pact.
// Everything a turn can do lives here: starting a turn, playing a card,
// the pact bonus, spells, the end-of-turn attack, and deciding the winner.
// Rendering and the rival's choices live in their own files; this file
// never touches the DOM, so a headless test can drive a whole game through
// these functions alone.

import { CARD_DEFS, SUITS } from './cards.js';
import { buildDeck, drawCard } from './deck.js';
import { makeRng } from './rng.js';

export const MAX_LIFE = 30;
export const HAND_LIMIT = 7;
export const TABLE_LIMIT = 4;
export const ENERGY_PER_TURN = 3;
export const MAX_ENERGY = 6;
export const START_HAND = 4;
export const FATIGUE_DAMAGE = 2;

let nextUid = 1;

function freshSide(rng) {
  return {
    life: MAX_LIFE,
    shield: 0,
    energy: ENERGY_PER_TURN,
    deck: buildDeck(rng),
    hand: [],
    table: [],
    discard: [],
    suitsPlayed: [],
    pactsDone: [],
  };
}

// A new duel. The player always takes the first turn; the rival's deck is
// shuffled from a different seed, so the same list deals two different hands.
export function newGame(seed = 20261123) {
  const rng = makeRng(seed);
  const game = {
    seed,
    screen: 'title',
    turn: 'player',
    turnNumber: 1,
    acting: false,
    player: freshSide(makeRng(seed + 1)),
    rival: freshSide(makeRng(seed + 77)),
    log: ['The pact is sealed. Four winds, one table.'],
    message: 'Your turn — play a card, then end your turn.',
    stats: { damageDealt: 0, cardsPlayed: 0, turns: 0, pacts: 0 },
    winner: null,
    lastPlayedUid: 0,
    lastAttackUid: 0,
  };
  for (let i = 0; i < START_HAND; i += 1) {
    game.player.hand.push(drawCard(game.player.deck));
    game.rival.hand.push(drawCard(game.rival.deck));
  }
  // The Warden opens ahead: five cards and a 4-point ward, to answer the
  // player's first turn. The rules panel on the title screen says so.
  game.rival.hand.push(drawCard(game.rival.deck));
  game.rival.shield = 4;
  log(game, 'The Hollow Warden opens with five cards and a 4-point ward.');
  return game;
}

export function otherSide(who) {
  return who === 'player' ? 'rival' : 'player';
}

function sideOf(game, who) {
  return game[who];
}

export function log(game, text) {
  game.log.push(text);
  if (game.log.length > 5) game.log.shift();
}

// Shield soaks damage first; whatever is left hits life.
export function damageLife(game, who, amount) {
  const side = sideOf(game, who);
  let left = amount;
  if (side.shield > 0) {
    const soaked = Math.min(side.shield, left);
    side.shield -= soaked;
    left -= soaked;
  }
  side.life -= left;
  return left;
}

function healLife(side, amount) {
  side.life = Math.min(MAX_LIFE, side.life + amount);
}

// Drawing from an empty deck hurts: fatigue, 2 life, straight through shield.
function drawFor(game, who) {
  const side = sideOf(game, who);
  const card = drawCard(side.deck);
  if (card === null) {
    side.life -= FATIGUE_DAMAGE;
    log(game, `${who === 'player' ? 'You' : 'The rival'} draw from an empty deck and tire (−${FATIGUE_DAMAGE} life).`);
    return null;
  }
  if (side.hand.length >= HAND_LIMIT) {
    side.discard.push(card);
    log(game, `${who === 'player' ? 'Your' : "The rival's"} hand is full — ${CARD_DEFS[card].name} is discarded.`);
    return null;
  }
  side.hand.push(card);
  return card;
}

// A turn opens: fresh energy, a drawn card, and a clean pact count.
export function startTurn(game, who) {
  const side = sideOf(game, who);
  game.turn = who;
  side.energy = ENERGY_PER_TURN;
  side.suitsPlayed = [];
  side.pactsDone = [];
  const drawn = drawFor(game, who);
  if (drawn !== null) {
    log(game, `${who === 'player' ? 'You draw' : 'The rival draws'} ${CARD_DEFS[drawn].name}.`);
  }
  if (who === 'player') {
    game.stats.turns += 1;
    game.message = 'Your turn — play a card, then end your turn.';
  }
  updateScreen(game);
}

export function canPlay(game, who, handIndex) {
  if (game.screen !== 'play') return false;
  if (game.turn !== who) return false;
  // `acting` locks the player out while the rival's turn resolves; the
  // rival's own plays must still pass, so only the player is gated by it.
  if (who === 'player' && game.acting) return false;
  const side = sideOf(game, who);
  const id = side.hand[handIndex];
  if (id === undefined) return false;
  const def = CARD_DEFS[id];
  if (side.energy < def.cost) return false;
  if (def.kind === 'creature' && side.table.length >= TABLE_LIMIT) return false;
  return true;
}

// Remove the dead from both tables after any damage.
export function sweepDead(game) {
  for (const who of ['player', 'rival']) {
    const side = sideOf(game, who);
    const alive = [];
    for (const creature of side.table) {
      if (creature.health > 0) alive.push(creature);
      else {
        side.discard.push(creature.id);
        log(game, `${creature.name} falls.`);
      }
    }
    side.table = alive;
  }
}

// One creature's attack: a guard must be hit first, and a guard hits back.
// Otherwise the damage goes to the rival's life, through shield.
export function attackWith(game, who, creature) {
  const foe = sideOf(game, otherSide(who));
  const me = sideOf(game, who);
  const guard = foe.table.find((c) => c.keywords.includes('guard'));
  game.lastAttackUid = creature.uid;
  if (guard) {
    guard.health -= creature.attack;
    creature.health -= guard.attack;
    log(game, `${creature.name} strikes ${guard.name} for ${creature.attack} (guard hits back ${guard.attack}).`);
    if (creature.keywords.includes('drain')) healLife(me, creature.attack);
  } else {
    const dealt = damageLife(game, otherSide(who), creature.attack);
    log(game, `${creature.name} hits the rival for ${creature.attack}.`);
    if (creature.keywords.includes('drain')) healLife(me, creature.attack);
    if (who === 'player') game.stats.damageDealt += dealt;
  }
  sweepDead(game);
  updateScreen(game);
}

// Every creature on the attacker's side attacks, in the order it was played.
export function resolveAttacks(game, who) {
  const side = sideOf(game, who);
  for (const creature of [...side.table]) {
    if (creature.health <= 0) continue;
    if (game.screen !== 'play') break;
    attackWith(game, who, creature);
  }
}

// The pact: the second card of one suit played in a single turn fires that
// suit's bonus, once per suit per turn.
function checkPact(game, who, suit) {
  const side = sideOf(game, who);
  const count = side.suitsPlayed.filter((s) => s === suit).length;
  if (count !== 2 || side.pactsDone.includes(suit)) return;
  side.pactsDone.push(suit);
  if (who === 'player') game.stats.pacts += 1;
  if (suit === 'ember') {
    damageLife(game, otherSide(who), 2);
    log(game, `Ember pact! The rival burns for 2.`);
  } else if (suit === 'tide') {
    drawFor(game, who);
    log(game, `Tide pact! ${who === 'player' ? 'You draw' : 'The rival draws'} a card.`);
  } else if (suit === 'thorn') {
    side.shield += 4;
    log(game, `Thorn pact! ${who === 'player' ? 'You gain' : 'The rival gains'} 4 shield.`);
  } else if (suit === 'gale') {
    side.energy = Math.min(MAX_ENERGY, side.energy + 2);
    log(game, `Gale pact! ${who === 'player' ? 'You gain' : 'The rival gains'} 2 energy.`);
  }
  updateScreen(game);
}

function resolveSpell(game, who, def) {
  const me = sideOf(game, who);
  if (def.effect === 'damage3') {
    damageLife(game, otherSide(who), 3);
    log(game, `${def.name} scorches the rival for 3.`);
    if (who === 'player') game.stats.damageDealt += 3;
  } else if (def.effect === 'draw2') {
    drawFor(game, who);
    drawFor(game, who);
    log(game, `${def.name}: ${who === 'player' ? 'you draw' : 'the rival draws'} 2 cards.`);
  } else if (def.effect === 'shield6') {
    me.shield += 6;
    log(game, `${def.name}: ${who === 'player' ? 'you gain' : 'the rival gains'} 6 shield.`);
  } else if (def.effect === 'energy2') {
    me.energy = Math.min(MAX_ENERGY, me.energy + 2);
    log(game, `${def.name}: ${who === 'player' ? 'you gain' : 'the rival gains'} 2 energy.`);
  }
  updateScreen(game);
}

// Play the card at handIndex. Returns true when the card was played.
export function playCard(game, who, handIndex) {
  if (!canPlay(game, who, handIndex)) return false;
  const side = sideOf(game, who);
  const id = side.hand[handIndex];
  const def = CARD_DEFS[id];
  side.hand.splice(handIndex, 1);
  side.energy -= def.cost;
  side.suitsPlayed.push(def.suit);
  if (who === 'player') game.stats.cardsPlayed += 1;

  if (def.kind === 'creature') {
    const creature = {
      uid: nextUid,
      id,
      name: def.name,
      suit: def.suit,
      attack: def.attack,
      health: def.health,
      keywords: [...(def.keywords ?? [])],
    };
    nextUid += 1;
    side.table.push(creature);
    game.lastPlayedUid = creature.uid;
    log(game, `${who === 'player' ? 'You play' : 'The rival plays'} ${def.name} (${def.attack}/${def.health}).`);
    if (def.keywords?.includes('draw1')) drawFor(game, who);
    if (def.keywords?.includes('swift')) {
      log(game, `${def.name} is Swift — it strikes at once.`);
      attackWith(game, who, creature);
    }
  } else {
    side.discard.push(id);
    log(game, `${who === 'player' ? 'You cast' : 'The rival casts'} ${def.name}.`);
    resolveSpell(game, who, def);
  }
  checkPact(game, who, def.suit);
  updateScreen(game);
  return true;
}

// The duel ends the moment a life total reaches zero.
export function updateScreen(game) {
  if (game.screen !== 'play') return;
  if (game.player.life <= 0 && game.rival.life <= 0) {
    // Both fall on the same blow: the duellist who struck last takes it.
    game.screen = game.turn === 'player' ? 'win' : 'loss';
    game.winner = game.turn;
  } else if (game.rival.life <= 0) {
    game.screen = 'win';
    game.winner = 'player';
  } else if (game.player.life <= 0) {
    game.screen = 'loss';
    game.winner = 'rival';
  }
}

export function startDuel(game) {
  game.screen = 'play';
  game.turn = 'player';
  game.turnNumber = 1;
  game.player.energy = ENERGY_PER_TURN;
  game.rival.energy = ENERGY_PER_TURN;
  log(game, 'You take the first turn.');
}
