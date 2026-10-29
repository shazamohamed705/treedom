import { isIndeCoach } from "../../../services/auth";
import { isRecordedSession } from "../../../services/sessionType";
import { TYPE_TO_INT } from "./constants";

// ── session factory ───────────────────────────────────────────────────────────
export function newSession() {
  return {
    id: Date.now() + Math.random(),
    type: "zoom",
    title: "", coachId: "", date: "", time: "", timeTo: "",
    duration: "", zoomLink: "", location: "",
    videos: [], autoRecord: true, attachments: [],
  };
}

// ── build FormData payload for create/submit ──────────────────────────────────
export function buildFormData(form, sessions, isDraft, autoZoom = false) {
  const inde = isIndeCoach();
  const fd = new FormData();

  // ── names & description ──────────────────────────────────────────────────
  fd.append("name[ar]",         form.name);
  fd.append("name[en]",         form.name);
  fd.append("description[ar]",  form.desc);
  fd.append("description[en]",  form.desc);

  // ── coach ────────────────────────────────────────────────────────────────
  if (inde) {
    if (form.categoryId) fd.append("field_id", form.categoryId);
  } else {
    fd.append("field_id",  form.categoryId || "1");
    fd.append("coach_id",  form.coachId);
    if (form.backupCoachId) fd.append("backup_coach_id", form.backupCoachId);
  }

  // ── pricing & capacity ───────────────────────────────────────────────────
  fd.append("price_amount",  form.price    || "0");
  fd.append("currency",      form.currency || "SAR");
  fd.append("hours_count",   form.hours    || "0");
  fd.append("max_capacity",  form.maxCapacity || "15");

  // ── dates ────────────────────────────────────────────────────────────────
  fd.append("start_date", form.startDate);
  fd.append("end_date",   form.endDate);
  if (form.registrationDeadline) fd.append("registration_deadline", form.registrationDeadline);
  else if (form.endDate)         fd.append("registration_deadline", form.endDate);

  // ── recurrence ───────────────────────────────────────────────────────────
  fd.append("recurrence", form.recurrence || "weekly");

  // weekdays: map Arabic day names → numbers (0=Sun … 6=Sat)
  const AR_TO_NUM = {
    "الأحد": "0", "الاثنين": "1", "الثلاثاء": "2",
    "الأربعاء": "3", "الخميس": "4", "الجمعة": "5", "السبت": "6",
  };
  (form.weekDays || []).forEach(day => {
    const num = AR_TO_NUM[day] ?? day;
    fd.append("weekdays[]", num);
  });

  if (form.sessionTime)     fd.append("session_starts_at",        form.sessionTime);
  if (form.sessionDuration) fd.append("session_duration_minutes", form.sessionDuration);

  (form.excludedDates || []).forEach(d => fd.append("excluded_dates[]", d));

  // ── misc ─────────────────────────────────────────────────────────────────
  fd.append("sessions_count_planned", form.totalSessions);
  fd.append("is_draft", isDraft ? "1" : "0");

  // cover image — API expects "image"
  if (form.coverImage instanceof File) fd.append("image", form.coverImage);

  // attachments at program level
  (form.attachments || []).forEach(file => {
    if (file instanceof File) fd.append("attachments[]", file);
  });

  // keywords / tags
  form.tags.forEach(tag => fd.append("keywords[]", tag));

  // ── content type ─────────────────────────────────────────────────────────
  const contentType = sessions.length > 0 ? (TYPE_TO_INT[sessions[0].type] ?? 0) : 0;
  fd.append("content_type", String(contentType));

  const skipMeetingUrl = autoZoom || inde;

  // ── sessions ─────────────────────────────────────────────────────────────
  sessions.forEach((s, idx) => {
    const p = `sessions[${idx}]`;
    const recorded = isRecordedSession(s.type);

    fd.append(`${p}[title][ar]`, s.title || "جلسة");
    fd.append(`${p}[title][en]`, s.title || "Session");
    fd.append(`${p}[type]`,      String(TYPE_TO_INT[s.type] ?? 0));

    if (s.date)    fd.append(`${p}[date]`,      s.date);
    if (!recorded && s.time)   fd.append(`${p}[starts_at]`, s.time);
    if (!recorded && s.timeTo) fd.append(`${p}[ends_at]`,   s.timeTo);

    // duration_minutes
    if (!recorded && s.type === "offline" && s.time && s.timeTo) {
      const [sh, sm] = s.time.split(":").map(Number);
      const [eh, em] = s.timeTo.split(":").map(Number);
      const mins = eh * 60 + em - (sh * 60 + sm);
      fd.append(`${p}[duration_minutes]`, mins > 0 ? String(mins) : "60");
    } else {
      fd.append(`${p}[duration_minutes]`, s.duration || "60");
    }

    if (inde) fd.append(`${p}[attendance_enabled]`, "1");
    if (s.type === "zoom" && !skipMeetingUrl && s.zoomLink) fd.append(`${p}[meeting_url]`, s.zoomLink);
    if (s.type === "offline" && s.location)                 fd.append(`${p}[location]`,    s.location);
    if (recorded && s.videos?.[0] instanceof File)          fd.append(`${p}[video]`,       s.videos[0]);
    if (!inde && s.coachId)                                 fd.append(`${p}[coach_id]`,    s.coachId);

    (s.attachments ?? []).forEach(file => {
      if (file instanceof File) fd.append(`${p}[attachments][]`, file);
    });
  });

  // ── units & lessons (curriculum structure) ─────────────────────────────────
  // unit shape: { title, desc, lessonNames: [{ name, desc, video, attachments }] | [string] }
  (form.units || []).forEach((unit, ui) => {
    const up    = `units[${ui}]`;
    const uTitle = unit.title || `الوحدة ${ui + 1}`;
    const uDesc  = unit.desc || "";

    fd.append(`${up}[title][ar]`,        uTitle);
    fd.append(`${up}[title][en]`,        uTitle);
    fd.append(`${up}[description][ar]`,  uDesc);
    fd.append(`${up}[description][en]`,  uDesc);

    (unit.lessonNames || []).forEach((lesson, li) => {
      const lp = `${up}[lessons][${li}]`;
      // lessonNames entries can be plain strings or { name, ... } objects
      const lTitle = typeof lesson === "object"
        ? (lesson.name || `درس ${li + 1}`)
        : (lesson || `درس ${li + 1}`);
      fd.append(`${lp}[title][ar]`, lTitle);
      fd.append(`${lp}[title][en]`, lTitle);
    });
  });

  return fd;
}

