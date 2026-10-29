function parseSessionClock(date, time, fallbackH = 0, fallbackM = 0) {
  if (!date) return null;
  const base = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  if (!time) {
    base.setHours(fallbackH, fallbackM, 0, 0);
    return base;
  }
  const cleaned = String(time).trim().toLowerCase();
  const isPm = /pm|م/.test(cleaned);
  const isAm = /am|ص/.test(cleaned);
  const m = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (!m) {
    base.setHours(fallbackH, fallbackM, 0, 0);
    return base;
  }
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (isPm && h < 12) h += 12;
  if (isAm && h === 12) h = 0;
  base.setHours(h, min, 0, 0);
  return base;
}

export function sessionKind(s) {
  const t = s?.type;
  const mode = String(
    s?.delivery_mode ?? (typeof t === "object" ? t?.delivery_mode : t) ?? ""
  ).toLowerCase();
  const text = String(typeof t === "object" ? (t?.text ?? t?.value ?? "") : (t ?? "")).toLowerCase();
  const v = typeof t === "object" ? t?.value : t;

  if (mode === "recorded" || v === 1 || v === "1" || v === "recorded"
    || text.includes("record") || text.includes("مسج")) return "recorded";
  if (mode === "offline" || v === 2 || v === "2" || v === "offline"
    || text.includes("offline") || text.includes("حضور")) return "offline";
  if (mode === "online" || mode === "zoom" || mode === "interactive"
    || v === 0 || v === "0" || v === "online" || v === "zoom"
    || text.includes("online") || text.includes("أونلاين") || text.includes("اونلاين") || text.includes("zoom")) {
    return "online";
  }
  return "online";
}

export function isOnlineSession(s) {
  const t = s?.type;
  const mode = String(
    s?.delivery_mode ?? (typeof t === "object" ? t?.delivery_mode : "") ?? ""
  ).toLowerCase();
  const text = typeof t === "object" ? (t?.text ?? t?.value) : t;
  const v = typeof t === "object" ? t?.value : t;
  if (mode === "recorded" || mode === "offline" || v === 1 || v === "1" || v === 2 || v === "2") {
    return false;
  }
  if (mode === "online" || mode === "أونلاين" || mode === "zoom" || mode === "interactive") return true;
  if (v === 0 || v === "0" || v === "online" || v === "zoom") return true;
  const str = String(text ?? "").toLowerCase();
  return str.includes("online") || str.includes("أونلاين") || str.includes("اونلاين") || str.includes("zoom");
}

/** الجلسة خلصت حسب الباك اند */
export function sessionEndedFromApi(s) {
  if (!s) return false;
  if (s.is_completed === true || s.is_completed === 1) return true;
  if (s.has_ended === true || s.timing?.has_ended === true) return true;
  if (s.actual_ended_at || s.timing?.actual_ended_at) return true;
  return false;
}

/** وقت نهاية الجلسة عدّى حسب date + ends_at */
export function sessionEndTimePassed(s) {
  const date = s?.date;
  const ends = s?.ends_at ?? s?.timeTo ?? s?.timing?.scheduled?.ends_at_time;
  if (!date || !ends) return false;
  const end = parseSessionClock(date, ends);
  return !!(end && Date.now() > end.getTime());
}

/** خلصت: علم الباك اند أو الوقت نفسه انتهى */
export function sessionIsOver(s) {
  return sessionEndedFromApi(s) || sessionEndTimePassed(s);
}

/** Unwrap string | { url } media to a playable URL string. */
function asVideoUrl(val) {
  if (!val) return null;
  if (typeof val === "string") {
    const t = val.trim();
    return t || null;
  }
  if (typeof val === "object") {
    return asVideoUrl(val.url ?? val.path ?? val.src ?? val.full ?? val.original);
  }
  return null;
}

/**
 * فيديو للمعاينة من برّا (تفاصيل البرنامج / الكروت) —
 * أول رابط متاح بدون شرط انتهاء الجلسة.
 */
export function previewSessionVideo(s) {
  return asVideoUrl(s?.video_url ?? s?.videoUrl ?? s?.previewVideoUrl ?? null);
}

/**
 * فيديو للمشاهدة الفعلية بعد الاشتراك.
 * الأونلاين يظهر بعد انتهاء الجلسة فقط.
 */
export function visibleSessionVideo(s) {
  const url = previewSessionVideo(s);
  if (!url) return null;
  if (isOnlineSession(s) && !sessionIsOver(s)) return null;
  return url;
}

export function sessionHasFiles(s) {
  if (!s) return false;
  if (Number(s.attachments_count ?? s.files_count) > 0) return true;
  const buckets = [s.attachments, s.attachment, s.files, s.sessionFiles];
  return buckets.some((b) => (Array.isArray(b) ? b.length > 0 : !!b));
}

export function sessionHasPassed(s) {
  const dateStr = s?.date ?? null;
  const timeStr = s?.time ?? s?.starts_at ?? null;
  if (!dateStr) return false;
  try {
    const d = parseSessionClock(dateStr, timeStr, 23, 59);
    return !!(d && d < new Date());
  } catch { return false; }
}
