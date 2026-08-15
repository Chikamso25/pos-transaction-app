import { db, initializeDatabase } from "./db.js";
import { money, formatTime, escapeHtml } from "./utils.js";

const sessionUser = JSON.parse(localStorage.getItem("pos_session_user") || "null");
if (!sessionUser) location.href = "login.html";

const form = document.querySelector("#transactionForm");
const tbody = document.querySelector("#transactionBody");
const emptyState = document.querySelector("#emptyState");
const toast = document.querySelector("#toast");
let toastTimer;

function notify(text, error = false) {
  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.className = `toast show${error ? " error" : ""}`;
  toastTimer = setTimeout(() => (toast.className = "toast"), 3000);
}

function resetForm() {
  form.reset();
  document.querySelector("#fee").value = 0;
  document.querySelector("#transactionId").value = "";
  document.querySelector("#formTitle").textContent = "Record transaction";
  document.querySelector("#formEyebrow").textContent = "Quick entry";
  document.querySelector("#submitBtn").textContent = "Save transaction";
  document.querySelector("#cancelEdit").classList.add("hidden");
}

async function loadSummary() {
  const res = await db.execute({
    sql: `SELECT
        COALESCE(SUM(CASE WHEN status != 'FAILED' THEN amount ELSE 0 END), 0) AS total_volume,
        COALESCE(SUM(CASE WHEN status != 'FAILED' THEN fee ELSE 0 END), 0) AS total_fees,
        COUNT(*) AS total_transactions,
        SUM(CASE WHEN type='WITHDRAWAL' THEN 1 ELSE 0 END) AS withdrawals,
        SUM(CASE WHEN type='TRANSFER' THEN 1 ELSE 0 END) AS transfers,
        SUM(CASE WHEN type='DEPOSIT' THEN 1 ELSE 0 END) AS deposits
      FROM transactions
      WHERE user_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')`,
    args: [sessionUser.id],
  });

  const row = res.rows[0] || {};
  document.querySelector("#totalVolume").textContent = money(row.total_volume);
  document.querySelector("#totalFees").textContent = money(row.total_fees);
  document.querySelector("#totalTransactions").textContent = row.total_transactions || 0;
  document.querySelector("#withdrawals").textContent = row.withdrawals || 0;
  document.querySelector("#transfers").textContent = row.transfers || 0;
  document.querySelector("#deposits").textContent = row.deposits || 0;
}

async function loadTransactions() {
  const date = document.querySelector("#dateFilter").value;
  const type = document.querySelector("#typeFilter").value;

  let sql = `SELECT id, type, amount, fee, customer_name, status, notes, created_at
             FROM transactions WHERE user_id = ?`;
  const args = [sessionUser.id];

  if (date) {
    sql += " AND date(created_at, 'localtime') = ?";
    args.push(date);
  }
  if (type) {
    sql += " AND type = ?";
    args.push(type.toUpperCase());
  }

  sql += " ORDER BY datetime(created_at) DESC, id DESC";

  const res = await db.execute({ sql, args });
  tbody.innerHTML = "";
  emptyState.classList.toggle("hidden", res.rows.length > 0);

  for (const tx of res.rows) {
    const tr = document.createElement("tr");
    const badgeClass = String(tx.status).toLowerCase();
    tr.innerHTML = `
      <td>${formatTime(String(tx.created_at))}</td>
      <td>${tx.type}</td>
      <td>${money(tx.amount)}</td>
      <td>${money(tx.fee)}</td>
      <td>${escapeHtml(tx.customer_name || "—")}</td>
      <td><span class="badge ${badgeClass}">${tx.status}</span></td>
      <td><div class="actions">
        <button class="action" data-edit="${tx.id}">Edit</button>
        <button class="action delete" data-delete="${tx.id}">Delete</button>
      </div></td>`;
    tbody.appendChild(tr);
  }
}

async function refresh() {
  await Promise.all([loadSummary(), loadTransactions()]);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = Number(document.querySelector("#amount").value);
  const fee = Number(document.querySelector("#fee").value);

  if (amount < 0 || fee < 0 || !Number.isFinite(amount) || !Number.isFinite(fee)) {
    return notify("Amount and fee must be valid non-negative numbers.", true);
  }

  const payload = {
    type: document.querySelector("#type").value,
    amount,
    fee,
    customer_name: document.querySelector("#customerName").value.trim(),
    status: document.querySelector("#status").value,
    notes: document.querySelector("#notes").value.trim(),
  };
  const id = document.querySelector("#transactionId").value;

  try {
    if (id) {
      await db.execute({
        sql: `UPDATE transactions SET type=?, amount=?, fee=?, customer_name=?, status=?, notes=?
              WHERE id=? AND user_id=?`,
        args: [payload.type, payload.amount, payload.fee, payload.customer_name, payload.status, payload.notes, Number(id), sessionUser.id],
      });
      notify("Transaction updated.");
    } else {
      await db.execute({
        sql: `INSERT INTO transactions (user_id, type, amount, fee, customer_name, status, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [sessionUser.id, payload.type, payload.amount, payload.fee, payload.customer_name, payload.status, payload.notes],
      });
      notify("Transaction saved.");
    }
    resetForm();
    await refresh();
  } catch (err) {
    notify(err.message, true);
  }
});

tbody.addEventListener("click", async (e) => {
  const editId = e.target.dataset.edit;
  const deleteId = e.target.dataset.delete;

  if (editId) {
    const res = await db.execute({
      sql: "SELECT * FROM transactions WHERE id = ? AND user_id = ?",
      args: [Number(editId), sessionUser.id],
    });
    const tx = res.rows[0];
    if (tx) {
      document.querySelector("#transactionId").value = tx.id;
      document.querySelector("#type").value = tx.type;
      document.querySelector("#amount").value = tx.amount;
      document.querySelector("#fee").value = tx.fee;
      document.querySelector("#customerName").value = tx.customer_name || "";
      document.querySelector("#status").value = tx.status;
      document.querySelector("#notes").value = tx.notes || "";
      document.querySelector("#formTitle").textContent = "Edit transaction";
      document.querySelector("#formEyebrow").textContent = "Correction mode";
      document.querySelector("#submitBtn").textContent = "Update transaction";
      document.querySelector("#cancelEdit").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (deleteId && confirm("Delete this transaction? This cannot be undone.")) {
    try {
      await db.execute({
        sql: "DELETE FROM transactions WHERE id = ? AND user_id = ?",
        args: [Number(deleteId), sessionUser.id],
      });
      notify("Transaction deleted.");
      await refresh();
    } catch (err) {
      notify(err.message, true);
    }
  }
});

document.querySelector("#usernameBadge").textContent = sessionUser.username;
document.querySelector("#cancelEdit").addEventListener("click", resetForm);
document.querySelector("#dateFilter").addEventListener("change", loadTransactions);
document.querySelector("#typeFilter").addEventListener("change", loadTransactions);
document.querySelector("#clearFilters").addEventListener("click", () => {
  document.querySelector("#dateFilter").value = "";
  document.querySelector("#typeFilter").value = "";
  loadTransactions();
});
document.querySelector("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("pos_session_user");
  location.href = "login.html";
});

// Init database and load user transactions
initializeDatabase()
  .then(refresh)
  .catch((err) => notify(err.message, true));
