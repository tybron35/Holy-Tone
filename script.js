
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCfekWljRw0ipJVPOVx4rvKnHjU1q4WbS0",
  authDomain: "my-sic.firebaseapp.com",
  projectId: "my-sic",
  storageBucket: "my-sic.firebasestorage.app",
  messagingSenderId: "324726213531",
  appId: "1:324726213531:web:cb59caf6401c423e4eef3e",
  measurementId: "G-FBQYB0BNJ3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// EMAIL LINK SETTINGS
// Sends users back to the published NexPlay website.
const emailActionSettings = {
  url: "https://tybron35.github.io/Holy-Tone/",
  handleCodeInApp: true
};

// HELPERS
const $ = (id) => document.getElementById(id);

function show(element) {
  if (element) element.hidden = false;
}

function hide(element) {
  if (element) element.hidden = true;
}

function setMessage(id, message) {
  const element = $(id);
  if (element) element.textContent = message;
}

function showOnlyScreen(screenToShow, screens) {
  screens.forEach(hide);
  show(screenToShow);
}

function getVerificationEmailInput() {
  return $("verifyEmail");
}

// AGE GATE
const ageGate = $("ageGate");
const ageConfirm = $("ageConfirm");
const continueAge = $("continueAge");
const verifyScreen = $("verifyScreen");
const botScreen = $("botScreen");
const mainWebsite = $("mainWebsite");

const accessScreens = [
  ageGate,
  verifyScreen,
  botScreen,
  mainWebsite
];

if (ageConfirm && continueAge) {
  continueAge.disabled = !ageConfirm.checked;

  ageConfirm.addEventListener("change", () => {
    continueAge.disabled = !ageConfirm.checked;
  });

  continueAge.addEventListener("click", () => {
    if (!ageConfirm.checked) return;

    sessionStorage.setItem("nexplayAgeConfirmed", "yes");
    showOnlyScreen(verifyScreen, accessScreens);
  });
}

// EMAIL VERIFICATION
// verifyEmail is the email address input, not a checkbox.
const verifyPhone = $("verifyPhone");
const sendVerification = $("sendVerification");

if (sendVerification) {
  sendVerification.addEventListener("click", async () => {
    const emailInput = getVerificationEmailInput();
    const email = emailInput?.value.trim();

    // Phone verification is not configured yet.
    if (verifyPhone?.checked) {
      setMessage(
        "phoneSetupMessage",
        "Phone verification is not set up yet. Please choose email for now."
      );
      return;
    }

    if (!email) {
      setMessage("verifyMessage", "Please enter your email address.");
      emailInput?.focus();
      return;
    }

    try {
      sendVerification.disabled = true;
      setMessage("verifyMessage", "Sending your verification link...");

      await sendSignInLinkToEmail(
        auth,
        email,
        emailActionSettings
      );

      localStorage.setItem("nexplayEmailForSignIn", email);

      setMessage(
        "verifyMessage",
        "Verification link sent! Check your inbox and click the link."
      );

      show($("emailSent"));

    } catch (error) {
      console.error("Firebase email-link error:", error);

      setMessage(
        "verifyMessage",
        `Email error: ${error.code || error.message}`
      );

    } finally {
      sendVerification.disabled = false;
    }
  });
}

// FINISH EMAIL LINK SIGN-IN
async function finishEmailSignIn() {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    return false;
  }

  let email = localStorage.getItem("nexplayEmailForSignIn");

  // GitHub Pages is a different website origin from Codespaces,
  // so the saved email may not be available there.
  if (!email) {
    email = prompt("Enter the email address where you received the link.");
  }

  if (!email) {
    setMessage("verifyMessage", "Your email address is needed to continue.");
    showOnlyScreen(verifyScreen, accessScreens);
    return true;
  }

  try {
    await signInWithEmailLink(
      auth,
      email.trim(),
      window.location.href
    );

    localStorage.removeItem("nexplayEmailForSignIn");

    sessionStorage.setItem("nexplayEmailConfirmed", "yes");

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    showOnlyScreen(botScreen, accessScreens);
    createBotQuestion();

    return true;

  } catch (error) {
    console.error("Email sign-in error:", error);

    setMessage(
      "verifyMessage",
      `Verification error: ${error.code || error.message}`
    );

    showOnlyScreen(verifyScreen, accessScreens);
    return true;
  }
}

// DEMO BOT CHECK
// This math question is not a secure CAPTCHA.
let botAnswer = 0;