// ── debug helper: print all FormData entries to console ──────────────────────
// Groups entries by their top-level prefix (program / sessions / units / …)
// so it's easy to verify the full payload sent to the endpoint.
export function debugFormData(label, fd) {
  const entries = [...fd.entries()];
  const buckets  = new Map();      // prefix -> [[key, val], …]
  let fileCount  = 0;

  for (const [key, val] of entries) {
    const isFile = val instanceof File;
    if (isFile) fileCount++;
    const prefix = key.includes("[")
      ? key.slice(0, key.indexOf("["))     // e.g. sessions, units, attachments
      : key;                                // e.g. name[ar] -> "name"
    if (!buckets.has(prefix)) buckets.set(prefix, []);
    buckets.get(prefix).push([key, val]);
  }

  console.group(`%c[AddProgram] ${label}`, "color:#024677;font-weight:bold");
  console.log(`total fields: ${entries.length}  (files: ${fileCount})`);
  for (const [prefix, rows] of buckets) {
    console.groupCollapsed(`%c${prefix}  (${rows.length})`, "color:#14b8a6;font-weight:600");
    for (const [key, val] of rows) {
      if (val instanceof File) console.log(key, `📁 ${val.name} (${val.size}b, ${val.type || "—"})`);
      else                     console.log(key, "→", val);
    }
    console.groupEnd();
  }
  console.groupEnd();
}

// ── extract a human-readable error message from an API error ─────────────────
export function extractErrorMsg(err) {
  const msg = err?.message ?? err?.data?.message;
  if (msg == null) return null;
  if (typeof msg === "string") return msg;
  if (typeof msg === "object") {
    const first = Object.values(msg).find(v => v != null && v !== "" && typeof v === "string");
    if (first) return first;
    try { return JSON.stringify(msg); } catch { return ""; }
  }
  return String(msg);
}
