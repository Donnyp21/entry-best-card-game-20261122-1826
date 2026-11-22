// main.js — the entry point: stage, loop wiring and input.
// One job: start the game, hand clicks and keys to the state, and run the
// rival's turn with pauses a human can follow. With ?shot=title|table|win|loss
// in the URL the game stages that screenshot scene and draws one frozen
// frame instead. With ?instant=1 the rival acts at once, which is what the
// headless play-test uses.
import { newGame, startDuel, startTurn, playCard, resolveAttacks } from './state.js';
import { chooseNextCard } from './ai.js';
import { renderGame } from './render.js';
import { stageShot } from './shots.js';

const root = document.getElementById('stage');

// The stage is a fixed 1280x720 table; scale it to fit the window, centred,
// so the game looks the same on every desktop and in every screenshot.
function fitStage() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  root.style.transform = `scale(${scale})`;
  root.style.left = `${(window.innerWidth - 1280 * scale) / 2}px`;
  root.style.top = `${(window.innerHeight - 720 * scale) / 2}px`;
}
window.addEventListener('resize', fitStage);
fitStage();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const instant = params.get('instant') === '1';

const game = newGame(Number(params.get('seed') ?? 20261123));

// The debug handle the play-test uses: window.__game exposes the live game
// so a headless run can drive it and read its state back.
window.__game = game;

function draw() {
  renderGame(root, game, actions);
}

// The rival's turn, one card at a time so the player can watch it think.
// In instant mode the whole turn runs at once.
function runRivalTurn() {
  game.acting = true;
  startTurn(game, 'rival');
  draw();
  const step = () => {
    if (game.screen !== 'play') {
      game.acting = false;
      draw();
      return;
    }
    const index = chooseNextCard(game, 'rival');
    if (index === -1) {
      resolveAttacks(game, 'rival');
      if (game.screen === 'play') {
        game.turnNumber += 1;
        startTurn(game, 'player');
      }
      game.acting = false;
      draw();
      return;
    }
    playCard(game, 'rival', index);
    draw();
    if (instant) step();
    else setTimeout(step, 550);
  };
  if (instant) step();
  else setTimeout(step, 650);
}

function endPlayerTurn() {
  if (game.screen !== 'play' || game.turn !== 'player' || game.acting) return;
  game.acting = true;
  resolveAttacks(game, 'player');
  draw();
  if (game.screen !== 'play') {
    game.acting = false;
    draw();
    return;
  }
  if (instant) runRivalTurn();
  else setTimeout(runRivalTurn, 500);
}

function startNewDuel() {
  const fresh = newGame(Date.now() % 100000);
  Object.assign(game, fresh);
  startDuel(game);
  draw();
}

const actions = {
  onStart() {
    startDuel(game);
    draw();
  },
  onRestart() {
    startNewDuel();
  },
  onEndTurn() {
    endPlayerTurn();
  },
  onPlayCard(index) {
    if (playCard(game, 'player', index)) draw();
  },
};

function handleKey(event) {
  if (shot) return; // a staged shot is frozen: no keys
  if (game.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    actions.onStart();
    return;
  }
  if ((game.screen === 'win' || game.screen === 'loss') && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
    actions.onRestart();
    return;
  }
  if (game.screen !== 'play') return;
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    endPlayerTurn();
    return;
  }
  const n = Number.parseInt(event.key, 10);
  if (n >= 1 && n <= 7) {
    const index = n - 1;
    if (index < game.player.hand.length) actions.onPlayCard(index);
  }
}

document.addEventListener('keydown', handleKey);

const status = document.getElementById('status');
function announce() {
  if (!status) return;
  status.textContent =
    game.screen === 'play'
      ? `Your life ${game.player.life}, rival ${game.rival.life}. Energy ${game.player.energy}.`
      : game.screen;
}

if (shot) {
  // One frozen frame: stage the scene, draw it, and stop.
  stageShot(game, shot);
  draw();
  announce();
  window.__shotReady = true;
} else {
  draw();
  announce();
}
