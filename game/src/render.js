// render.js — one job: draw the table in the DOM.
// The whole game is plain HTML and CSS: cards are real elements, so their
// values stay crisp at any size and a screen reader can read the state.
// renderGame rebuilds the stage from the game state on every change; the
// callbacks it takes are the only way the player acts on the game.

import { CARD_DEFS, SUITS } from './cards.js';
import { canPlay } from './state.js';

// Each suit is told apart by colour AND by shape: a flame, a wave, a leaf
// and a swirl, drawn as inline SVG so they need no image file.
export function suitIcon(suit, size = 24) {
  const color = SUITS[suit].color;
  if (suit === 'ember') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 C15 6 20 8 20 14 A8 8 0 1 1 4 14 C4 9 8 7 12 2 Z" fill="${color}"/></svg>`;
  }
  if (suit === 'tide') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"><path d="M2 9 Q6 5 10 9 T18 9 T22 9"/><path d="M2 15 Q6 11 10 15 T18 15 T22 15"/></g></svg>`;
  }
  if (suit === 'thorn') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 C18 6 20 12 12 22 C4 12 6 6 12 2 Z" fill="${color}"/><path d="M12 8 L12 18" stroke="#0d2b16" stroke-width="1.6"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"><path d="M5 15 A7 7 0 1 1 19 11"/><path d="M8 15 A4 4 0 1 0 16 13"/><path d="M19 11 L19 7 M19 11 L15 11"/></g></svg>`;
}

function lifeBar(life, shield) {
  const pct = Math.max(0, Math.min(100, (life / 30) * 100));
  const shieldTag = shield > 0 ? `<span class="shield">Shield ${shield}</span>` : '';
  return `<div class="lifebar"><div class="lifefill" style="width:${pct}%"></div><span class="lifenumber">${life} / 30</span></div>${shieldTag}`;
}

function energyPips(energy) {
  let pips = '';
  for (let i = 0; i < 6; i += 1) {
    pips += `<span class="pip${i < energy ? ' on' : ''}"></span>`;
  }
  return `<div class="energy" title="Energy">${pips}<span class="energy-number">${energy}</span></div>`;
}

// A face-down card back for the rival's hand: the pact's four winds in a ring.
function cardBack() {
  return `<div class="card back"><div class="back-ring">${suitIcon('ember', 18)}${suitIcon('tide', 18)}${suitIcon('thorn', 18)}${suitIcon('gale', 18)}</div><div class="back-name">EMBER PACT</div></div>`;
}

function creatureCard(creature, small, isFresh) {
  const def = CARD_DEFS[creature.id];
  const cls = small ? 'card table-card' : 'card';
  return `<div class="${cls} suit-${creature.suit}${isFresh ? ' just-played' : ''}" data-uid="${creature.uid}">
    <div class="cost">${def.cost}</div>
    <div class="suit-mini">${suitIcon(creature.suit, 20)}</div>
    <div class="card-art">${suitIcon(creature.suit, 36)}</div>
    <div class="card-name">${def.name}</div>
    <div class="card-text">${def.text || SUITS[creature.suit].name}</div>
    <div class="card-stats"><span class="atk" title="Attack">${creature.attack}</span><span class="hp" title="Health">${creature.health}</span></div>
  </div>`;
}

function handCard(game, id, index) {
  const def = CARD_DEFS[id];
  const playable = canPlay(game, 'player', index);
  const afford = game.player.energy >= def.cost;
  const stats = def.kind === 'creature'
    ? `<div class="card-stats"><span class="atk" title="Attack">${def.attack}</span><span class="hp" title="Health">${def.health}</span></div>`
    : `<div class="card-stats"><span class="spell-tag">SPELL</span></div>`;
  return `<div class="card hand-card suit-${def.suit}${playable ? ' playable' : ''}${!afford ? ' too-costly' : ''}" data-hand="${index}" role="button" tabindex="0" aria-label="${def.name}, cost ${def.cost}${def.kind === 'creature' ? `, attack ${def.attack}, health ${def.health}` : `, ${def.text}`}">
    <div class="cost">${def.cost}</div>
    <div class="suit-mini">${suitIcon(def.suit, 20)}</div>
    <div class="card-art">${suitIcon(def.suit, 46)}</div>
    <div class="card-name">${def.name}</div>
    <div class="card-text">${def.text || SUITS[def.suit].name}</div>
    ${stats}
    <div class="card-key">${index + 1}</div>
  </div>`;
}

