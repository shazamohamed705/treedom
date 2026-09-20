const STORE_KEY = "watch_progress";

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch { /* quota / private mode */ }
}

export function saveWatchProgress(sessionId, { programId, currentTime, duration } = {}) {
  if (sessionId == null || !duration || duration <= 0) return;
  const key = String(sessionId);
  const percent = currentTime >= duration - 2
    ? 100
    : Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
  const prev = readStore();
  prev[key] = {
    sessionId: key,
    programId: programId != null ? String(programId) : (prev[key]?.programId ?? null),
    currentTime: Number(currentTime) || 0,
    duration: Number(duration) || 0,
    percent,
    updatedAt: Date.now(),
  };
  writeStore(prev);
  try { window.dispatchEvent(new CustomEvent("treedom:watch")); } catch { /* ignore */ }
}

export function getWatchProgress(sessionId) {
  if (sessionId == null) return null;
  return readStore()[String(sessionId)] ?? null;
}

export function getResumeTime(sessionId) {
  const entry = getWatchProgress(sessionId);
  if (!entry || entry.percent >= 95) return 0;
  return Number(entry.currentTime) || 0;
}

export function getLastWatchForProgram(programId) {
  if (programId == null) return null;
  const pid = String(programId);
  return Object.values(readStore())
    .filter(e => e.programId === pid)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null;
}

export function getProgramLocalPercent(programId) {
  return getLastWatchForProgram(programId)?.percent ?? 0;
}

export function getContinueSessionId(programId) {
  const last = getLastWatchForProgram(programId);
  if (last && last.percent < 95) return last.sessionId;
  if (programId == null) return null;
  const pid = String(programId);
  const incomplete = Object.values(readStore())
    .filter(e => e.programId === pid && e.percent < 95)
    .sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0))[0];
  return incomplete?.sessionId ?? last?.sessionId ?? null;
}

function sessionKey(s) {
  return s?.session_id ?? s?.id ?? null;
}

function isIncomplete(s, local) {
  if (local && local.percent >= 95) return false;
  const pct = local?.percent ?? s?.progress_percent ?? s?.progress ?? 0;
  const status = String(s?.status ?? s?.status_label ?? "").toLowerCase();
  if (status === "completed" || status === "مكتملة" || status === "2") {
    return (local?.percent ?? 0) < 95 && (local?.percent ?? 0) > 0 ? false : pct < 95;
  }
  return Number(pct) < 95;
}

/**
 * Pick the session to resume for a program.
 * Local watch position wins, then enrollment sessions, then the sessions list.
 */
export async function resolveContinueSession(programId, { fetchEnrollmentDetail, fetchSessions }) {
  const localSid = getContinueSessionId(programId);
  if (localSid) return { id: localSid };

  try {
    const res = await fetchEnrollmentDetail(programId);
    const data = res?.data ?? {};
    const slist = data.sessions ?? data.program?.sessions ?? [];
    const progress = data.session_progress ?? [];
    const progMap = {};
    progress.forEach(sp => {
      const k = sp.session_id ?? sp.id;
      if (k != null) progMap[String(k)] = sp;
    });

    const pick = slist.find(s => {
      const sid = sessionKey(s);
      const local = getWatchProgress(sid);
      const api = progMap[String(sid)] ?? progMap[String(s.id)] ?? {};
      return isIncomplete({ ...s, ...api }, local);
    }) ?? slist[0];

    if (pick) {
      const id = sessionKey(pick);
      if (id != null) return { id };
    }
  } catch { /* try sessions list */ }

  try {
    const res = await fetchSessions({ filter: "all", per_page: 100 });
    const all = res?.data?.sessions ?? res?.data ?? [];
    const list = Array.isArray(all) ? all : [];
    const forProg = list.filter(s => Number(s.program_id) === Number(programId));
    const pool = forProg.length ? forProg : list;
    const pick = pool.find(s => {
      const sid = sessionKey(s);
      return isIncomplete(s, getWatchProgress(sid));
    }) ?? pool[0];
    if (pick) {
      const id = sessionKey(pick);
      if (id != null) return { id };
    }
  } catch { /* none */ }

  return null;
}

export function markAutoplaySession(sessionId) {
  if (sessionId == null) return;
  try { sessionStorage.setItem("autoplaySession", String(sessionId)); } catch {}
}

export function consumeAutoplaySession(sessionId) {
  try {
    const flagged = sessionStorage.getItem("autoplaySession");
    if (flagged && String(flagged) === String(sessionId)) {
      sessionStorage.removeItem("autoplaySession");
      return true;
    }
  } catch {}
  return false;
}

export function resolveProgramId(prog) {
  if (prog == null) return null;
  if (prog.programId != null && prog.programId !== "") return Number(prog.programId);
  const raw = prog.id;
  if (raw == null) return null;
  const n = Number(String(raw).replace(/^c/, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
