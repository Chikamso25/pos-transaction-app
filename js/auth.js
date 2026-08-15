import { db, initializeDatabase } from "./db.js";
import { hashPassword } from "./utils.js";

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const message = document.querySelector("#message");

function showMessage(text, error = true) {
  message.textContent = text;
  message.style.color = error ? "var(--danger)" : "var(--primary)";
}

// Redirect if already logged in
if (localStorage.getItem("pos_session_user")) {
  location.href = "index.html";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value;

  try {
    await initializeDatabase();
    const hashedPassword = await hashPassword(password);
    
    const res = await db.execute({
      sql: "SELECT id, username FROM users WHERE username = ? AND password = ?",
      args: [username, hashedPassword]
    });

    if (res.rows.length === 0) {
      return showMessage("Invalid username or password.");
    }

    const user = res.rows[0];
    localStorage.setItem("pos_session_user", JSON.stringify({ id: user.id, username: user.username }));
    location.href = "index.html";
  } catch (err) {
    showMessage("Database connection error: " + err.message);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.querySelector("#newUsername").value.trim();
  const password = document.querySelector("#newPassword").value;

  if (username.length < 3 || password.length < 6) {
    return showMessage("Username must be >= 3 chars and password >= 6 chars.");
  }

  try {
    await initializeDatabase();
    const hashedPassword = await hashPassword(password);

    const res = await db.execute({
      sql: "INSERT INTO users (username, password) VALUES (?, ?)",
      args: [username, hashedPassword]
    });

    const userId = Number(res.lastInsertRowid);
    localStorage.setItem("pos_session_user", JSON.stringify({ id: userId, username }));
    location.href = "index.html";
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      showMessage("Username already exists.");
    } else {
      showMessage("Registration failed: " + err.message);
    }
  }
});
