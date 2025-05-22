// 1. Canvas Setup
// Make canvas and ctx globally available for tests
window.canvas = document.getElementById('game-canvas');
window.ctx = window.canvas.getContext('2d');
window.canvas.width = 800;
window.canvas.height = 600;

// 2. Game State Variables
// Make these global for test.js
window.score = 0;
window.currentTypedWord = "";
window.fallingWords = []; // Array to hold word objects
window.wordSpawnInterval; // To store the interval ID for spawning words. Accessible by startGame and gameOver
window.level = 1;
window.scoreForNextLevel = 10; // Initial score needed for next level (e.g., 10 for testing)
window.baseWordSpeed = 1; // Base speed for words at level 1
window.baseSpawnInterval = 2000; // Initial spawn interval in milliseconds
window.gameState = 'initial'; // 'initial', 'playing', 'gameOver'

// HTML Elements
// const canvas = document.getElementById('game-canvas'); // Already global
const uiContainer = document.getElementById('ui-container'); // Get the main UI container
const scoreDisplayElement = document.getElementById('score-display');
const levelDisplayElement = document.getElementById('level-display');
window.typedWordDisplayElement = document.getElementById('typed-word-display'); // For test.js
window.messageDisplayElement = document.getElementById('message-display').firstChild.nextSibling; // For test.js
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');


// Game effect variables
let screenFlashColor = null;

