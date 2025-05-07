let gameMode = 0;
let players = [];
let currentPlayerIndex = 0;
let currentThrow = 1;
let scores = {};
let roundScores = {};
let throwHistory = []; // Historia rzutów do cofania
let playerIndices = {}; // Indeksy dla graczy o tych samych nazwach

document.addEventListener('touchmove', function(event) {
  if (event.scale !== 1) {
    event.preventDefault();
  }
}, { passive: false });

// Blokowanie podwójnego tapnięcia, które może powodować przybliżanie
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

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
    throwHistory = state.throwHistory || [];
    playerIndices = state.playerIndices || {};

    document.getElementById("mode").style.display = "none";
    document.getElementById("players").style.display = "none";
    document.getElementById("game").style.display = "block";

    updateActivePlayer();
    generateDartboardButtons();
    updateDrawer();
    updateRemainingPoints();
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
    throwHistory,
    playerIndices
  };
  localStorage.setItem("dartGameState", JSON.stringify(state));
}

window.setGameMode = function(input) {
  gameMode = input;
  console.log(`Game mode set to: ${gameMode}`);
  document.getElementById("mode").style.display = "none";
  document.getElementById("players").style.display = "block";
}

function addPlayerToList() {
  const playerInput = document.getElementById("playerInput");
  const playerName = playerInput.value.trim();

  // Podstawowa walidacja
  if (playerName === "") {
    showNotification("Enter player name!", "error");
    return;
  }

  // Walidacja długości
  if (playerName.length < 2) {
    showNotification("Player name must be at least 2 characters long!", "error");
    return;
  }

  if (playerName.length > 20) {
    showNotification("Player name cannot be longer than 20 characters!", "error");
    return;
  }

  // Walidacja znaków
  if (!/^[a-zA-Z0-9\s]+$/.test(playerName)) {
    showNotification("Player name can only contain letters, numbers, and spaces!", "error");
    return;
  }

  // Sprawdzenie czy nazwa nie składa się tylko z cyfr
  if (/^[0-9]+$/.test(playerName)) {
    showNotification("Player name cannot consist only of numbers!", "error");
    return;
  }

  // Sprawdź, czy gracz o tej nazwie już istnieje i dodaj indeks
  let uniquePlayerName = playerName;
  if (players.includes(playerName)) {
    // Sprawdź, czy mamy już indeks dla tego gracza
    if (!playerIndices[playerName]) {
      playerIndices[playerName] = 1;
    }
    // Zwiększ indeks i utwórz unikalną nazwę
    playerIndices[playerName]++;
    uniquePlayerName = `${playerName} (${playerIndices[playerName]})`;
  }

  players.push(uniquePlayerName);
  scores[uniquePlayerName] = gameMode;
  roundScores[uniquePlayerName] = 0;

  const playersList = document.querySelector(".playersList");
  const listItem = document.createElement("li");
  listItem.textContent = uniquePlayerName;

  const removeButton = document.createElement("button");
  removeButton.textContent = "✖";
  removeButton.classList.add("remove-btn");
  removeButton.onclick = function () {
    players = players.filter((player) => player !== uniquePlayerName);
    delete scores[uniquePlayerName];
    delete roundScores[uniquePlayerName];
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
  updateDrawer();
  updateRemainingPoints();
  saveGameState();
  
  // Generuj przyciski po załadowaniu gry
  generateDartboardButtons();
}

function updateActivePlayer() {
  const currentPlayer = players[currentPlayerIndex];
  document.getElementById("activePlayer").textContent = `${currentPlayer} (${currentThrow}/3) ${roundScores[currentPlayer]}`;
  
  // Aktualizuj przycisk cofania - aktywny tylko jeśli jest historia rzutów
  const undoButton = document.getElementById("undoButton");
  if (undoButton) {
    undoButton.disabled = throwHistory.length === 0;
  }
  
  updateRemainingPoints();
}

function updateRemainingPoints() {
  const currentPlayer = players[currentPlayerIndex];
  const remainingPoints = scores[currentPlayer] - roundScores[currentPlayer];
  const remainingPointsElement = document.getElementById("remainingPoints");
  
  if (remainingPointsElement) {
    if (scores[currentPlayer] <= 180) {
      remainingPointsElement.textContent = `Pozostało: ${remainingPoints}`;
      remainingPointsElement.style.display = "block";
      
      // Dodaj wskazówkę dotyczącą checkout
      if (remainingPoints <= 170) {
        const checkoutHint = getCheckoutHint(remainingPoints);
        if (checkoutHint) {
          remainingPointsElement.innerHTML = `Pozostało: ${remainingPoints}<br><span class="checkout-hint">${checkoutHint}</span>`;
        }
      }
    } else {
      remainingPointsElement.style.display = "none";
    }
  }
}

// Funkcja zwracająca wskazówkę dotyczącą checkout dla popularnych wartości
function getCheckoutHint(points) {
  const checkouts = {
    170: "T20 T20 Bull",
    167: "T20 T19 Bull",
    164: "T20 T18 Bull",
    161: "T20 T17 Bull",
    160: "T20 T20 D20",
    60: "T20",
    57: "T19",
    54: "T18",
    40: "D20",
    36: "D18",
    32: "D16",
    24: "D12",
    20: "D10",
    16: "D8",
    10: "D5",
    8: "D4",
    4: "D2",
    2: "D1"
  };
  
  return checkouts[points] || "";
}

function showHelp() {
  document.getElementById("helpModal").style.display = "block";
}

function closeHelp() {
  document.getElementById("helpModal").style.display = "none";
}

// Zamykanie modalu po kliknięciu poza jego obszarem
window.onclick = (event) => {
  const modal = document.getElementById("helpModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}

function addThrowToHistory(player, points) {
  const scoreRows = document.getElementById("scoreRows");
  if (!scoreRows) return;

  // Znajdź wiersz gracza
  const playerRow = Array.from(scoreRows.children).find(row => 
    row.querySelector('.player-name').textContent === player
  );

  if (playerRow) {
    // Zaktualizuj punkty rundy
    const roundScore = playerRow.querySelector('.round-score');
    if (roundScore) {
      const currentRoundScore = parseInt(roundScore.textContent) || 0;
      roundScore.textContent = currentRoundScore + points;
    }
  }

  // Aktualizuj wyświetlanie
  updateDrawer();
}

function submitScore(points) {
  const currentPlayer = players[currentPlayerIndex];
  
  // Zapisz stan przed rzutem do historii
  throwHistory.push({
    playerIndex: currentPlayerIndex,
    throwNumber: currentThrow,
    playerScore: scores[currentPlayer],
    roundScore: roundScores[currentPlayer],
    points: points,
    fullRoundScore: roundScores[currentPlayer] + points // zapisz pełną sumę rundy
  });
  
  roundScores[currentPlayer] += points;

  // Dodaj rzut do historii
  addThrowToHistory(currentPlayer, points);

  if (currentThrow < 3) {
    currentThrow++;
    updateActivePlayer();
    return;
  }

  // Zakończ rundę
  currentThrow = 1;
  const roundPoints = roundScores[currentPlayer];

  if (scores[currentPlayer] - roundPoints < 0) {
    showNotification(`Za dużo punktów! Runda pominięta.`, "error");
    roundScores[currentPlayer] = 0;
  } else {
    scores[currentPlayer] -= roundPoints;
    roundScores[currentPlayer] = 0;

    // Użyj nieinwazyjnego powiadomienia zamiast alert
    showNotification(`${currentPlayer} zdobył ${roundPoints} punktów!`);

    if (scores[currentPlayer] === 0) {
      showWinNotification(`${currentPlayer} wygrał! Gra zakończona.`);
      return;
    }
  }

  // Przechodź do następnego gracza tylko raz
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updateActivePlayer();
  updateDrawer();
  updateRemainingPoints();
  saveGameState();
}

// Funkcja cofania ostatniego rzutu
function undoLastThrow() {
  if (throwHistory.length === 0) {
    showNotification("Nie ma rzutów do cofnięcia!", "error");
    return;
  }
  
  // Pobierz ostatni rzut z historii
  const lastThrow = throwHistory.pop();
  
  // Przywróć stan gry
  currentPlayerIndex = lastThrow.playerIndex;
  currentThrow = lastThrow.throwNumber;
  const currentPlayer = players[currentPlayerIndex];
  scores[currentPlayer] = lastThrow.playerScore;
  roundScores[currentPlayer] = lastThrow.roundScore;
  
  // Aktualizuj interfejs
  updateActivePlayer();
  updateDrawer();
  updateRemainingPoints();
  saveGameState();
  
  showNotification("Cofnięto ostatni rzut", "info");
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.classList.add(`notification-${type}`);
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

function showWinNotification(message) {
  // Znajdź lub utwórz element powiadomienia
  const notification = document.querySelector('.win-notification') || document.createElement('div');
  notification.className = 'win-notification';
  notification.innerHTML = `
    <div class="win-message">${message}</div>
    <div class="win-buttons">
      <button class="btn" onclick="restartGame(true)">Play Again</button>
      <button class="btn" onclick="restartGame(false)">New Game</button>
    </div>
  `;
  
  // Dodaj do body jeśli nie istnieje
  if (!document.querySelector('.win-notification')) {
    document.body.appendChild(notification);
  }

  // Pokaż powiadomienie
  notification.classList.add('show');

  // Dodaj obsługę kliknięcia na przyciski
  const buttons = notification.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    });
  });

  // Dodaj obsługę kliknięcia poza powiadomieniem
  notification.addEventListener('click', (e) => {
    if (e.target === notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }
  });
}

