let gameMode = 0;
let players = [];
let currentPlayerIndex = 0;
let currentThrow = 1;
let scores = {};
let roundScores = {};

// Sprawdzenie, czy istnieje zapisany stan gry w localStorage
function loadGameState() {
  const savedState = localStorage.getItem("dartGameState");
  if (savedState) {
    const state = JSON.parse(savedState);
    gameMode = state.gameMode;
    players = state.players;
    currentPlayerIndex = state.currentPlayerIndex;
    currentThrow = state.currentThrow;
    scores = state.scores;
    roundScores = state.roundScores;

    document.getElementById("mode").style.display = "none";
    document.getElementById("players").style.display = "none";
    document.getElementById("game").style.display = "block";

    updateActivePlayer();
    generateDartboardButtons();
    updateDrawer();
  }
}

// Zapisywanie stanu gry do localStorage
function saveGameState() {
  const state = {
    gameMode,
    players,
    currentPlayerIndex,
    currentThrow,
    scores,
    roundScores,
  };
  localStorage.setItem("dartGameState", JSON.stringify(state));
}

function setGameMode(input) {
  gameMode = input;
  console.log(`Game mode set to: ${gameMode}`);
  document.getElementById("mode").style.display = "none";
  document.getElementById("players").style.display = "block";
}

function addPlayerToList() {
  const playerInput = document.getElementById("playerInput");
  const playerName = playerInput.value.trim();

  if (playerName === "") {
    alert("Enter player name!");
    return;
  }

  players.push(playerName);
  scores[playerName] = gameMode;
  roundScores[playerName] = 0;

  const playersList = document.querySelector(".playersList");
  const listItem = document.createElement("li");
  listItem.textContent = playerName;

  const removeButton = document.createElement("button");
  removeButton.textContent = "✖";
  removeButton.classList.add("remove-btn");
  removeButton.onclick = function () {
    players = players.filter((player) => player !== playerName);
    delete scores[playerName];
    delete roundScores[playerName];
    playersList.removeChild(listItem);
    saveGameState();
  };

  listItem.appendChild(removeButton);
  playersList.appendChild(listItem);
  playerInput.value = "";

  saveGameState();
}

function startGame() {
  if (players.length < 2) {
    alert("Add at least 2 players!");
    return;
  }

  document.getElementById("players").style.display = "none";
  document.getElementById("game").style.display = "block";

  updateActivePlayer();
  generateDartboardButtons();
  updateDrawer();
  saveGameState();
}

function updateActivePlayer() {
  document.getElementById("activePlayer").textContent = `${
    players[currentPlayerIndex]
  } (${currentThrow}/3) ${roundScores[players[currentPlayerIndex]]}`;
}

function submitScore(points) {
  const currentPlayer = players[currentPlayerIndex];
  roundScores[currentPlayer] += points;

  if (currentThrow < 3) {
    currentThrow++;
  } else {
    const roundPoints = roundScores[currentPlayer];

    if (scores[currentPlayer] - roundPoints < 0) {
      alert(`Too much points! Round skipped.`);
    } else {
      scores[currentPlayer] -= roundPoints;
      alert(`Player ${currentPlayer} threw ${roundPoints} points!`);
    }

    if (scores[currentPlayer] === 0) {
      alert(`${currentPlayer} has won! Game finished.`);
      resetGame();
      return;
    }

    roundScores[currentPlayer] = 0;
    currentThrow = 1;
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  }

  updateActivePlayer();
  updateDrawer();
  saveGameState();
}

function resetGame() {
  gameMode = 0;
  players = [];
  currentPlayerIndex = 0;
  currentThrow = 1;
  scores = {};
  roundScores = {};

  localStorage.removeItem("dartGameState");

  document.getElementById("game").style.display = "none";
  document.getElementById("players").style.display = "none";
  document.getElementById("mode").style.display = "block";
  document.querySelector(".playersList").innerHTML = "";
}

function handleDartThrow(points) {
  submitScore(points);
}

function generateDartboardButtons() {
  const dartboard = document.getElementById("dartboard");
  if (!dartboard) {
    console.error("Nie znaleziono kontenera dartboard!");
    return;
  }
  dartboard.innerHTML = "";
  const values = [...Array.from({ length: 20 }, (_, i) => i + 1), 25, 50];
  values.forEach((value) => {
    const button = createDartButton(value, `${value}`);
    dartboard.appendChild(button);
    if (value !== 25 && value !== 50) {
      dartboard.appendChild(createDartButton(value * 2, `D${value}`));
      dartboard.appendChild(createDartButton(value * 3, `T${value}`));
    }
  });
  const missButton = document.createElement("button");
  missButton.textContent = "Miss";
  missButton.classList.add("dart-btn", "miss-btn");
  missButton.onclick = () => handleDartThrow(0);
  dartboard.appendChild(missButton);
}

function createDartButton(points, label) {
  const button = document.createElement("button");
  button.textContent = label;
  button.classList.add("dart-btn");
  button.onclick = () => handleDartThrow(points);
  return button;
}

function toggleDrawer() {
  document.getElementById("drawer").classList.toggle("open");
}

function updateDrawer() {
  const scoreList = document.getElementById("scoreList");
  scoreList.innerHTML = "";
  players.forEach((player) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${player}: ${scores[player]}`;
    scoreList.appendChild(listItem);
  });
}

// Ładowanie zapisanego stanu gry po odświeżeniu strony
document.addEventListener("DOMContentLoaded", () => {
  loadGameState();
  generateDartboardButtons();
});