// Word Content Arrays
const keyboardKeys = ["Ctrl", "Shift", "Alt", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Enter", "Esc", "Tab", "CapsLock", "Backspace", "Delete", "Home", "End", "PageUp", "PageDown", "Insert", "PrintScreen", "ScrollLock", "PauseBreak", "Meta", "ContextMenu", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const programmingTerms = ["variable", "loop", "if", "else", "function", "print", "array", "string", "integer", "float", "boolean", "true", "false", "null", "undefined", "object", "class", "method", "property", "constructor", "parameter", "argument", "return", "break", "continue", "switch", "case", "default", "for", "while", "do", "try", "catch", "finally", "throw", "import", "export", "module", "package", "library", "framework", "API", "URL", "HTTP", "HTTPS", "JSON", "XML", "HTML", "CSS", "JavaScript", "Python", "Java", "C++", "C#", "Ruby", "PHP", "SQL", "NoSQL", "database", "server", "client", "frontend", "backend", "fullstack", "developer", "programmer", "coder", "algorithm", "data structure", "bug", "debug", "error", "exception", "syntax", "semantic", "compiler", "interpreter", "IDE", "editor", "terminal", "console", "git", "GitHub", "version control", "repository", "commit", "branch", "merge", "pull", "push", "agile", "scrum", "sprint", "waterfall", "comment", "documentation", "test", "testing", "automation"];
const gameWords = [...keyboardKeys, ...programmingTerms];

// 3. Word Object Example: { text: "test", x: 50, y: 0, speed: 1 }

// 4. Initial drawWord function
function drawWord(word) {
    const fontFamily = 'Nunito'; // Ensure this font is loaded via CSS @import
    const fontSize = 24; // Base font size for words
    const boxPadding = 8; // Increased padding for a more "bubbly" look

    // Set font for measuring text width and for drawing
    window.ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const textWidth = window.ctx.measureText(word.text).width;
    const textHeight = fontSize; // Approximate height based on font size

    // Bubble background
    if (!word.isMatched) { // Default bubble for normal words
        window.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; // Semi-transparent white
    } else { // Bubble for matched words (e.g. "+10")
        window.ctx.fillStyle = 'rgba(200, 255, 200, 0.9)'; // Light green semi-transparent
    }
    
    // Draw the bubble rectangle
    // Adjust Y position: word.y is typically the baseline of the text.
    // We want the rectangle to be behind the text, so its top-left y should be word.y - textHeight.
    window.ctx.fillRect(
        word.x - boxPadding,
        word.y - textHeight + (boxPadding / 2) - (boxPadding/2), // Adjusted Y to better center text in bubble
        textWidth + (boxPadding * 2),
        textHeight + boxPadding // Total height of the bubble
    );

    // Text color
    if (word.isMatched) {
        window.ctx.fillStyle = word.color || "darkgreen"; // Darker green for matched text for better contrast
    } else {
        window.ctx.fillStyle = "#333333"; // Dark grey for normal words
    }
    
    // Draw the text on top of the bubble
    window.ctx.fillText(word.text, word.x, word.y);
}

// Function to update the score display
window.updateScoreDisplay = function() {
    scoreDisplayElement.textContent = "Score: " + window.score;
}

// Function to update the level display
window.updateLevelDisplay = function() {
    if (levelDisplayElement) {
        levelDisplayElement.textContent = "Level: " + window.level;
    }
}

// 5. Initial updateGameArea function (Game Loop)
function updateGameArea() {
    if (gameState !== 'playing') {
        // If game is over, ensure the game loop doesn't call itself again.
        // If it's 'initial', it also shouldn't run.
        return;
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Screen Flash Effect for missed words - this is now less relevant as missing a word causes game over
    // if (screenFlashColor) {
    //     ctx.fillStyle = screenFlashColor;
    //     ctx.globalAlpha = 0.5; // Semi-transparent
    //     ctx.fillRect(0, 0, canvas.width, canvas.height);
    //     ctx.globalAlpha = 1.0; // Reset alpha
    //     screenFlashColor = null; // Reset flash color after one frame
    // }

    // Iterate through fallingWords
    for (let i = fallingWords.length - 1; i >= 0; i--) {
        let word = fallingWords[i];
        if (!word.isMatched) { // Only move words that are not yet matched
            word.y += word.speed;
        }
        drawWord(word);

        // Check if word reached bottom (and not already matched)
        if (word.y > canvas.height && !word.isMatched) {
            // console.log(`Word "${word.originalText || word.text}" missed.`); // For debugging
            // screenFlashColor = 'red'; // No longer just flashing
            gameOver();
            return; // Stop processing this frame, game is over
        }
    }
    // Call itself recursively ONLY if still playing
    if (gameState === 'playing') {
        requestAnimationFrame(updateGameArea);
    }
}

// Function to spawn a new word
window.spawnWord = function() {
    if (window.ctx && gameWords.length > 0) { // Ensure ctx is available and words exist
        const text = gameWords[Math.floor(Math.random() * gameWords.length)];
        const textWidth = window.ctx.measureText(text).width;
        const x = Math.max(0, Math.random() * (window.canvas.width - textWidth));
        const y = 0;
        // Speed based on current level
        const speed = window.baseWordSpeed + (window.level * 0.2); // Adjust multiplier as needed

        window.fallingWords.push({ text, x, y, speed });
    }
}

// 6. Initial Keyboard Input Handling
window.addEventListener('keydown', function(event) {
    const key = event.key;

    if (key.length === 1 && key.match(/[a-zA-Z0-9]/i)) { // Letter or number
        currentTypedWord += key;
    } else if (key === 'Enter') {
        let matchedThisTurn = false;
        for (let i = fallingWords.length - 1; i >= 0; i--) {
            let word = fallingWords[i];
            // Check only words that are not already matched
            if (!word.isMatched && word.text.toLowerCase() === currentTypedWord.toLowerCase()) {
                score++; // Or calculate score based on word length, difficulty etc.
                updateScoreDisplay();

                word.isMatched = true;
                word.originalText = word.text; // Store original
                word.text = "+10"; // Example score feedback
                word.color = "green";

                // Remove the word after a delay for visual effect
                setTimeout(() => {
                    const index = fallingWords.indexOf(word);
                    if (index > -1) {
                        fallingWords.splice(index, 1);
                    }
                }, 500); // 500ms delay

                if (score >= scoreForNextLevel) {
                    levelUp();
                }
                matchedThisTurn = true;
                break; // Stop after finding and processing one match
            }
        }

        if (!matchedThisTurn && currentTypedWord.length > 0) {
            // console.log("No match for:", currentTypedWord); // For debugging
            if (typedWordDisplayElement) {
                typedWordDisplayElement.style.backgroundColor = 'lightcoral';
                setTimeout(() => {
                    if (typedWordDisplayElement) { // Check again in case it's gone
                        typedWordDisplayElement.style.backgroundColor = ''; // Revert to original
                    }
                }, 200);
            }
        }
        currentTypedWord = ""; // Clear typed word regardless of match
    } else if (key === 'Backspace') {
        currentTypedWord = currentTypedWord.substring(0, currentTypedWord.length - 1);
    }

    // Update the typed word display
    if (typedWordDisplayElement) {
        typedWordDisplayElement.textContent = currentTypedWord;
    }
});

// Function to handle leveling up
window.levelUp = function() {
    window.level++;
    window.scoreForNextLevel += 10; // Increase score needed for next level (e.g. L1=10, L2=20, L3=30 for testing)
    // Or use a scaling factor: scoreForNextLevel = level * 100;
    window.updateLevelDisplay();

    if (window.messageDisplayElement) {
        window.messageDisplayElement.textContent = "Level Up! Level " + window.level;
        setTimeout(() => {
            // Clear message only if it's the "Level Up" message for the current level
            if (window.messageDisplayElement.textContent === "Level Up! Level " + window.level) {
                 window.messageDisplayElement.textContent = "";
            }
        }, 3000); // Clear message after 3 seconds
    }

    // Adjust difficulty: Clear the current wordSpawnInterval
    clearInterval(window.wordSpawnInterval);
    // Calculate a new spawn interval, ensuring it doesn't become too fast
    const newSpawnInterval = Math.max(500, window.baseSpawnInterval - (window.level * 100)); // Adjust formula and minimum interval
    // Set the new interval
    window.wordSpawnInterval = setInterval(window.spawnWord, newSpawnInterval);
    // console.log(`Level Up! New spawn interval: ${newSpawnInterval}, New base speed for words will be influenced by level: ${baseWordSpeed + (level * 0.2)}`); // For debugging
}

// Function to handle Game Over state
function gameOver() {
    gameState = 'gameOver';
    clearInterval(wordSpawnInterval); // Stop new words from spawning
    if (messageDisplayElement) { // Ensure element exists
        messageDisplayElement.textContent = "Game Over! Final Score: " + score;
    }
    if (restartButton) restartButton.style.display = 'block'; // Show restart button
    // Optional: Hide canvas or parts of UI
    // canvas.style.display = 'none';
}


// 7. Start the game
function startGame() {
    gameState = 'playing';

    // Reset game state
    score = 0;
    level = 1;
    scoreForNextLevel = 10;
    currentTypedWord = "";
    if(typedWordDisplayElement) typedWordDisplayElement.textContent = "";
    fallingWords = [];

    updateScoreDisplay();
    updateLevelDisplay();
    if (messageDisplayElement) messageDisplayElement.textContent = ""; // Clear any old messages

    // UI updates
    if (startButton) startButton.style.display = 'none';
    if (restartButton) restartButton.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    if (uiContainer) uiContainer.style.display = 'flex';


    // Clear any existing wordSpawnInterval (if restarting the game)
    if (wordSpawnInterval) {
        clearInterval(wordSpawnInterval);
    }
    // Set the initial wordSpawnInterval using baseSpawnInterval
    wordSpawnInterval = setInterval(spawnWord, baseSpawnInterval);

    requestAnimationFrame(updateGameArea); // Kick off the game loop using requestAnimationFrame
}

// Event Listeners for Buttons
if (startButton) startButton.addEventListener('click', startGame);
if (restartButton) restartButton.addEventListener('click', startGame);


// Initial UI State Setup - Run when script loads
window.initializeUI = function() {
    if (startButton) startButton.style.display = 'block';
    if (restartButton) restartButton.style.display = 'none';
    if (window.canvas) window.canvas.style.display = 'none';
    if (uiContainer) uiContainer.style.display = 'none'; // Hide main game UI
    // Check if messageDisplayElement has a parentNode before inserting text
    if (window.messageDisplayElement && window.messageDisplayElement.parentNode && window.gameState === 'initial') { 
         // Clear previous messages before adding new one
        let existingTextNode = window.messageDisplayElement.previousSibling;
        if (existingTextNode && existingTextNode.nodeType === Node.TEXT_NODE) {
            existingTextNode.parentNode.removeChild(existingTextNode);
        }
        window.messageDisplayElement.parentNode.insertBefore(document.createTextNode("Press Start Game to Play!"), window.messageDisplayElement);
    } else if (window.messageDisplayElement && window.messageDisplayElement.parentNode && !window.messageDisplayElement.textContent) {
        let existingTextNode = window.messageDisplayElement.previousSibling;
        if (existingTextNode && existingTextNode.nodeType === Node.TEXT_NODE) {
            existingTextNode.parentNode.removeChild(existingTextNode);
        }
        window.messageDisplayElement.parentNode.insertBefore(document.createTextNode("Press Start Game to Play!"), window.messageDisplayElement);
    }
}

// Call to set the initial UI state when the script is loaded
window.initializeUI();