function createBotQuestion() {
  const first = Math.floor(Math.random() * 8) + 2;
  const second = Math.floor(Math.random() * 8) + 2;

  botAnswer = first + second;

  setMessage("botQuestion", `What is ${first} + ${second}?`);

  if ($("botAnswer")) {
    $("botAnswer").value = "";
  }
}

$("checkBot")?.addEventListener("click", () => {
  const answer = Number($("botAnswer")?.value);

  if (answer === botAnswer) {
    sessionStorage.setItem("nexplayBotCheck", "yes");
    sessionStorage.setItem("nexplayAccess", "yes");

    showOnlyScreen(mainWebsite, accessScreens);
    setMessage("botMessage", "");

  } else {
    setMessage("botMessage", "That answer isn't correct. Try again.");
    createBotQuestion();
  }
});

// STARTUP
async function startNexPlay() {
  const handledEmailLink = await finishEmailSignIn();

  if (handledEmailLink) return;

  if (sessionStorage.getItem("nexplayAccess") === "yes") {
    showOnlyScreen(mainWebsite, accessScreens);

  } else if (
    sessionStorage.getItem("nexplayAgeConfirmed") === "yes"
  ) {
    showOnlyScreen(verifyScreen, accessScreens);

  } else {
    showOnlyScreen(ageGate, accessScreens);
  }
}

startNexPlay();

// ACCOUNT SCREENS
const signupScreen = $("signupScreen");
const loginScreen = $("loginScreen");
const loggedInScreen = $("loggedInScreen");

$("showLogin")?.addEventListener("click", () => {
  showOnlyScreen(loginScreen, [
    signupScreen,
    loginScreen,
    loggedInScreen
  ]);
});

$("showSignup")?.addEventListener("click", () => {
  showOnlyScreen(signupScreen, [
    signupScreen,
    loginScreen,
    loggedInScreen
  ]);
});

// SIGN UP
$("signup")?.addEventListener("click", async () => {
  const username = $("signupUsername")?.value.trim();
  const email = $("signupEmail")?.value.trim();
  const password = $("signupPassword")?.value;

  if (!username || !email || !password) {
    setMessage("authMessage", "Please fill in all sign-up fields.");
    return;
  }

  if (password.length < 6) {
    setMessage("authMessage", "Your password must be at least 6 characters.");
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(result.user, {
      displayName: username
    });

    await sendEmailVerification(result.user);

    setMessage(
      "authMessage",
      "Account created! Check your email for a verification message."
    );

    showOnlyScreen(loggedInScreen, [
      signupScreen,
      loginScreen,
      loggedInScreen
    ]);

  } catch (error) {
    console.error("Sign-up error:", error);

    setMessage(
      "authMessage",
      `Sign-up failed: ${error.code || error.message}`
    );
  }
});

// LOG IN
$("login")?.addEventListener("click", async () => {
  const email = $("loginEmail")?.value.trim();
  const password = $("loginPassword")?.value;

  if (!email || !password) {
    setMessage("authMessage", "Enter your email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    setMessage("authMessage", "You are signed in!");

    showOnlyScreen(loggedInScreen, [
      signupScreen,
      loginScreen,
      loggedInScreen
    ]);

  } catch (error) {
    console.error("Login error:", error);

    setMessage(
      "authMessage",
      `Login failed: ${error.code || error.message}`
    );
  }
});

// FORGOT PASSWORD
$("forgotPassword")?.addEventListener("click", async () => {
  const email = $("loginEmail")?.value.trim();

  if (!email) {
    setMessage(
      "authMessage",
      "Enter your email address first."
    );
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);

    setMessage(
      "authMessage",
      "Password reset email sent. Check your inbox."
    );

  } catch (error) {
    console.error("Password reset error:", error);

    setMessage(
      "authMessage",
      `Password reset failed: ${error.code || error.message}`
    );
  }
});

// LOG OUT
$("logout")?.addEventListener("click", async () => {
  try {
    await signOut(auth);

    setMessage("authMessage", "You have signed out.");

    showOnlyScreen(loginScreen, [
      signupScreen,
      loginScreen,
      loggedInScreen
    ]);

  } catch (error) {
    console.error("Logout error:", error);
    setMessage("authMessage", "Could not sign out. Please try again.");
  }
});

// AUTH STATE
onAuthStateChanged(auth, (user) => {
  const playerName = $("playerName");

  if (playerName) {
    playerName.textContent = user
      ? user.displayName || user.email || "Player"
      : "Guest";
  }
});

// GAME SEARCH
const gameSearch = $("gameSearch");
const gameCards = document.querySelectorAll(".game-card");
const noGames = $("noGames");

