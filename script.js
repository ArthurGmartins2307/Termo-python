// ============================================================
// TERMO - Game Logic (Two-Player)
// ============================================================

// ---- State ----
let secretWord = [];
let player1Name = 'Jogador 1';
let player2Name = 'Jogador 2';
let currentRow = 0;
let currentCol = 0;
let currentGuess = [];
let gameOver = false;
let isDark = false;
const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

// Keyboard state: track best color per letter
const letterStates = {};

// ---- SCREEN NAVIGATION ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goToSetup() {
  showScreen('setup-screen');
}

function goToWordInput() {
  const p1Input = document.getElementById('player1-name').value.trim();
  const p2Input = document.getElementById('player2-name').value.trim();
  player1Name = p1Input || 'Jogador 1';
  player2Name = p2Input || 'Jogador 2';

  document.getElementById('p1-name-display').textContent = player1Name;
  document.getElementById('p2-name-display').textContent = player2Name;
  document.getElementById('p2-name-handover').textContent = player2Name;

  // Reset secret input
  const inp = document.getElementById('secret-word-input');
  inp.value = '';
  updateSecretTiles('');
  setWordError('');

  showScreen('word-screen');
  setTimeout(() => { inp.focus(); }, 100);
}

function confirmWord() {
  const raw = document.getElementById('secret-word-input').value.trim().toLowerCase();
  const cleaned = normalize(raw);

  if (cleaned.length !== WORD_LENGTH) {
    setWordError('A palavra deve ter exatamente 5 letras!');
    shakeSecretTiles();
    return;
  }

  secretWord = cleaned.split('');
  setWordError('');
  showScreen('handover-screen');
}

function startGame() {
  // Reset full game state
  currentRow = 0;
  currentCol = 0;
  currentGuess = [];
  gameOver = false;
  Object.keys(letterStates).forEach(k => delete letterStates[k]);

  // Build board
  buildBoard();

  // Reset keyboard colors
  document.querySelectorAll('.key').forEach(k => {
    k.classList.remove('correct', 'present', 'absent');
  });

  // Update attempt counter
  updateCounter();

  // Clear message
  hideMessage();

  showScreen('game-screen');
  focusHiddenInput();
}

function playAgain() {
  // Go back to word input for a new word
  const inp = document.getElementById('secret-word-input');
  inp.value = '';
  updateSecretTiles('');
  setWordError('');
  showScreen('word-screen');
  setTimeout(() => inp.focus(), 100);
}

// ---- BOARD ----
function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const row = document.createElement('div');
    row.classList.add('board-row');
    row.id = 'row-' + r;
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.id = 'tile-' + r + '-' + c;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
}

function getTile(row, col) {
  return document.getElementById('tile-' + row + '-' + col);
}

// ---- KEYBOARD PHYSICAL + VIRTUAL ----
document.addEventListener('keydown', (e) => {
  if (document.getElementById('game-screen').classList.contains('active') && !gameOver) {
    if (e.key === 'Enter') {
      submitGuess();
    } else if (e.key === 'Backspace') {
      deleteLetter();
    } else if (/^[a-zA-ZçÇãÃõÕêÊéÉáÁíÍóÓúÚâÂôÔ]$/.test(e.key)) {
      pressKey(e.key.toLowerCase());
    }
  }

  // Secret word screen: handle physical keyboard
  if (document.getElementById('word-screen').classList.contains('active')) {
    const inp = document.getElementById('secret-word-input');
    inp.focus();
  }
});

function pressKey(letter) {
  if (gameOver || currentCol >= WORD_LENGTH) return;
  currentGuess.push(letter);
  const tile = getTile(currentRow, currentCol);
  tile.textContent = letter.toUpperCase();
  tile.classList.add('filled', 'pop');
  tile.addEventListener('animationend', () => tile.classList.remove('pop'), { once: true });
  currentCol++;
  highlightActiveTile();
}

function deleteLetter() {
  if (gameOver || currentCol === 0) return;
  currentCol--;
  currentGuess.pop();
  const tile = getTile(currentRow, currentCol);
  tile.textContent = '';
  tile.classList.remove('filled');
  highlightActiveTile();
}

function highlightActiveTile() {
  // Remove active from all in current row
  for (let c = 0; c < WORD_LENGTH; c++) {
    getTile(currentRow, c).classList.remove('active-tile');
  }
  if (currentCol < WORD_LENGTH) {
    getTile(currentRow, currentCol).classList.add('active-tile');
  }
}

function submitGuess() {
  if (gameOver) return;

  if (currentGuess.length < WORD_LENGTH) {
    showMessage('Palavra incompleta!');
    shakeRow(currentRow);
    return;
  }

  const guess = currentGuess.map(normalize).join('').split('');
  const result = evaluateGuess(guess, secretWord.map(normalize));

  revealRow(currentRow, result, guess, () => {
    const won = result.every(r => r === 'correct');
    if (won) {
      gameOver = true;
      setTimeout(() => showResult(true, currentRow + 1), 400);
    } else if (currentRow + 1 >= MAX_ATTEMPTS) {
      gameOver = true;
      setTimeout(() => showResult(false, MAX_ATTEMPTS), 400);
    } else {
      currentRow++;
      currentCol = 0;
      currentGuess = [];
      updateCounter();
      hideMessage();
      highlightActiveTile();
    }
  });
}

// ---- EVALUATION ----
function evaluateGuess(guess, secret) {
  const result = Array(WORD_LENGTH).fill('absent');
  const secretCopy = [...secret];
  const guessCopy = [...guess];

  // First pass: correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      result[i] = 'correct';
      secretCopy[i] = null;
      guessCopy[i] = null;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessCopy[i] === null) continue;
    const idx = secretCopy.indexOf(guessCopy[i]);
    if (idx !== -1) {
      result[i] = 'present';
      secretCopy[idx] = null;
    }
  }

  return result;
}

