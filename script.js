
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

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

const email = document.getElementById("email");
const password = document.getElementById("password");
const authMessage = document.getElementById("authMessage");

document.getElementById("signup").addEventListener("click", async () => {
    try {
        await createUserWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );
        authMessage.textContent = "Welcome to Holy Tone! Account created.";
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

document.getElementById("login").addEventListener("click", async () => {
    try {
        await signInWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );
        authMessage.textContent = "You're logged in!";
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

document.getElementById("logout").addEventListener("click", async () => {
    await signOut(auth);
    authMessage.textContent = "You are logged out.";
});

onAuthStateChanged(auth, (user) => {
    document.getElementById("signup").hidden = !!user;
    document.getElementById("login").hidden = !!user;
    document.getElementById("logout").hidden = !user;

    if (user) {
        authMessage.textContent = "Welcome back to Holy Tone!";
    }
});

const upload = document.getElementById("upload");
const songList = document.getElementById("songList");
const audio = document.getElementById("audio");
const playButton = document.getElementById("play");
const search = document.getElementById("search");
const songTitle = document.getElementById("songTitle");

let songs = [];
let currentSong = 0;

upload.addEventListener("change", function () {
    const files = Array.from(upload.files);

    files.forEach(file => {
        songs.push({
            name: file.name,
            url: URL.createObjectURL(file)
        });
    });

    displaySongs();
});

function displaySongs(filter = "") {
    songList.innerHTML = "";

    const filtered = songs
        .map((song, index) => ({ ...song, index }))
        .filter(song =>
            song.name.toLowerCase().includes(filter.toLowerCase())
        );

    if (filtered.length === 0) {
        songList.innerHTML = "<p class='empty'>No songs found.</p>";
        return;
    }

    filtered.forEach(song => {
        const card = document.createElement("div");
        card.className = "song-card";

        const title = document.createElement("h3");
        title.textContent = song.name;

        const button = document.createElement("button");
        button.textContent = "Play";

        button.addEventListener("click", () => {
            playSong(song.index);
        });

        card.append(title, button);
        songList.appendChild(card);
    });
}

function playSong(index) {
    currentSong = index;
    audio.src = songs[index].url;
    songTitle.textContent = songs[index].name;
    audio.play();
    playButton.textContent = "⏸";
}

playButton.addEventListener("click", () => {
    if (!audio.src) return;

    if (audio.paused) {
        audio.play();
        playButton.textContent = "⏸";
    } else {
        audio.pause();
        playButton.textContent = "▶";
    }
});

document.getElementById("next").addEventListener("click", () => {
    if (songs.length) {
        playSong((currentSong + 1) % songs.length);
    }
});

document.getElementById("previous").addEventListener("click", () => {
    if (songs.length) {
        playSong((currentSong - 1 + songs.length) % songs.length);
    }
});

search.addEventListener("input", () => {
    displaySongs(search.value);
});

audio.addEventListener("ended", () => {
    if (songs.length) {
        playSong((currentSong + 1) % songs.length);
    }
});
