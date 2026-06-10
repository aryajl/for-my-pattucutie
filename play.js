import { letters, wordPuzzles } from "./letters.js"



let START_DATE = new Date('2026-06-01');

let currentDay = 1;
let selectedLetter = null;
let unlockedLetters = JSON.parse(
    localStorage.getItem('unlockedLetters')
) || {};
let currentGuess = '';
let attempts = 0;
let maxAttempts = 6;
let guesses = [];
let keyboardState = {};
let currentPuzzle = null;

let keyboard = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫']
];

function calculateCurrentDay() {
    const now = new Date();
    const diffTime = Math.abs(now - START_DATE);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    currentDay = Math.min(diffDays + 1, 10
    );
}

function isUnlocked(day) {
    return day <= currentDay && unlockedLetters[day];
}

function renderEnvelopes() {
    let container = document.getElementById('envelopes');
    container.innerHTML = '';

    letters.forEach(function(letter) {
        let isAvailable = letter.day <= currentDay;
        let isLetterUnlocked = unlockedLetters[letter.day];
        
        let envelope = document.createElement('div');
        envelope.className = 'envelope ' + (isLetterUnlocked ? 'unlocked ' + letter.color : 'locked');
        
        if (isAvailable && !isLetterUnlocked) {
            envelope.onclick = function() {
                startGame(letter);
            };
            envelope.style.cursor = 'pointer';
        } else if (isLetterUnlocked) {
            envelope.onclick = function() {
                openLetter(letter);
            };
        }

        let icon = isLetterUnlocked ? '✉️' : (isAvailable ? '🎮' : '🔒');
        let subtitle = isLetterUnlocked ? 'Click to read' : (isAvailable ? 'Play to unlock' : 'Available on day ' + letter.day);

        envelope.innerHTML = '<div class="envelope-left"><div class="envelope-icon">' + 
            icon + 
            '</div><div><div class="envelope-title">Day ' + letter.day + 
            '</div><div class="envelope-subtitle">' + subtitle + 
            '</div></div></div>' + 
            (isLetterUnlocked ? '<div class="heart-small">❤️</div>' : '');

        container.appendChild(envelope);
    });

    let unlockedCount = Object.keys(unlockedLetters).length;
    document.getElementById('dayCounter').textContent = unlockedCount + ' of ' + Math.min(currentDay, 10) + ' days unlocked';
}

function startGame(letter) {
    selectedLetter = letter;
    currentPuzzle = wordPuzzles[letter.day];
    currentGuess = '';
    attempts = 0;
    guesses = [];
    keyboardState = {};
    
    document.getElementById('gameDay').textContent = letter.day;
    document.getElementById('hintSection').textContent = currentPuzzle.hint;
    document.getElementById('gameCard').className = 'game-card ' + letter.color;
    document.getElementById('attemptCount').textContent = '0';
    document.getElementById('gameMessage').textContent = '';
    document.getElementById('gameMessage').className = 'message';
    
    renderKeyboard();
    renderGuesses();
    
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('gameView').classList.add('active');
}

function renderKeyboard() {
    let container = document.getElementById('keyboard');
    container.innerHTML = '';
    
    keyboard.forEach(function(row) {
        let rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach(function(key) {
            let keyBtn = document.createElement('button');
            keyBtn.className = 'key' + (key.length > 1 ? ' wide' : '');
            keyBtn.textContent = key;
            keyBtn.onclick = function() { handleKeyPress(key); };
            
            if (keyboardState[key]) {
                keyBtn.classList.add(keyboardState[key]);
            }
            
            rowDiv.appendChild(keyBtn);
        });
        
        container.appendChild(rowDiv);
    });
}

function renderGuesses() {
    let container = document.getElementById('guessesContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < maxAttempts; i++) {
        let guessDiv = document.createElement('div');
        guessDiv.className = 'word-display';
        
        let wordLength = currentPuzzle.word.length;
        for (let j = 0; j < wordLength; j++) {
            let box = document.createElement('div');
            box.className = 'letter-box';
            
            if (guesses[i]) {
                box.textContent = guesses[i].letters[j];
                box.classList.add(guesses[i].states[j]);
            } else if (i === attempts && currentGuess[j]) {
                box.textContent = currentGuess[j];
            }
            
            guessDiv.appendChild(box);
        }
        
        container.appendChild(guessDiv);
    }
}