// ---- REVEAL ANIMATION ----
function revealRow(row, result, guess, callback) {
  const STATE_PRIORITY = { correct: 3, present: 2, absent: 1 };

  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTile(row, c);
    const delay = c * 100;

    setTimeout(() => {
      tile.classList.remove('active-tile');
      tile.classList.add('flip');

      // Color appears mid-flip
      setTimeout(() => {
        tile.classList.add(result[c]);
      }, 250);

      if (c === WORD_LENGTH - 1) {
        setTimeout(() => {
          // Update keyboard
          updateKeyboard(guess, result, STATE_PRIORITY);
          if (callback) callback();
        }, 350);
      }
    }, delay);
  }
}

function updateKeyboard(guess, result, priority) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = guess[i];
    const state = result[i];

    if (!letterStates[letter] || priority[state] > priority[letterStates[letter]]) {
      letterStates[letter] = state;
    }
  }

  // Apply to all key elements
  Object.entries(letterStates).forEach(([letter, state]) => {
    // Find keys with this letter
    document.querySelectorAll('.key').forEach(key => {
      if (key.textContent.trim().toLowerCase() === letter ||
          key.textContent.trim().toLowerCase() === letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
        key.classList.remove('correct', 'present', 'absent');
        key.classList.add(state);
      }
    });
  });
}

// ---- SHAKE ----
function shakeRow(row) {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTile(row, c);
    tile.classList.add('shake');
    tile.addEventListener('animationend', () => tile.classList.remove('shake'), { once: true });
  }
}

// ---- MESSAGES ----
function showMessage(text) {
  const el = document.getElementById('game-message');
  el.textContent = text;
  el.classList.add('visible');
}

function hideMessage() {
  const el = document.getElementById('game-message');
  el.classList.remove('visible');
  el.textContent = '';
}

// ---- COUNTER ----
function updateCounter() {
  document.getElementById('attempt-counter').textContent =
    `Tentativa ${currentRow + 1} de ${MAX_ATTEMPTS}`;
}

// ---- RESULT SCREEN ----
function showResult(won, attempts) {
  const icon  = won ? '&#127881;' : '&#128546;';
  const title = won ? `Parab\u00e9ns, ${player2Name}!` : `Que pena!`;
  const msg   = won
    ? `Voc\u00ea acertou em <strong>${attempts}</strong> tentativa${attempts > 1 ? 's' : ''}!`
    : `N\u00e3o foi dessa vez. Tente novamente!`;

  document.getElementById('result-icon').innerHTML  = icon;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-msg').innerHTML   = msg;

  // Show word
  const wordEl = document.getElementById('result-word');
  wordEl.innerHTML = '';
  secretWord.forEach(letter => {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.textContent = letter.toUpperCase();
    wordEl.appendChild(tile);
  });

  // Stats
  const statsEl = document.getElementById('result-stats');
  statsEl.innerHTML = `
    <div class="stat-item">
      <span class="stat-value">${won ? attempts : 'X'}</span>
      <span class="stat-label">Tentativas</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">${WORD_LENGTH}</span>
      <span class="stat-label">Letras</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">${won ? Math.round(((MAX_ATTEMPTS - attempts + 1) / MAX_ATTEMPTS) * 100) : 0}%</span>
      <span class="stat-label">Efici\u00eancia</span>
    </div>
  `;

  showScreen('result-screen');
}

// ---- SECRET WORD INPUT ----
function onSecretInput(val) {
  const cleaned = val.toLowerCase();
  updateSecretTiles(cleaned);
  setWordError('');
}

function onSecretKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    confirmWord();
  }
}

function updateSecretTiles(val) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = document.getElementById('st-' + i);
    if (val[i]) {
      tile.textContent = '\u2022'; // bullet dot to hide letter
      tile.classList.add('filled');
    } else {
      tile.textContent = '';
      tile.classList.remove('filled');
    }
  }
}

function shakeSecretTiles() {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = document.getElementById('st-' + i);
    tile.classList.add('shake');
    tile.addEventListener('animationend', () => tile.classList.remove('shake'), { once: true });
  }
}

function setWordError(msg) {
  document.getElementById('word-error').textContent = msg;
}

// Click on secret tiles area to focus input
document.addEventListener('DOMContentLoaded', () => {
  const area = document.getElementById('secret-tiles');
  if (area) {
    area.addEventListener('click', () => {
      document.getElementById('secret-word-input').focus();
    });
  }
  buildBoard();
  initTheme();
});

// ---- THEME ----
function initTheme() {
  const saved = localStorage.getItem('termo-theme');
  if (saved === 'dark') {
    isDark = true;
    applyTheme();
  }
}

function toggleTheme() {
  isDark = !isDark;
  applyTheme();
  localStorage.setItem('termo-theme', isDark ? 'dark' : 'light');
}

function applyTheme() {
  const body = document.getElementById('body');
  body.classList.toggle('dark', isDark);
  body.classList.toggle('light', !isDark);

  const icon = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
  document.querySelectorAll('[id^="theme-icon"]').forEach(el => el.innerHTML = icon);
}

// ---- UTILITY ----
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u00e7/g, 'c')  // keep cedilla as c for matching? no let us keep as is
    .normalize('NFC');
}

// Actually let us do proper normalization:
// strip accents for matching but show original
function normalizeForMatch(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\u00e7/g, 'c');
}

function focusHiddenInput() {
  // On game screen we listen to document keydown, no hidden input needed
}