gameSearch?.addEventListener("input", () => {
  const searchText = gameSearch.value.toLowerCase();
  let visibleCount = 0;

  gameCards.forEach((card) => {
    const matches = card.textContent.toLowerCase().includes(searchText);

    card.hidden = !matches;

    if (matches) visibleCount++;
  });

  if (noGames) {
    noGames.hidden = visibleCount !== 0;
  }
});

// GAME SCREEN
const gameScreen = $("gameScreen");
const gameTitle = $("gameTitle");
const gameArea = $("gameArea");

function openGame(title) {
  if (gameTitle) gameTitle.textContent = title;
  show(gameScreen);
}

function closeGame() {
  hide(gameScreen);

  if (gameArea) {
    gameArea.innerHTML = "";
  }
}

$("closeGame")?.addEventListener("click", closeGame);

// MEMORY MATCH
function startMemoryGame() {
  openGame("Memory Match");

  const symbols = ["🍎", "⭐", "🎮", "🚀", "🐱", "⚽"];
  const cards = [...symbols, ...symbols].sort(
    () => Math.random() - 0.5
  );

  let firstCard = null;
  let lockBoard = false;
  let matches = 0;
  let moves = 0;

  gameArea.innerHTML = `
    <p>Find all matching pairs!</p>
    <p id="memoryMoves">Moves: 0</p>
    <div class="memory-grid" id="memoryGrid"></div>
    <p id="memoryResult"></p>
  `;

  const grid = $("memoryGrid");

  cards.forEach((symbol) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "memory-card";
    card.textContent = "?";
    card.dataset.symbol = symbol;

    card.addEventListener("click", () => {
      if (
        lockBoard ||
        card.classList.contains("matched") ||
        card === firstCard
      ) {
        return;
      }

      card.textContent = symbol;
      card.classList.add("revealed");

      if (!firstCard) {
        firstCard = card;
        return;
      }

      moves++;
      setMessage("memoryMoves", `Moves: ${moves}`);

      if (firstCard.dataset.symbol === card.dataset.symbol) {
        firstCard.classList.add("matched");
        card.classList.add("matched");

        firstCard = null;
        matches++;

        if (matches === symbols.length) {
          setMessage(
            "memoryResult",
            `You won in ${moves} moves!`
          );

          addLeaderboardScore("Memory Match", moves);
        }

      } else {
        lockBoard = true;

        const previousCard = firstCard;
        firstCard = null;

        setTimeout(() => {
          previousCard.textContent = "?";
          card.textContent = "?";

          previousCard.classList.remove("revealed");
          card.classList.remove("revealed");

          lockBoard = false;
        }, 800);
      }
    });

    grid.appendChild(card);
  });
}

// CLICK CHALLENGE
function startClickChallenge() {
  openGame("Click Challenge");

  let score = 0;
  let timeLeft = 15;
  let running = true;

  gameArea.innerHTML = `
    <p>Click as many times as you can in 15 seconds!</p>
    <h2 id="clickTimer">Time: 15</h2>
    <h2 id="clickScore">Score: 0</h2>
    <button type="button" id="clickTarget">CLICK ME!</button>
    <p id="clickResult"></p>
  `;

  const target = $("clickTarget");

  target.addEventListener("click", () => {
    if (!running) return;

    score++;
    setMessage("clickScore", `Score: ${score}`);
  });

  const timer = setInterval(() => {
    timeLeft--;

    setMessage("clickTimer", `Time: ${timeLeft}`);

    if (timeLeft <= 0) {
      clearInterval(timer);
      running = false;

      target.disabled = true;

      setMessage(
        "clickResult",
        `Time's up! Your score was ${score}.`
      );

      addLeaderboardScore("Click Challenge", score);
    }
  }, 1000);
}

// GAME BUTTONS
document.querySelectorAll(".play-game").forEach((button) => {
  button.addEventListener("click", () => {
    const game = button.dataset.game;

    if (game === "memory") {
      startMemoryGame();

    } else if (game === "clicker") {
      startClickChallenge();
    }
  });
});

// LOCAL LEADERBOARD
function addLeaderboardScore(gameName, score) {
  const leaderboardList = $("leaderboardList");

  if (!leaderboardList) return;

  const item = document.createElement("li");
  const player = auth.currentUser?.displayName || "Guest";

  item.textContent = `${player} — ${gameName}: ${score}`;

  leaderboardList.prepend(item);
}

// INITIAL STATE
hide(gameScreen);