function handleKeyPress(key) {
    if (attempts >= maxAttempts) return;
    
    let msg = document.getElementById('gameMessage');
    msg.textContent = '';
    
    if (key === '⌫') {
        currentGuess = currentGuess.slice(0, -1);
    } else if (key === 'ENTER') {
        if (currentGuess.length === currentPuzzle.word.length) {
            submitGuess();
        } else {
            msg.textContent = 'Not enough letters!';
            msg.className = 'message error';
        }
    } else if (currentGuess.length < currentPuzzle.word.length) {
        currentGuess += key;
    }
    
    renderGuesses();
}

function submitGuess() {
    let target = currentPuzzle.word;
    let states = [];
    let letterCount = {};
    
    for (let i = 0; i < target.length; i++) {
        letterCount[target[i]] = (letterCount[target[i]] || 0) + 1;
    }
    
    for (let i = 0; i < currentGuess.length; i++) {
        if (currentGuess[i] === target[i]) {
            states[i] = 'correct';
            letterCount[currentGuess[i]]--;
        } else {
            states[i] = 'absent';
        }
    }
    
    for (let i = 0; i < currentGuess.length; i++) {
        if (states[i] === 'absent' && letterCount[currentGuess[i]] > 0) {
            states[i] = 'present';
            letterCount[currentGuess[i]]--;
        }
    }
    
    guesses.push({
        letters: currentGuess.split(''),
        states: states
    });
    
    for (let i = 0; i < currentGuess.length; i++) {
        let letter = currentGuess[i];
        let state = states[i];
        
        if (!keyboardState[letter] || 
            (state === 'correct') ||
            (state === 'present' && keyboardState[letter] !== 'correct')) {
            keyboardState[letter] = state;
        }
    }
    
    attempts++;
    document.getElementById('attemptCount').textContent = attempts;
    
    let msg = document.getElementById('gameMessage');
    
    if (currentGuess === target) {

    if (selectedLetter.day === 10) {
        msg.textContent = '💖 You completed all 10 days! Thank you for playing, my pearl 💖';
    } else {
        msg.textContent = '🎉 Oh my Darling so Intelligent! Have a kissie! mwahhh';
    }

    msg.className = 'message success';
    unlockedLetters[selectedLetter.day] = true;
localStorage.setItem(
    'unlockedLetters',
    JSON.stringify(unlockedLetters)
);
    setTimeout(function() {
        closeGame();
        openLetter(selectedLetter);
    }, 1500);
}
    else if (attempts >= maxAttempts) {
        msg.textContent = 'Almost there, darling ❤️ Give it another try!';
        msg.className = 'message error';
        
        setTimeout(function() {
            closeGame();
        }, 2500);
    }
    
    currentGuess = '';
    renderKeyboard();
    renderGuesses();
}

export function closeGame() {
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('gameView').classList.remove('active');
    renderEnvelopes();
}

export function openLetter(letter) {
    document.getElementById('letterTitle').textContent = letter.title;
    document.getElementById('letterDay').textContent = 'Day ' + letter.day + ' of 10';
    document.getElementById('letterText').textContent = letter.content;
    document.getElementById('letterCard').className = 'letter-card ' + letter.color;
    
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('letterView').classList.add('active');
}

export function closeLetter() {
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('letterView').classList.remove('active');
}

calculateCurrentDay();
renderEnvelopes();

document.addEventListener('keydown', function(e) {
    if (document.getElementById('gameView').classList.contains('active')) {
        let key = e.key.toUpperCase();
        
        if (key === 'BACKSPACE') {
            handleKeyPress('⌫');
        } else if (key === 'ENTER') {
            handleKeyPress('ENTER');
        } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
            handleKeyPress(key);
        }
    }
});

window.closeGame = closeGame
window.openLetter = openLetter
window.closeLetter = closeLetter