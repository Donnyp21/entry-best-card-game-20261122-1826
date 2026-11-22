// cards.js — one job: what the cards are.
// Ember Pact is an original duel card game. Four invented suits, each with
// its own colour, shape and pact bonus. No names, art or rules are borrowed
// from any published game: the creatures, the suits and the pact rule are
// invented for this table.

export const SUITS = {
  ember: {
    name: 'Ember',
    color: '#e2483a',
    dark: '#7c1d12',
    // Two Ember cards in one turn: the pact burns the rival for 2.
    pact: 'Pact: deal 2 damage to the rival.',
  },
  tide: {
    name: 'Tide',
    color: '#2f7fe0',
    dark: '#123a6e',
    // Two Tide cards in one turn: the pact draws a card.
    pact: 'Pact: draw a card.',
  },
  thorn: {
    name: 'Thorn',
    color: '#3da35a',
    dark: '#123f22',
    // Two Thorn cards in one turn: the pact grows 4 shield.
    pact: 'Pact: gain 4 shield.',
  },
  gale: {
    name: 'Gale',
    color: '#e0a92f',
    dark: '#6e4d10',
    // Two Gale cards in one turn: the pact grants 2 energy now.
    pact: 'Pact: gain 2 energy.',
  },
};

// Keywords a creature can carry:
//   guard — the rival's creatures must attack this one before your life.
//   swift — attacks the moment it is played, instead of waiting for the turn's end.
//   drain — heals its owner's life by the damage it deals.
//   draw1 — draws a card for its owner when it is played.
export const CARD_DEFS = {
  // Ember creatures
  'cinder-imp': { name: 'Cinder Imp', suit: 'ember', cost: 1, kind: 'creature', attack: 2, health: 1, text: '' },
  'flame-hound': { name: 'Flame Hound', suit: 'ember', cost: 2, kind: 'creature', attack: 3, health: 2, text: '' },
  'pyre-drake': { name: 'Pyre Drake', suit: 'ember', cost: 3, kind: 'creature', attack: 4, health: 3, text: 'Swift', keywords: ['swift'] },
  'ash-phoenix': { name: 'Ash Phoenix', suit: 'ember', cost: 3, kind: 'creature', attack: 3, health: 4, text: 'Drain', keywords: ['drain'] },
  // Tide creatures
  'brook-sprite': { name: 'Brook Sprite', suit: 'tide', cost: 1, kind: 'creature', attack: 1, health: 2, text: '' },
  'river-serpent': { name: 'River Serpent', suit: 'tide', cost: 2, kind: 'creature', attack: 2, health: 3, text: '' },
  tidecaller: { name: 'Tidecaller', suit: 'tide', cost: 3, kind: 'creature', attack: 3, health: 3, text: 'Draw a card', keywords: ['draw1'] },
  'deep-leviathan': { name: 'Deep Leviathan', suit: 'tide', cost: 3, kind: 'creature', attack: 4, health: 4, text: '' },
  // Thorn creatures
  'briar-sprout': { name: 'Briar Sprout', suit: 'thorn', cost: 1, kind: 'creature', attack: 1, health: 3, text: 'Guard', keywords: ['guard'] },
  'thorn-wolf': { name: 'Thorn Wolf', suit: 'thorn', cost: 2, kind: 'creature', attack: 2, health: 3, text: 'Guard', keywords: ['guard'] },
  ironbark: { name: 'Ironbark', suit: 'thorn', cost: 3, kind: 'creature', attack: 2, health: 5, text: 'Guard', keywords: ['guard'] },
  'grove-guardian': { name: 'Grove Guardian', suit: 'thorn', cost: 3, kind: 'creature', attack: 3, health: 4, text: 'Guard', keywords: ['guard'] },
  // Gale creatures
  'zephyr-hawk': { name: 'Zephyr Hawk', suit: 'gale', cost: 1, kind: 'creature', attack: 2, health: 1, text: 'Swift', keywords: ['swift'] },
  'storm-kite': { name: 'Storm Kite', suit: 'gale', cost: 2, kind: 'creature', attack: 3, health: 2, text: 'Swift', keywords: ['swift'] },
  'sky-corsair': { name: 'Sky Corsair', suit: 'gale', cost: 2, kind: 'creature', attack: 2, health: 2, text: 'Drain', keywords: ['drain'] },
  'tempest-roc': { name: 'Tempest Roc', suit: 'gale', cost: 3, kind: 'creature', attack: 4, health: 3, text: 'Swift', keywords: ['swift'] },
  // Spells
  'ember-burst': { name: 'Ember Burst', suit: 'ember', cost: 2, kind: 'spell', text: 'Deal 3 damage to the rival.', effect: 'damage3' },
  'tidal-surge': { name: 'Tidal Surge', suit: 'tide', cost: 2, kind: 'spell', text: 'Draw 2 cards.', effect: 'draw2' },
  thornwall: { name: 'Thornwall', suit: 'thorn', cost: 1, kind: 'spell', text: 'Gain 6 shield.', effect: 'shield6' },
  tailwind: { name: 'Tailwind', suit: 'gale', cost: 1, kind: 'spell', text: 'Gain 2 energy.', effect: 'energy2' },
};

// The deck every duellist brings: 24 cards, six of each suit's flavour in
// the mix, the same list for the player and the rival. Both decks are
// shuffled from different seeds, so the same list deals two different hands.
export const DECK_LIST = [
  'cinder-imp',
  'flame-hound', 'flame-hound',
  'pyre-drake',
  'ash-phoenix',
  'brook-sprite',
  'river-serpent', 'river-serpent',
  'tidecaller',
  'deep-leviathan',
  'briar-sprout', 'briar-sprout',
  'thorn-wolf', 'thorn-wolf',
  'ironbark',
  'grove-guardian',
  'zephyr-hawk',
  'storm-kite',
  'sky-corsair',
  'tempest-roc',
  'ember-burst',
  'tidal-surge',
  'thornwall',
  'tailwind',
];

export function cardDef(id) {
  return CARD_DEFS[id];
}
