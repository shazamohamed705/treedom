/**
 * Registration drafts — per role + per email (user), session-scoped.
 * Files (logo/image) are not persisted.
 */

export const REG_ROLES = {
  provider: "provider",
  trainer:  "trainer",
  trainee:  "trainee",
  company:  "company",
};

export const PHONE_ERROR_AR = "حقل الهاتف يجب أن يحتوي على أرقام بين 9 و 14.";

export function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/** Keep digits only, max 14 — matches backend rule. */
export function normalizePhone(value) {
  return digitsOnly(value).slice(0, 14);
}

export function isPhoneValid(value) {
  const d = digitsOnly(value);
  return d.length >= 9 && d.length <= 14;
}

function emailKey(email) {
  const e = String(email ?? "").trim().toLowerCase();
  return e || "_";
}

function draftKey(role, email) {
  return `regDraft:${role}:${emailKey(email)}`;
}

function activeEmailKey(role) {
  return `regDraftActive:${role}`;
}

const FILE_KEYS = new Set([
  "logoFile", "image", "avatarFile", "commercialFile", "idFile", "cvFile", "id_card_document",
]);

function sanitize(data) {
  if (!data || typeof data !== "object") return {};
  const out = {};
  Object.entries(data).forEach(([k, v]) => {
    if (FILE_KEYS.has(k)) return;
    if (v instanceof File || v instanceof Blob) return;
    out[k] = v;
  });
  return out;
}

export function saveRegisterDraft(role, data) {
  if (!role) return;
  const clean = sanitize(data);
  const email = clean.email || clean.responsible_email || "";
  try {
    const prevActive = sessionStorage.getItem(activeEmailKey(role)) || "_";
    const k = draftKey(role, email || prevActive);
    // merge with existing so back/forward doesn't wipe other steps
    const prev = loadRegisterDraft(role, email || prevActive);
    const merged = { ...prev, ...clean };
    sessionStorage.setItem(k, JSON.stringify(merged));
    sessionStorage.setItem(activeEmailKey(role), emailKey(email || prevActive));
    // mirror under "_" while email unknown / for role restore
    if (!email) {
      sessionStorage.setItem(draftKey(role, "_"), JSON.stringify(merged));
    } else {
      sessionStorage.setItem(draftKey(role, "_"), JSON.stringify(merged));
    }
  } catch { /* ignore quota */ }
}

export function loadRegisterDraft(role, email) {
  if (!role) return {};
  try {
    const active = email || sessionStorage.getItem(activeEmailKey(role)) || "_";
    const raw = sessionStorage.getItem(draftKey(role, active))
      || sessionStorage.getItem(draftKey(role, "_"));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function clearRegisterDraft(role) {
  if (!role) return;
  try {
    const active = sessionStorage.getItem(activeEmailKey(role)) || "_";
    sessionStorage.removeItem(draftKey(role, active));
    sessionStorage.removeItem(draftKey(role, "_"));
    sessionStorage.removeItem(activeEmailKey(role));
  } catch { /* ignore */ }
}

export function roleFromAccountType(type) {
  const key = type?.key ?? type;
  if (key === "company") return REG_ROLES.company;
  if (key === "individual") return REG_ROLES.trainee;
  if (key === "individual_trainer") return REG_ROLES.trainer;
  if (key === "training_authority" || key === "institute" || key === "provider") {
    return REG_ROLES.provider;
  }
  return null;
}
