import { DRAFT_KEY } from "./constants";

// ── draft helpers ─────────────────────────────────────────────────────────────
export function loadDraft() {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}
export function saveDraft(form, sessions) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, sessions })); } catch { /* noop */ }
}
export function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
}
