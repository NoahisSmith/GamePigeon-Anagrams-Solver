let dictionary = [];

const lettersInput = document.getElementById("letters");
const tiles = document.querySelectorAll(".tile");

function updateTiles() {
    const letters = lettersInput.value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 6);

    tiles.forEach((tile, index) => {
        tile.textContent = letters[index] || "";
    });
}

lettersInput.addEventListener("input", updateTiles);

async function loadDictionary() {
    try {
        const response = await fetch("dictionary.txt");

        if (!response.ok) {
            throw new Error("Failed to load dictionary");
        }

        const text = await response.text();

        dictionary = text
            .split("\n")
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0);

        document.getElementById("status").textContent =
            `Dictionary Loaded (${dictionary.length} words)`;

    } catch (error) {
        document.getElementById("status").textContent =
            "Error loading dictionary.";

        document.getElementById("status").classList.add("error");

        console.error(error);
    }
}

function canBuildWord(word, letters) {
    const available = {};

    for (const letter of letters) {
        available[letter] = (available[letter] || 0) + 1;
    }

    for (const letter of word) {
        if (!available[letter]) {
            return false;
        }

        available[letter]--;
    }

    return true;
}

function findWords(letters) {
    letters = letters.toLowerCase();

    return dictionary.filter(word => {
        return (
            word.length >= 2 &&
            word.length <= letters.length &&
            canBuildWord(word, letters)
        );
    });
}

function displayResults(words) {
    const resultsDiv = document.getElementById("results");

    if (words.length === 0) {
        resultsDiv.innerHTML = "<p>No words found.</p>";
        return;
    }

    const grouped = {};

    for (const word of words) {
        const length = word.length;

        if (!grouped[length]) {
            grouped[length] = [];
        }

        grouped[length].push(word);
    }

    let html = `<h2>${words.length} Words Found</h2>`;

    Object.keys(grouped)
        .sort((a, b) => b - a)
        .forEach(length => {

            html += `
                <div class="word-group">
                    <h3>${length} Letters (${grouped[length].length})</h3>
            `;

            grouped[length]
                .sort()
                .forEach(word => {
                    html += `<span class="word">${word}</span>`;
                });

            html += `</div>`;
        });

    resultsDiv.innerHTML = html;
}

document.getElementById("solveBtn").addEventListener("click", () => {
    const letters = document
        .getElementById("letters")
        .value
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    if (letters.length === 0) {
        alert("Please enter letters.");
        return;
    }

    const words = findWords(letters);

    displayResults(words);
});

document
    .getElementById("letters")
    .addEventListener("keypress", event => {
        if (event.key === "Enter") {
            document.getElementById("solveBtn").click();
        }
    });

loadDictionary();