function restartGame(reverseOrder = false) {
  if (reverseOrder) {
    // Odwróć kolejność graczy
    players.reverse();
    currentPlayerIndex = 0;
    
    // Resetuj wszystkie wartości
    currentThrow = 1;
    roundScores = players.reduce((acc, player) => ({ ...acc, [player]: 0 }), {});
    scores = players.reduce((acc, player) => ({ ...acc, [player]: gameMode }), {});
    updateActivePlayer();
    updateDrawer();
    updateRemainingPoints();
    saveGameState();
  } else {
    // Potwierdzenie przed resetem gry
    if (confirm("Do you want to reset game?")) {
      // Resetuj grę od nowa
      gameMode = 0;
      players = [];
      currentPlayerIndex = 0;
      currentThrow = 1;
      scores = {};
      roundScores = {};
      throwHistory = [];
      playerIndices = {};

      localStorage.removeItem("dartGameState");

      document.getElementById("game").style.display = "none";
      document.getElementById("players").style.display = "none";
      document.getElementById("mode").style.display = "block";
      document.querySelector(".playersList").innerHTML = "";
    }
  }
}

// Funkcja resetująca grę
window.resetGame = function() {
  restartGame(false);
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
  
  // Standardowe przyciski
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
  const scoreRows = document.getElementById("scoreRows");
  scoreRows.innerHTML = "";
  
  // Zaktualizuj nagłówek z numerem rundy
  const roundHeader = document.querySelector(".round-header");
  if (roundHeader) {
    roundHeader.textContent = `Round ${Math.ceil(currentThrow / 3)}`;
  }
  
  players.forEach((player) => {
    const row = document.createElement("div");
    row.className = `table-row ${player === players[currentPlayerIndex] ? 'active' : ''}`;
    
    const playerName = document.createElement("div");
    playerName.className = "table-cell player-name";
    playerName.textContent = player;
    
    const scoreValue = document.createElement("div");
    scoreValue.className = "table-cell score-value";
    scoreValue.textContent = scores[player];

    // Znajdź wynik z poprzedniej rundy
    const lastRoundScore = throwHistory
      .filter(throwData => throwData.playerIndex === players.indexOf(player))
      .filter(throwData => throwData.throwNumber % 3 === 0) // tylko końce rund
      .pop(); // weź ostatni rzut (ostatnią rundę)

    const lastRoundCell = document.createElement("div");
    lastRoundCell.className = "table-cell round-score";
    lastRoundCell.textContent = lastRoundScore ? lastRoundScore.fullRoundScore : "-";
    
    row.appendChild(playerName);
    row.appendChild(scoreValue);
    row.appendChild(lastRoundCell);
    
    scoreRows.appendChild(row);
  });
}

