// Web Crypto API Password Hashing Helper
// Fallback helper for Web Crypto API
export async function hashPassword(password) {
  // Check if Web Crypto API is available
  if (window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
    const salt = enc.encode("static-pos-salt-3mtt");
    const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return Array.from(new Uint8Array(exported))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Basic fallback string hash if context is not secure (dev environment fallback)
  console.warn("Web Crypto API unavailable (requires HTTPS or localhost). Using basic hash fallback.");
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return "dev_fallback_" + Math.abs(hash).toString(16);
}

export function money(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatTime(value) {
  if (!value) return "—";
  return new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z")).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

export function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}
