let dictionary = [];

const lettersInput  = document.getElementById("letters");
const solveBtn      = document.getElementById("solveBtn");
const timerDisplay  = document.getElementById("timerDisplay");
const inputError    = document.getElementById("inputError");
const resultsDiv    = document.getElementById("results");
const tiles         = document.querySelectorAll(".tile");

// ─── Tile sync ────────────────────────────────────────────────────────────────

function updateTiles() {
    const sanitized = lettersInput.value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 6);

    // FIX: write sanitized value back so the input and tiles stay in sync.
    // Previously, typing "ab1cd" showed "ABCD" on tiles but "ab1cd" in the box.
    lettersInput.value = sanitized;

    tiles.forEach((tile, i) => {
        tile.textContent = sanitized[i] || "";
    });

    // Clear any stale error when the user starts typing again
    showError("");
}

lettersInput.addEventListener("input", updateTiles);

// ─── Inline error (replaces alert()) ─────────────────────────────────────────

function showError(message) {
    inputError.textContent = message;
}

// ─── Dictionary loading ───────────────────────────────────────────────────────

async function loadDictionary() {
    // FIX: disable Solve while the dictionary fetch is in progress so users
    // can't run a search against an empty word list on slow connections.
    solveBtn.disabled = true;
    timerDisplay.textContent = "Loading…";

    try {
        const response = await fetch("dictionary.txt");

        if (!response.ok) throw new Error("HTTP " + response.status);

        const text = await response.text();

        dictionary = text
            .split("\n")
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0);

        // FIX: replaced the two getElementById("status") calls that referenced
        // a non-existent element (would have thrown TypeError on every load).
        // The timer card now doubles as a status display.
        timerDisplay.textContent = "Ready";
        solveBtn.disabled = false;

    } catch (err) {
        timerDisplay.textContent = "Error";
        showError("Failed to load dictionary. Check the console.");
        console.error("Dictionary load failed:", err);
    }
}

// ─── Word finding ─────────────────────────────────────────────────────────────

function canBuildWord(word, letters) {
    const available = {};
    for (const ch of letters) available[ch] = (available[ch] || 0) + 1;
    for (const ch of word) {
        if (!available[ch]) return false;
        available[ch]--;
    }
    return true;
}

function findWords(letters) {
    return dictionary.filter(word =>
        word.length >= 2 &&
        word.length <= letters.length &&
        canBuildWord(word, letters)
    );
}

// ─── Results display ──────────────────────────────────────────────────────────

function displayResults(words, solveMs) {
    document.getElementById("wordCount").textContent = words.length;

    // Reuse the timer card to show how long the search took
    timerDisplay.textContent = `${solveMs}ms`;

    if (words.length === 0) {
        resultsDiv.innerHTML = "<p class='no-results'>No words found.</p>";
        resultsDiv.hidden = false;
        return;
    }

    const grouped = {};
    for (const word of words) {
        const len = word.length;
        if (!grouped[len]) grouped[len] = [];
        grouped[len].push(word);
    }

    // FIX: removed the redundant <h2>X Words Found</h2> — the score card
    // already shows that count, so it was displayed twice.
    let html = "";

    Object.keys(grouped)
        .sort((a, b) => b - a)
        .forEach(len => {
            const sorted = grouped[len].slice().sort();
            html += `<div class="word-group">
                        <h3>${len} Letters <span class="group-count">(${sorted.length})</span></h3>`;
            sorted.forEach(word => {
                html += `<span class="word">${word}</span>`;
            });
            html += `</div>`;
        });

    resultsDiv.innerHTML = html;

    // FIX: reveal the panel only after content is ready; it starts hidden so
    // the empty white box no longer appears on page load.
    resultsDiv.hidden = false;
}

// ─── Events ───────────────────────────────────────────────────────────────────

solveBtn.addEventListener("click", () => {
    const letters = lettersInput.value
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    if (letters.length === 0) {
        // FIX: replaced alert() with an inline error message
        showError("Please enter some letters first.");
        return;
    }

    const t0      = performance.now();
    const words   = findWords(letters);
    const elapsed = Math.round(performance.now() - t0);

    displayResults(words, elapsed);
});

// FIX: replaced deprecated "keypress" event with "keydown"
lettersInput.addEventListener("keydown", e => {
    if (e.key === "Enter") solveBtn.click();
});

loadDictionary();
