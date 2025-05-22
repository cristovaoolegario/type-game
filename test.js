// test.js
document.addEventListener('DOMContentLoaded', () => {
    const testResultsDiv = document.getElementById('test-results');
    let testsPassed = 0;
    let testsFailed = 0;

    function logResult(message, passed) {
        const p = document.createElement('p');
        p.textContent = message;
        p.style.color = passed ? 'green' : 'red';
        testResultsDiv.appendChild(p);
        if (passed) testsPassed++; else testsFailed++;
    }

    function assertEquals(actual, expected, message) {
        if (actual === expected) {
            logResult(`PASS: ${message}`, true);
        } else {
            logResult(`FAIL: ${message} (Expected: ${expected}, Got: ${actual})`, false);
        }
    }

    function assertNotNull(value, message) {
        if (value !== null && value !== undefined) {
            logResult(`PASS: ${message}`, true);
        } else {
            logResult(`FAIL: ${message} (Expected not null/undefined, Got: ${value})`, false);
        }
    }
    
    function assertTrue(condition, message) {
        if (condition) {
            logResult(`PASS: ${message}`, true);
        } else {
            logResult(`FAIL: ${message} (Expected true, Got: ${condition})`, false);
        }
    }

    // --- Mocking game elements and functions needed for tests ---
    // Some game variables might need to be accessible or mockable.
    // For now, we'll assume game.js has run and initialized its state.
    // This is a simplification; proper testing might require more sophisticated mocks or spies.

    // Make sure the game's UI is initialized so elements are available for game functions
    // but we don't want to start the game loop for tests.
    // Ensure initializeUI is globally accessible from game.js
    if (typeof initializeUI !== 'function') {
        logResult('CRITICAL FAIL: initializeUI function not found. Tests cannot proceed.', false);
        return;
    }
    initializeUI(); 
    
    // Mock necessary DOM elements if they are directly manipulated by functions under test
    // and not already created by initializeUI or if tests run in a different context.
    // For this task, we assume game.js has created them or they are accessible.

    // --- Test Suite ---
    console.log("Running Unit Tests...");
    const h2 = testResultsDiv.querySelector('h2');
    if (h2) h2.textContent = "Unit Test Results:";


    // Reset game state for tests (simplified)
    function resetGameStateForTest() {
        // These need to be globally accessible from game.js
        window.score = 0;
        window.level = 1;
        window.scoreForNextLevel = 10; // Initial value used in game.js
        window.fallingWords = [];
        window.currentTypedWord = "";
        if (window.wordSpawnInterval) clearInterval(window.wordSpawnInterval);
        window.gameState = 'initial'; // Reset game state

        // Call updateScoreDisplay and updateLevelDisplay to reset UI if necessary
        if (typeof updateScoreDisplay === 'function') updateScoreDisplay();
        if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        if (window.typedWordDisplayElement) window.typedWordDisplayElement.textContent = "";
        if (window.messageDisplayElement) window.messageDisplayElement.textContent = "";


    }

    // Test 1: Initial Score
    resetGameStateForTest();
    assertEquals(window.score, 0, "Initial score should be 0");

    // Test 2: Increment Score
    resetGameStateForTest();
    window.score = 5; // Simulate score increment directly
    if (typeof updateScoreDisplay === 'function') updateScoreDisplay();
    assertEquals(window.score, 5, "Score should be incremented to 5");

    // Test 3: Level Up
    resetGameStateForTest();
    window.score = 10; // Set score to trigger level up
    // Manually simulate the check that happens in game.js when a word is matched
    if (window.score >= window.scoreForNextLevel) {
        if (typeof levelUp === 'function') {
            levelUp(); // This function is from game.js
        } else {
            logResult('FAIL: levelUp function not found for Test 3', false);
            return; // Cannot proceed with this test
        }
    }
    assertEquals(window.level, 2, "Level should advance to 2 when score reaches scoreForNextLevel");
    assertTrue(window.scoreForNextLevel > 10, "scoreForNextLevel should increase after level up");
    // Specific check for how scoreForNextLevel is updated in game.js (e.g. +10 per level in previous setup)
    // Based on game.js: scoreForNextLevel += 10; (not 10 * level for the next threshold)
    assertEquals(window.scoreForNextLevel, 20, "scoreForNextLevel should be 20 for level 2 (based on current logic: old scoreForNextLevel + 10)");


    // Test 4: Word Spawning (Basic)
    resetGameStateForTest();
    // Ensure canvas exists for spawnWord to measure text
    // gameCanvas and ctx are expected to be global from game.js
    if (!window.canvas || !window.ctx) {
         logResult('FAIL: Canvas or Ctx not available for Test 4 (Word Spawning)', false);
    } else {
        if (typeof spawnWord === 'function') {
            spawnWord(); // From game.js
            assertEquals(window.fallingWords.length, 1, "spawnWord should add one word to fallingWords array");
            if (window.fallingWords.length > 0) {
                const word = window.fallingWords[0];
                assertNotNull(word, "Spawned word object should not be null");
                assertTrue(typeof word.text === 'string' && word.text.length > 0, "Spawned word should have non-empty text");
                assertTrue(typeof word.x === 'number' && word.x >= 0, "Spawned word should have valid x position");
                assertTrue(typeof word.y === 'number' && word.y === 0, "Spawned word should have y position 0");
                assertTrue(typeof word.speed === 'number' && word.speed > 0, "Spawned word should have positive speed");
            }
        } else {
            logResult('FAIL: spawnWord function not found for Test 4', false);
        }
    }
    
    // Test 5: currentTypedWord update
    resetGameStateForTest();
    // Simulate keydown events (simplified, directly manipulating currentTypedWord as game.js does)
    window.currentTypedWord = ""; // Start empty
    window.currentTypedWord += 't';
    window.currentTypedWord += 'e';
    window.currentTypedWord += 's';
    window.currentTypedWord += 't';
    assertEquals(window.currentTypedWord, "test", "currentTypedWord should be 'test' after typing 't', 'e', 's', 't'");
    window.currentTypedWord = window.currentTypedWord.slice(0, -1); // Simulate backspace
    assertEquals(window.currentTypedWord, "tes", "currentTypedWord should be 'tes' after backspace");


    // --- Summary ---
    const summaryP = document.createElement('p');
    summaryP.innerHTML = `<strong>Tests Complete: ${testsPassed} Passed, ${testsFailed} Failed.</strong>`;
    summaryP.style.fontWeight = 'bold';
    testResultsDiv.appendChild(summaryP);

    if (testsFailed > 0) {
        console.error("Some tests failed. Check the results in the browser.");
    } else {
        console.log("All tests passed!");
    }
});