// Funkcja do przełączania widoku dartboard
function toggleDartboardView() {
  const dartboard = document.getElementById("dartboard");
  const isCompact = dartboard.classList.toggle("compact-view");
  
  localStorage.setItem("dartboardCompactView", isCompact);
  
  const viewToggleBtn = document.getElementById("viewToggleBtn");
  if (viewToggleBtn) {
    viewToggleBtn.textContent = isCompact ? "Full view" : "Compact view";
  }
}

// Funkcja do zapisywania statystyk graczy
function savePlayerStats() {
  const playerStats = JSON.parse(localStorage.getItem("dartPlayerStats") || "{}");
  
  players.forEach(player => {
    if (!playerStats[player]) {
      playerStats[player] = {
        gamesPlayed: 0,
        wins: 0,
        highestScore: 0,
        averageScore: 0,
        totalScore: 0,
        totalThrows: 0
      };
    }
    
    // Aktualizuj statystyki dla wszystkich graczy
    playerStats[player].gamesPlayed++;
    
    // Jeśli gracz wygrał (ma 0 punktów)
    if (scores[player] === 0) {
      playerStats[player].wins++;
    }
    
    // Zapisz statystyki
    localStorage.setItem("dartPlayerStats", JSON.stringify(playerStats));
  });
}
document.addEventListener("keydown", (event) => {
  // Obsługa klawiszy numerycznych 1-9
  if (event.key >= "1" && event.key <= "9") {
    handleDartThrow(Number.parseInt(event.key));
  }
  // Obsługa klawisza 0 dla 10 punktów
  else if (event.key === "0") {
    handleDartThrow(10);
  }
  // Obsługa klawisza D dla podwójnych (np. D2 dla podwójnej dwójki)
  else if (event.key.toUpperCase() === "D" && !event.ctrlKey && !event.altKey) {
    const doubleMode = true;
    document.addEventListener(
      "keydown",
      function doubleListener(e) {
        if (e.key >= "1" && e.key <= "9") {
          handleDartThrow(Number.parseInt(e.key) * 2);
          document.removeEventListener("keydown", doubleListener);
        }
      },
      { once: true },
    );
  }
  // Obsługa klawisza T dla potrójnych
  else if (event.key.toUpperCase() === "T" && !event.ctrlKey && !event.altKey) {
    document.addEventListener(
      "keydown",
      function tripleListener(e) {
        if (e.key >= "1" && e.key <= "9") {
          handleDartThrow(Number.parseInt(e.key) * 3);
          document.removeEventListener("keydown", tripleListener);
        }
      },
      { once: true },
    );
  }
  // Obsługa klawisza M dla chybienia (miss)
  else if (event.key.toUpperCase() === "M") {
    handleDartThrow(0);
  }
  // Obsługa klawisza Z z Ctrl dla cofania (Undo)
  else if (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey)) {
    undoLastThrow();
    event.preventDefault();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadGameState();
  
  // Generuj przyciski po załadowaniu strony
  generateDartboardButtons();
  
  // Sprawdź, czy istnieje zapisany widok dartboard
  const isCompactView = localStorage.getItem("dartboardCompactView") === "true";
  if (isCompactView) {
    document.getElementById("dartboard").classList.add("compact-view");
    if (document.getElementById("viewToggleBtn")) {
      document.getElementById("viewToggleBtn").textContent = "Full view";
    }
  }
});