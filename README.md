# POS Tracker

A lightweight web application for POS agents to record daily transactions, track fees, and monitor operational volume. Built as a 3MTT NextGen capstone project.

## Features

- **Authentication** — Secure login and registration with PBKDF2 password hashing
- **Transaction recording** — Log withdrawals, transfers, and deposits with amount, fee, status, customer/reference, and notes
- **Dashboard** — Daily summary cards showing total volume, total fees, and transaction counts
- **Transaction mix** — Breakdown of today's withdrawals, transfers, and deposits
- **History table** — Searchable and filterable records by date and type
- **Edit & delete** — Update or remove transactions with instant UI refresh
- **Responsive design** — Works on mobile and desktop

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (ES modules)
- [Turso/libSQL](https://turso.tech) for remote SQLite data storage

## Project Structure

```
pos-tracker-app/
├── index.html          # Main dashboard
├── login.html          # Login / registration page
├── css/
│   └── style.css       # Global styles and responsive layout
└── js/
    ├── app.js          # Dashboard logic, CRUD, filters
    ├── auth.js         # Login and registration handlers
    ├── db.js           # Turso client and schema initialization
    └── utils.js        # Currency formatting, time helpers, HTML escaping
```

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('WITHDRAWAL','TRANSFER','DEPOSIT')),
  amount REAL NOT NULL CHECK(amount >= 0),
  fee REAL NOT NULL DEFAULT 0 CHECK(fee >= 0),
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK(status IN ('SUCCESS','FAILED','PENDING')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Running the App

Because this project uses ES modules, it must be served over HTTP (not opened as a plain file).

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node
npx serve .
```

Then open `http://localhost:8080` in your browser.

> **Note:** The database connection in `js/db.js` points to a specific Turso instance. Update `TURSO_URL` and `TURSO_AUTH_TOKEN` to point to your own database before deployment.

## Usage

1. Open the app in a browser
2. Register a new agent account
3. Record transactions using the form on the dashboard
4. Use the date and type filters to review history
5. Edit or delete transactions as needed