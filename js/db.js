import { createClient } from "https://esm.sh/@libsql/client@0.6.0/web";

// Configure your Turso credentials
const TURSO_URL = "libsql://pos-tracker-db-kingchi005.aws-eu-west-1.turso.io"; // or https://
const TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTE4MDI2NzUsImlhdCI6MTc4NjYxODY3NiwiaWQiOiIwMTlmZmFjNS0yNjAxLTdkOWUtOTNiNi05ZWYzYWFiNTRlNmYiLCJraWQiOiJDeVA1S1ZqdWVHaHhwS3dTSi03T3RlRzZjUGdqcXUwckxESzRSOS03RzE0IiwicmlkIjoiODZkZTg4ZDEtNTI1MS00Mjg3LThkOGQtZjllZjlkMTRkZTMzIn0.RcPEUd8HY5UnLXuyIxitefhUYnrcZbBL2iBbSC_s9PpjOP-gboP72g2Zv9wslZEXidF6SjInYYeIsXqD-aHZBw";

export const db = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export async function initializeDatabase() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS transactions (
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
    );`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);`,
  ]);
}
