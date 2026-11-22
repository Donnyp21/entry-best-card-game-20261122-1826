// shots.js — the staged screenshot scenes. Each one sets the real game to
// a fixed, deterministic state — a real table, real hands, real life totals —
// and freezes it, so the screenshot is exactly what a player sees.
// ?shot=title|table|win|loss. The cover is the title screen; the table shot
// shows the whole first criterion in one frame: both hands, both tables,
// readable cards, life totals and energy.
import { CARD_DEFS } from './cards.js';
import { newGame, startDuel } from './state.js';

function asCreature(id, uid, attack, health) {
  const def = CARD_DEFS[id];
  return {
    uid,
    id,
    name: def.name,
    suit: def.suit,
    attack,
    health,
    keywords: [...(def.keywords ?? [])],
  };
}

// Stage one named scene on the game and freeze it for the screenshot.
export function stageShot(game, shot) {
  if (shot === 'title') {
    game.screen = 'title';
    return;
  }
  if (shot === 'table') {
    // A real mid-duel position, staged card by card: both sides have
    // creatures out (a Guard among them), the player holds a full hand
    // with a pact nearly fired, and the life totals tell the story.
    const staged = newGame(4242);
    startDuel(staged);
    staged.player.hand = ['pyre-drake', 'ember-burst', 'tidecaller', 'thorn-wolf', 'zephyr-hawk', 'tidal-surge'];
    staged.player.table = [
      asCreature('flame-hound', 9101, 3, 2),
      asCreature('thorn-wolf', 9102, 2, 3),
      asCreature('brook-sprite', 9103, 1, 2),
    ];
    staged.player.suitsPlayed = ['ember'];
    staged.rival.hand = ['river-serpent', 'briar-sprout', 'storm-kite', 'ironbark', 'cinder-imp'];
    staged.rival.table = [
      asCreature('river-serpent', 9104, 2, 3),
      asCreature('briar-sprout', 9105, 1, 2),
      asCreature('storm-kite', 9106, 3, 2),
    ];
    staged.turnNumber = 4;
    staged.player.energy = 3;
    staged.player.life = 26;
    staged.rival.life = 24;
    staged.player.shield = 4;
    staged.rival.shield = 0;
    staged.log = [
      'The rival plays River Serpent (2/3).',
      'Your Thorn Wolf guards the table.',
      'Ember pact! The rival burns for 2.',
    ];
    staged.message = 'Your turn — play a card, then end your turn.';
    Object.assign(game, staged);
    game.screen = 'play';
    return;
  }
  if (shot === 'win') {
    const staged = newGame(99);
    startDuel(staged);
    staged.rival.life = 0;
    staged.rival.shield = 0;
    staged.player.life = 18;
    staged.player.table = [
      asCreature('pyre-drake', 9001, 4, 3),
      asCreature('ash-phoenix', 9002, 3, 2),
    ];
    staged.rival.table = [];
    staged.stats = { damageDealt: 31, cardsPlayed: 11, turns: 8, pacts: 3 };
    staged.screen = 'win';
    staged.winner = 'player';
    Object.assign(game, staged);
    return;
  }
  if (shot === 'loss') {
    const staged = newGame(77);
    startDuel(staged);
    staged.player.life = 0;
    staged.rival.life = 12;
    staged.player.table = [];
    staged.rival.table = [
      asCreature('deep-leviathan', 9003, 4, 4),
      asCreature('ironbark', 9004, 2, 5),
    ];
    staged.stats = { damageDealt: 18, cardsPlayed: 9, turns: 7, pacts: 2 };
    staged.screen = 'loss';
    staged.winner = 'rival';
    Object.assign(game, staged);
    return;
  }
  game.screen = 'title';
}
