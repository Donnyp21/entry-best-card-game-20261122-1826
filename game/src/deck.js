// deck.js — one job: build, shuffle and draw from a deck.
// A deck is a plain array of card ids. Shuffling is a Fisher-Yates pass
// driven by the seeded RNG, so the same seed always deals the same order.
import { DECK_LIST } from './cards.js';
import { rollInt } from './rng.js';

export function buildDeck(rng) {
  const deck = [...DECK_LIST];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = rollInt(rng, i + 1);
    const held = deck[i];
    deck[i] = deck[j];
    deck[j] = held;
  }
  return deck;
}

// Draw the top card, or null when the deck is empty (the caller then
// applies fatigue instead of handing the player a card).
export function drawCard(deck) {
  if (deck.length === 0) return null;
  return deck.pop();
}
