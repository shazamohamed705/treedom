/** Unwrap API media (string or { url, path, thumbnail, … }) to a URL. */
export function mediaUrl(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return mediaUrl(val.url ?? val.path ?? val.src ?? val.thumbnail ?? val.full ?? val.original);
  }
  return null;
}

export function isVideoFile(url) {
  if (!url || typeof url !== "string") return false;
  const l = url.split("?")[0].toLowerCase();
  return l.endsWith(".mp4") || l.endsWith(".webm") || l.endsWith(".mov")
    || l.includes(".mp4") || l.includes(".webm") || l.includes(".mov");
}

/** أول فيديو جلسة — نفس برامجي: sessions.find(s => s.video_url) */
export function firstSessionVideo(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  const hit = list.find(s => s?.video_url || s?.videoUrl);
  return mediaUrl(hit?.video_url ?? hit?.videoUrl);
}

function pickImage(...vals) {
  for (const val of vals) {
    if (!val) continue;
    if (typeof val === "object") {
      const thumb = mediaUrl(val.thumbnail ?? val.poster ?? val.cover);
      if (thumb && !isVideoFile(thumb)) return thumb;
    }
    const url = mediaUrl(val);
    if (url && !isVideoFile(url)) return url;
  }
  return null;
}

/** صورة غلاف فقط — مش ملف فيديو */
export function programCover(raw) {
  if (!raw) return null;
  return pickImage(raw.image, raw.cover, raw.cover_image, raw.thumbnail, raw.poster, raw.img);
}

/**
 * فيديو الكارت: أول جلسة فيها video_url، أو فيديو البرنامج، أو image لو ملف فيديو.
 */
export function programVideoUrl(raw, extraSessions) {
  const sessions = extraSessions ?? raw?.sessions;
  const fromImage = mediaUrl(raw?.image);
  return firstSessionVideo(sessions)
    ?? mediaUrl(raw?.video_url ?? raw?.video ?? raw?.intro_video ?? raw?.promo_video)
    ?? (isVideoFile(fromImage) ? fromImage : null);
}

/** تجميع جلسات الـ API حسب program_id */
export function groupSessionsByProgram(rawSessions) {
  const list = Array.isArray(rawSessions) ? rawSessions : [];
  const byProgram = {};
  list.forEach(s => {
    const pid = s?.program_id ?? s?.program?.id;
    if (pid == null) return;
    (byProgram[String(pid)] ??= []).push(s);
  });
  return byProgram;
}

export function sessionsForProgram(enrollment, program, byProgram) {
  if (Array.isArray(enrollment?.sessions) && enrollment.sessions.length) return enrollment.sessions;
  if (Array.isArray(program?.sessions) && program.sessions.length) return program.sessions;
  return byProgram?.[String(program?.id)] ?? [];
}

export function numericProgramId(p) {
  if (p == null) return null;
  if (typeof p === "number") return Number.isFinite(p) && p > 0 ? p : null;
  const raw = typeof p === "object" ? (p.programId ?? p.id) : p;
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(/^[ce]/, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const sessionVideoCache = new Map();

/** تفاصيل البرنامج: أول sessions[].video_url (القائمة نفسها مفيهاش فيديو) */
export function fetchSessionVideoUrl(programId, fetchDetail) {
  const key = String(programId);
  if (sessionVideoCache.has(key)) return sessionVideoCache.get(key);
  const pending = Promise.resolve()
    .then(() => fetchDetail(programId))
    .then(res => firstSessionVideo(res?.data?.sessions ?? res?.data?.program?.sessions))
    .catch(() => null);
  sessionVideoCache.set(key, pending);
  return pending;
}

async function poolMap(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  const n = Math.min(Math.max(limit, 1), items.length);
  await Promise.all(Array.from({ length: n }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      out[idx] = await worker(items[idx]);
    }
  }));
  return out;
}

/** املأ videoUrl للكروت من تفاصيل البرنامج لو القائمة فاضية */
export async function attachProgramVideos(items, fetchDetail, { concurrency = 4 } = {}) {
  const list = Array.isArray(items) ? items : [];
  const ids = [...new Set(list.filter(p => !p.videoUrl).map(numericProgramId).filter(Boolean))];
  if (!ids.length) return list;
  const urls = await poolMap(ids, concurrency, id => fetchSessionVideoUrl(id, fetchDetail));
  const byId = {};
  ids.forEach((id, i) => { byId[id] = urls[i]; });
  return list.map(p => {
    if (p.videoUrl) return p;
    const url = byId[numericProgramId(p)];
    return url ? { ...p, videoUrl: url } : p;
  });
}

export async function attachCategoryProgramVideos(categories, fetchDetail, opts) {
  const cats = Array.isArray(categories) ? categories : [];
  const hydrated = await attachProgramVideos(cats.flatMap(c => c.programs ?? []), fetchDetail, opts);
  const byId = {};
  hydrated.forEach(p => {
    const id = numericProgramId(p);
    if (id) byId[id] = p;
  });
  return cats.map(c => ({
    ...c,
    programs: (c.programs ?? []).map(p => byId[numericProgramId(p)] ?? p),
  }));
}
