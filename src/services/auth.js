/**
 * Centralized auth token & user storage.
 *
 * Usage anywhere in the app:
 *   import { getToken, setToken, clearAuth } from "./services/auth";
 */

const TOKEN_KEY = "token";
const USER_KEY  = "user";

// ── token ─────────────────────────────────────────────────────────────────────

/** Returns the stored bearer token, or null. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? null;
}

/** Persists a bearer token. */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Returns true if a token is currently stored. */
export function isAuthenticated() {
  return Boolean(getToken());
}

// ── user ──────────────────────────────────────────────────────────────────────

/** Returns the stored user object (parsed), or null. */
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persists a user object. */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── role ──────────────────────────────────────────────────────────────────────

/**
 * Derives the app role string from the stored user object.
 *
 * Stored user shapes:
 *   - Provider (هيئة / company): { role: "provider" | "company", ... }
 *   - Coach (مدرب تحت هيئة):    { role: "coach", permissions: [...], ... }
 *   - Trainer (مدرب مستقل):     { role: "trainer", ... }
 *   - Trainee (متدرب فردي):      { role: "trainee", ... }
 *   - Company employee:          { role: "employee" | "staff", ... }
 *
 * Returns one of: "org" | "company" | "coach" | "trainer" | "trainee" | "employee" | null
 */
export function getUserRole() {
  const user = getUser();
  if (!user) return null;

  const inner = user.data && typeof user.data === "object" ? user.data : {};
  const t = user.type ?? user.role ?? user.provider_type ?? inner.type ?? inner.role ?? inner.provider_type ?? null;

  if (t === "coach")    return "coach";
  if (t === "inde_coach" || t === "individual_trainer") return "org";
  if (t === "trainer") {
    if (user.provider_type === "individual_trainer") return "org";
    return "trainer";
  }
  if (t === "trainee" || t === "user") return "trainee";
  if (t === "employee" || t === "staff") return "employee";
  if (t === "company")  return "company";
  if (t === "provider") return "org";

  // fallback: detect by shape (permissions array = coach)
  if (Array.isArray(user.permissions) && user.permissions.length > 0) return "coach";
  if (user.invitation_status !== undefined) return "coach";

  return "org";
}

/**
 * Returns the stored permissions array (from coach login response).
 * Each item: { id, key, group, name }
 */
export function getPermissions() {
  const user = getUser();
  return Array.isArray(user?.permissions) ? user.permissions : [];
}

/**
 * Checks if the stored user has a specific permission key.
 * Falls back to true if no permissions stored (legacy session / provider user).
 * e.g. hasPermission("programs.update")
 */
export function hasPermission(key) {
  const perms = getPermissions();
  // no permissions stored = provider/org user → allow everything
  if (perms.length === 0) return true;
  return perms.some(p => p.key === key);
}

/** Independent trainer (مدرب مستقل) — uses org UI with a reduced nav. */
export function isIndeCoach() {
  const user = getUser();
  if (!user) return false;
  const inner = user.data && typeof user.data === "object" ? user.data : {};
  const t = String(
    user.type ?? user.role ?? user.provider_type
    ?? inner.type ?? inner.role ?? inner.provider_type ?? ""
  ).toLowerCase().trim();
  return t === "inde_coach" || t === "individual_trainer";
}

export function roleToPreviewId(role) {
  const MAP = {
    org:      "org",
    company:  "company",
    coach:    "trainer",   // coach under provider → trainer UI
    trainer:  "trainer",   // independent trainer
    trainee:  "user",
    employee: "employee",
  };
  return MAP[role] ?? "org";
}

/**
/** Removes both token and user — call on logout. */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
