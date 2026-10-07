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

// مفتاح منفصل لحفظ آخر موضع تشغيل (بغض النظر عن الاكتمال)
const RESUME_KEY = "resume_positions";

function readResume() {
  try { return JSON.parse(localStorage.getItem(RESUME_KEY) || "{}"); } catch { return {}; }
}
function writeResume(obj) {
  try { localStorage.setItem(RESUME_KEY, JSON.stringify(obj)); } catch {}
}

export function saveWatchProgress(sessionId, { programId, currentTime, duration } = {}) {
  if (sessionId == null || !duration || duration <= 0) return;
  const key = String(sessionId);
  const percent = currentTime >= duration - 2
    ? 100
    : Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));

  // دايماً احفظ الـ currentTime في الـ resume store عشان الاستكمال يشتغل
  if (currentTime > 5) {
    const resume = readResume();
    resume[key] = {
      currentTime: Number(currentTime),
      duration:    Number(duration),
      percent,
      updatedAt:   Date.now(),
    };
    writeResume(resume);
  }

  const prev = readStore();

  // لو اكتمل 95%+ → اشيله من قائمة "استكمال المشاهدة" ومن resume_positions
  if (percent >= 95) {
    delete prev[key];
    writeStore(prev);
    // امسح من resume_positions عشان مايفتحش على النهاية
    const resume = readResume();
    delete resume[key];
    writeResume(resume);
    try { window.dispatchEvent(new CustomEvent("treedom:watch", { detail: { sessionId: key, programId: programId != null ? String(programId) : null, percent, completed: true } })); } catch {}
    return;
  }

  prev[key] = {
    sessionId: key,
    programId: programId != null ? String(programId) : (prev[key]?.programId ?? null),
    currentTime: Number(currentTime) || 0,
    duration: Number(duration) || 0,
    percent,
    updatedAt: Date.now(),
  };
  writeStore(prev);
  try { window.dispatchEvent(new CustomEvent("treedom:watch", { detail: { sessionId: key, programId: programId != null ? String(programId) : null, percent, completed: false } })); } catch {}
}

export function getWatchProgress(sessionId) {
  if (sessionId == null) return null;
  return readStore()[String(sessionId)] ?? null;
}

export function getResumeTime(sessionId) {
  if (sessionId == null) return 0;
  const key = String(sessionId);
  // أولاً: resume store (بيحتفظ بالموضع حتى بعد الاكتمال)
  const resume = readResume();
  if (resume[key]?.currentTime > 5) return Number(resume[key].currentTime);
  // ثانياً: watch progress store (للجلسات غير المكتملة)
  const entry = getWatchProgress(sessionId);
  if (entry?.currentTime > 5) return Number(entry.currentTime);
  return 0;
}

export function getLastWatchForProgram(programId) {
  if (programId == null) return null;
  const pid = String(programId);
  // بس الجلسات اللي فيها تقدم فعلي وما اكتملتش
  return Object.values(readStore())
    .filter(e => e.programId === pid && (e.percent ?? 0) > 0 && (e.percent ?? 0) < 95)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null;
}

export function getProgramLocalPercent(programId) {
  return getLastWatchForProgram(programId)?.percent ?? 0;
}

export function getContinueSessionId(programId) {
  if (programId == null) return null;
  const pid = String(programId);
  // أحدث جلسة غير مكتملة (percent < 95) في هذا البرنامج
  const incomplete = Object.values(readStore())
    .filter(e => e.programId === pid && (e.percent ?? 0) < 95 && (e.percent ?? 0) > 0)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
  return incomplete?.sessionId ?? null;
}

function sessionKey(s) {
  return s?.session_id ?? s?.id ?? null;
}

/** هل وقت نهاية الجلسة عدى؟ */
function sessionEndedByTime(s) {
  const date = s?.date;
  const ends = s?.ends_at ?? s?.timeTo ?? s?.end_time;
  if (!date) return false;
  try {
    const [h = 23, m = 59] = String(ends || "23:59").split(":").map(Number);
    const d = new Date(date + "T00:00:00");
    d.setHours(h, m, 59, 0);
    return Date.now() > d.getTime();
  } catch { return false; }
}

function isIncomplete(s, local) {
  if (local && local.percent >= 95) return false;
  // جلسة وقتها عدى وما اتشاهدتش خالص — مش مناسبة للاستكمال
  if (sessionEndedByTime(s) && (!local || local.percent === 0)) return false;
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
    }) ?? slist.find(s => !sessionEndedByTime(s)) ?? slist[0];

    if (pick) {
      const id = sessionKey(pick);
      if (id != null) return {
        id,
        title:    pick.title,
        date:     pick.date,
        ends_at:  pick.ends_at,
        type:     pick.type,
        videoUrl: pick.video_url ?? pick.videoUrl ?? null,
      };
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
    }) ?? pool.find(s => !sessionEndedByTime(s)) ?? pool[0];
    if (pick) {
      const id = sessionKey(pick);
      if (id != null) return {
        id,
        title:    pick.title,
        date:     pick.date,
        ends_at:  pick.ends_at,
        type:     pick.type,
        videoUrl: pick.video_url ?? pick.videoUrl ?? null,
      };
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