function pactChips(game) {
  return Object.keys(SUITS).map((suit) => {
    const played = game.player.suitsPlayed.filter((s) => s === suit).length;
    const fired = game.player.pactsDone.includes(suit);
    return `<span class="pact-chip${fired ? ' fired' : ''}${played === 1 ? ' one' : ''}" title="${SUITS[suit].name} — ${SUITS[suit].pact}">${suitIcon(suit, 16)} ${played}/2</span>`;
  }).join('');
}

function playScreen(game) {
  const rivalBacks = game.rival.hand.map(() => cardBack()).join('');
  const fresh = game.lastPlayedUid !== 0 && game.lastPlayedUid !== seenPlayedUid;
  const rivalTable = game.rival.table.map((c) => creatureCard(c, true, fresh && c.uid === game.lastPlayedUid)).join('') || '<div class="empty-table">The rival has no creatures out.</div>';
  const playerTable = game.player.table.map((c) => creatureCard(c, true, fresh && c.uid === game.lastPlayedUid)).join('') || '<div class="empty-table">Your side of the table is empty — play a creature.</div>';
  const hand = game.player.hand.map((id, i) => handCard(game, id, i)).join('');
  const endDisabled = game.turn !== 'player' || game.acting;
  const logLines = game.log.slice(-3).map((line) => `<div class="log-line">${line}</div>`).join('');
  return `
  <div class="topbar">
    <div class="brand">EMBER PACT</div>
    <div class="turn-info">${game.turn === 'player' ? 'Your turn' : 'Rival thinking…'} · Turn ${game.turnNumber}</div>
    <div class="top-hint">Keys 1–7 play a card · Space ends your turn</div>
  </div>
  <div class="rival-zone">
    <div class="side-info">
      <div class="side-name">The Hollow Warden</div>
      ${lifeBar(game.rival.life, game.rival.shield)}
      <div class="side-meta">Deck ${game.rival.deck.length} · Discard ${game.rival.discard.length}</div>
    </div>
    <div class="rival-hand">${rivalBacks}</div>
    <div class="rival-table">${rivalTable}</div>
  </div>
  <div class="center-strip">
    <div class="log">${logLines}</div>
    <div class="center-actions">
      <div class="pact-row">${pactChips(game)}</div>
      <button class="end-turn" data-action="end-turn" ${endDisabled ? 'disabled' : ''}>End Turn</button>
    </div>
  </div>
  <div class="player-table-row">
    <div class="player-table">${playerTable}</div>
  </div>
  <div class="player-hand-row">
    <div class="player-hand">${hand}</div>
    <div class="side-info player-info">
      <div class="side-name">You — the Pactbearer</div>
      ${lifeBar(game.player.life, game.player.shield)}
      ${energyPips(game.player.energy)}
      <div class="side-meta">Deck ${game.player.deck.length} · Discard ${game.player.discard.length} · Hand ${game.player.hand.length}/7</div>
    </div>
  </div>`;
}

