// rng.js — one small job: a seeded random number generator.
// The game shuffles both decks from a seed, so a staged screenshot and a
// play-test can replay the exact same deal. Mulberry32 is tiny, fast and
// deterministic: the same seed always deals the same cards.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Roll an integer in [0, n).
export function rollInt(rng, n) {
  return Math.floor(rng() * n);
}