function titleScreen() {
  return `
  <div class="overlay title-screen">
    <div class="title-suits">${suitIcon('ember', 34)}${suitIcon('tide', 34)}${suitIcon('thorn', 34)}${suitIcon('gale', 34)}</div>
    <h1>EMBER PACT</h1>
    <p class="subtitle">Duel of the Four Winds — a card game of pacts and creatures</p>
    <div class="rules">
      <div class="rule"><b>Goal:</b> bring the Hollow Warden's life from 30 to 0 before yours falls.</div>
      <div class="rule"><b>Each turn:</b> draw a card, gain 3 energy, play cards from your hand, then end your turn — your creatures attack.</div>
      <div class="rule"><b>Creatures</b> show attack (red, bottom left) and health (green, bottom right). A <b>Guard</b> must be attacked before the rival's life. <b>Swift</b> strikes the moment it is played. <b>Drain</b> heals you by the damage it deals.</div>
      <div class="rule"><b>The Pact:</b> play two cards of one suit in a turn and its pact fires — Ember burns the rival for 2, Tide draws a card, Thorn grows 4 shield, Gale grants 2 energy.</div>
      <div class="rule"><b>Watch out:</b> an empty deck tires you for 2 life every draw, and a full hand discards what you draw. The Warden opens with five cards and a 4-point ward, to answer your first turn.</div>
    </div>
    <button class="big-button" data-action="start">Begin the Duel</button>
    <p class="title-hint">Click a card to play it · Keys 1–7 play from your hand · Space ends your turn · R starts a new duel</p>
  </div>`;
}

function endScreen(game, won) {
  const s = game.stats;
  return `
  <div class="overlay ${won ? 'win-screen' : 'loss-screen'}">
    <div class="title-suits">${suitIcon('ember', 30)}${suitIcon('tide', 30)}${suitIcon('thorn', 30)}${suitIcon('gale', 30)}</div>
    <h1>${won ? 'VICTORY' : 'DEFEAT'}</h1>
    <p class="subtitle">${won ? 'The winds bow to you — the Hollow Warden yields the table.' : 'The Hollow Warden keeps the table — your embers fade… this time.'}</p>
    <p class="end-life">${won ? `You stand at ${game.player.life} life.` : `The Warden stands at ${game.rival.life} life.`}</p>
    <div class="end-stats">
      <div class="stat"><span class="stat-number">${s.turns}</span><span class="stat-label">turns</span></div>
      <div class="stat"><span class="stat-number">${s.cardsPlayed}</span><span class="stat-label">cards played</span></div>
      <div class="stat"><span class="stat-number">${s.damageDealt}</span><span class="stat-label">damage dealt</span></div>
      <div class="stat"><span class="stat-number">${s.pacts}</span><span class="stat-label">pacts fired</span></div>
    </div>
    <button class="big-button" data-action="restart">Play Again</button>
    <p class="title-hint">Press R to start a new duel</p>
  </div>`;
}

// The uid of the last card whose entrance animation already played, so a
// re-render does not replay it.
let seenPlayedUid = 0;

// Draw the whole stage from the state, then wire the buttons and cards.
export function renderGame(root, game, actions) {
  if (game.screen === 'title') root.innerHTML = titleScreen();
  else if (game.screen === 'win') root.innerHTML = endScreen(game, true);
  else if (game.screen === 'loss') root.innerHTML = endScreen(game, false);
  else root.innerHTML = playScreen(game);
  // Only now mark the entrance as seen, so this render could still animate it.
  seenPlayedUid = game.lastPlayedUid;

  const status = document.getElementById('status');
  if (status) {
    status.textContent = game.screen === 'play'
      ? `Your life ${game.player.life}, rival ${game.rival.life}. Energy ${game.player.energy}. Turn ${game.turnNumber}.`
      : game.screen;
  }

  root.querySelectorAll('[data-action="start"]').forEach((b) => b.addEventListener('click', actions.onStart));
  root.querySelectorAll('[data-action="restart"]').forEach((b) => b.addEventListener('click', actions.onRestart));
  root.querySelectorAll('[data-action="end-turn"]').forEach((b) => b.addEventListener('click', actions.onEndTurn));
  root.querySelectorAll('[data-hand]').forEach((el) => {
    el.addEventListener('click', () => actions.onPlayCard(Number(el.dataset.hand)));
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        actions.onPlayCard(Number(el.dataset.hand));
      }
    });
  });
}
