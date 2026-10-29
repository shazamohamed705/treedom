import { useState, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  fetchSession,
  fetchSessionAttendance,
  notifySession,
  notifyTrainerTrainee,
  startSession,
} from "../../services/api";
import { isIndeCoach } from "../../services/auth";
import { computeStatus } from "./SessionsPage";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 14, stroke = "currentColor", sw = 2, fill = "none", cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" className={cls}>{d}</svg>
);

const IcoBack      = () => <Ico d={<polyline points="15 18 9 12 15 6"/>} />;
const IcoClock     = () => <Ico size={20} stroke="#024677" d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const IcoBarChart  = () => <Ico size={20} stroke="#024677" d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>} />;
const IcoLocation  = () => <Ico size={22} stroke="#024677" d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} />;
const IcoVideo     = () => <Ico size={17} stroke="#024677" d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />;
const IcoBell      = () => <Ico size={13} d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>} />;
const IcoPrint     = () => <Ico d={<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>} />;
const IcoDownload  = () => <Ico d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />;
const IcoSearch    = () => <Ico size={13} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoPlay      = () => <Ico d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>} />;
const IcoLive      = (props) => <Ico size={28} stroke="#14b8a6" sw={1.5} d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>} />;
const IcoPlayStart = () => <Ico fill="#fff" stroke="#fff" d={<polygon points="5 3 19 12 5 21 5 3"/>} />;
const IcoCheck     = () => <Ico d={<polyline points="20 6 9 17 4 12"/>} />;
const IcoSpinner   = ({ size = 14, color = "white" }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ── mini donut ────────────────────────────────────────────────────────────────
function MiniDonut({ pct = 0 }) {
  const r    = 14;
  const circ = 2 * Math.PI * r;
  const arc  = (pct / 100) * circ;
  return (
    <svg width="54" height="54" viewBox="0 0 36 36" className="shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#E6EDF2" strokeWidth="4" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="#024677" strokeWidth="4"
        strokeLinecap="round" strokeDasharray={`${arc} ${circ}`}
        transform="rotate(-90 18 18)" />
      <text x="18" y="21.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#024677">
        {pct}%
      </text>
    </svg>
  );
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 rounded-xl w-1/3" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  );
}

// ── result toast modal ────────────────────────────────────────────────────────
function ResultModal({ success, message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full max-w-[340px] bg-white rounded-2xl shadow-2xl p-7 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: success ? "#f0fdf4" : "#fff1f2" }}>
          {success
            ? <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            : <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
          }
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {success ? "تم الإرسال بنجاح" : "تعذر الإرسال"}
          </h3>
          <p className="text-sm text-slate-400 mt-1">{message}</p>
        </div>
        <button onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "#024677" }}>
          حسناً
        </button>
      </div>
    </div>
  );
}

function mapTrainerAttendance(att, session) {
  if (!att || typeof att !== "object") return null;
  const nested = att.attendees ?? att;
  const rows = []
    .concat(Array.isArray(att.trainees) ? att.trainees : [])
    .concat(nested.students ?? [])
    .concat(nested.employees ?? []);
  const seen = new Set();
  const trainees = rows.filter(r => {
    const key = r?.trainee_id ?? r?.id ?? r?.email ?? r?.name;
    if (key == null || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(r => ({
    ...r,
    trainee_id: r.trainee_id ?? r.id ?? r.id_user,
    attended: r.attended ?? (r.status_key === "present" || r.status === 1),
    status_label: typeof r.status_label === "object"
      ? (r.status_label?.text ?? r.status_label?.value)
      : r.status_label,
    checked_in_at_time: r.checked_in_at_time ?? r.checked_in_at ?? null,
  }));
  const stats = att.statistics ?? {};
  const summary = nested.summary ?? att.summary ?? {};
  const counts = att.counts ?? {};
  return {
    trainees,
    statistics: {
      trainees_total:   stats.trainees_total   ?? counts.trainees_total   ?? summary.total_enrolled ?? session?.trainees_count ?? 0,
      trainees_present: stats.trainees_present ?? counts.trainees_present ?? summary.total_present  ?? 0,
      trainees_absent:  stats.trainees_absent  ?? summary.total_absent    ?? 0,
    },
    coach: att.coach ?? null,
    timeline: att.timeline ?? [],
  };
}
function AttendeeRow({ attendee, locText, onNotify, sessionId }) {
  const present = attendee.attended === true;
  const inde = isIndeCoach();
  const traineeId = attendee.trainee_id ?? attendee.id ?? attendee.id_user;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [rowErr, setRowErr] = useState(null);

  const handleClick = async () => {
    if (inde) {
      if (busy || done || !sessionId || traineeId == null) return;
      setBusy(true);
      setRowErr(null);
      try {
        await notifyTrainerTrainee(sessionId, traineeId);
        setDone(true);
      } catch (err) {
        setRowErr(err?.message ?? "فشل الإرسال");
      } finally {
        setBusy(false);
      }
      return;
    }
    onNotify?.();
  };

  return (
    <tr
      className="transition-colors"
      style={present
        ? { background: "#F8FAFC", borderBottom: "1.32px solid #F1F5F9" }
        : { borderBottom: "1px solid #F1F5F9" }}>
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-semibold text-slate-800">{attendee.name}</p>
        {attendee.email && <p className="text-[11px] text-slate-400">{attendee.email}</p>}
        {attendee.organization && <p className="text-[11px] text-slate-400">{attendee.organization}</p>}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-xs font-semibold ${present ? "text-teal-600" : "text-red-500"}`}>
          {attendee.status_label ?? (present ? "حاضر" : "غائب")}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 tabular-nums">
        {attendee.checked_in_at_time || "—"}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-1">
          {attendee.check_in_location || locText}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {rowErr && <p className="text-[10px] text-red-400 mb-1">{rowErr}</p>}
        <button
          onClick={handleClick}
          disabled={inde && (busy || done || traineeId == null)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-lg border transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={done
            ? { background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }
            : { background: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
          {busy ? <IcoSpinner size={11} color="currentColor" /> : <IcoBell />}
          {done ? "تم الإشعار" : "تنبيه"}
        </button>
      </td>
    </tr>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function SessionViewPage({ session: sessionProp = {}, onBack }) {
  // resolve session ID
  const sessionId = sessionProp?.id ?? (() => {
    try { return JSON.parse(sessionStorage.getItem("viewSession") || "{}"); } catch { return {}; }
  })()?.id ?? null;

  const [sessionData,  setSessionData]  = useState(null);
  const [attendance,   setAttendance]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // UI state
  const [presFilter,   setPresFilter]   = useState("الكل");   // الكل | حاضر | غائب
  const [searchQuery,  setSearchQuery]  = useState("");
  const [result,       setResult]       = useState(null);     // {success, message}
  const [notifying,    setNotifying]    = useState(false);
  const [notified,     setNotified]     = useState(false);
  const [starting,     setStarting]     = useState(false);

  // load
  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const inde = isIndeCoach();
    Promise.all([
      fetchSession(sessionId),
      fetchSessionAttendance(sessionId).catch(() => null),
    ])
      .then(([sesRes, attRes]) => {
        const data = sesRes?.data ?? null;
        setSessionData(data);
        setAttendance(inde
          ? (mapTrainerAttendance(attRes?.data, data) ?? mapTrainerAttendance(data?.attendance, data))
          : (attRes?.data ?? null));
      })
      .catch(err => setError(err.message || "حدث خطأ أثناء تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived values ─────────────────────────────────────────────────────────
  const s = sessionData ?? sessionProp;

  // Use computeStatus so time-based logic matches the rest of the app.
  // e.g. API may still return "scheduled" for a session whose time has passed.
  const _resolvedStatus = computeStatus(s);
  const isEnded   = s?.status === "ended" || !!s?.actual_ended_at || s?.timing?.has_ended === true || _resolvedStatus === "ended";
  const isLive    = !isEnded && (
    s?.is_live === true
    || s?.status === "running"
    || s?.timing?.status === "running"
    || _resolvedStatus === "live"
  );
  const isOffline = (s?.delivery_mode ?? s?.type?.delivery_mode) === "offline";
  const isOnline  = !isOffline;

  const title      = s?.title        || "جلسة";
  const program    = s?.program?.name ?? s?.program_name ?? (typeof s?.program === "string" ? s.program : "") ?? "";
  const date       = s?.date         || "";
  const timeFrom   = s?.starts_at    || s?.timing?.scheduled?.starts_at_time || "";
  const timeTo     = s?.ends_at      || s?.timing?.scheduled?.ends_at_time   || "";
  const meetingUrl = s?.meeting_url  || s?.meetingUrl  || "";
  const venue      = s?.location     || s?.venue       || "";

  const trainees     = attendance?.trainees   ?? [];
  const stats        = attendance?.statistics ?? {};
  const totalCount   = stats.trainees_total   ?? s?.trainees_count ?? 0;
  const presentCount = stats.trainees_present ?? 0;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // If the session has been started (actual_started_at exists), the coach is
  // considered present regardless of what the API returns in coach.attended.
  const rawCoach = attendance?.coach ?? null;
  const sessionActuallyStarted = !!(s?.actual_started_at ?? s?.timing?.actual_started_at);
  const coach = rawCoach
    ? {
        ...rawCoach,
        attended:     sessionActuallyStarted ? true : !!rawCoach.attended,
        status_key:   sessionActuallyStarted ? "present" : rawCoach.status_key,
        status_label: sessionActuallyStarted ? "حاضر"   : rawCoach.status_label,
      }
    : null;

  // files (recording + attachments)
  const files = [];
  const seenUrls = new Set();
  const pushFile = (name, url) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    files.push({ name, url });
  };
  if (s?.video_url) pushFile("تسجيل الجلسة", s.video_url);
  if (s?.image)     pushFile("صورة الجلسة", s.image);
  const extraFiles = []
    .concat(s?.attachments ?? [])
    .concat(s?.attachment ? (Array.isArray(s.attachment) ? s.attachment : [s.attachment]) : [])
    .concat(s?.files ?? []);
  extraFiles.forEach((item) => {
    if (!item) return;
    if (typeof item === "string") {
      if (item === s?.video_url) return;
      pushFile(decodeURIComponent(item.split("/").pop() || "مرفق"), item);
      return;
    }
    const url = item.url ?? item.path ?? item.file_url ?? item.full_url;
    if (!url || url === s?.video_url) return;
    pushFile(item.original_name ?? item.file_name ?? item.name ?? "مرفق", url);
  });

  // timeline for chart
  const timeline    = attendance?.timeline ?? [];
  const chartData   = timeline.length > 0
    ? timeline.map(t => ({ time: t.time || "", count: t.count || 0 }))
    : [
        { time: timeFrom || "البداية", count: 0 },
        { time: timeTo || "الآن", count: presentCount || 0 },
      ];
  const chartMax = Math.max(5, presentCount, totalCount, ...chartData.map(d => Number(d.count) || 0));

  const locText = isOffline ? (venue || "حضوري") : "Zoom";

  // ── filtered attendees ─────────────────────────────────────────────────────
  const filtered = trainees.filter(tr => {
    const present = tr.attended === true;
    const matchPres =
      presFilter === "الكل"   ? true :
      presFilter === "حاضر"   ? present :
      /* غائب */               !present;
    const q = searchQuery.trim();
    const matchSearch = !q || tr.name?.includes(q) || tr.email?.includes(q);
    return matchPres && matchSearch;
  });

  // ── actions ────────────────────────────────────────────────────────────────
  const handleNotify = async () => {
    if (notifying || notified || !sessionId) return;
    setNotifying(true);
    try {
      const res = await notifySession(sessionId);
      setNotified(true);
      setResult({ success: true, message: res?.message || "تم إرسال رابط الجلسة للطلاب بنجاح" });
    } catch (err) {
      setResult({ success: false, message: err?.message || "تعذر إرسال التنبيه، حاول مرة أخرى" });
    } finally {
      setNotifying(false);
    }
  };

  const handleStart = async () => {
    if (starting || !sessionId) return;
    setStarting(true);
    try {
      const res = await startSession(sessionId);
      // Apply returned data immediately for instant UI update
      const immediate = res?.data ?? null;
      if (immediate?.id) setSessionData(immediate);
      // Then do a full reload to be safe
      const updated = await fetchSession(sessionId);
      const data = updated?.data ?? immediate ?? null;
      setSessionData(data);
      if (isIndeCoach()) {
        const attRes = await fetchSessionAttendance(sessionId).catch(() => null);
        setAttendance(mapTrainerAttendance(attRes?.data, data) ?? mapTrainerAttendance(data?.attendance, data));
      }
      setResult({ success: true, message: res?.message || "تم بدء الجلسة بنجاح" });
    } catch (err) {
      setResult({ success: false, message: err?.message || "تعذر بدء الجلسة" });
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto" dir="rtl" style={{ background: "#FFFFFF" }}>
        <div className="w-full max-w-[1020px] mx-auto px-4 sm:px-5 py-5 space-y-4">

          {/* ── header ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <IcoPlay />
              <span className="text-sm font-bold" style={{ color: "#024677" }}>{title}</span>
              {program && <span className="text-xs text-slate-400">— {program}</span>}
              {date    && <span className="text-xs text-slate-400">{date}{timeFrom ? ` | ${timeFrom}` : ""}</span>}
              {isLive  && (
                <span className="flex items-center gap-1 text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  جارية الآن
                </span>
              )}
            </div>
            <button onClick={onBack}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition">
              العودة لقائمة الجلسات <IcoBack />
            </button>
          </div>

          {/* ── loading / error ── */}
          {loading && <Skeleton />}
          {error   && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm text-center">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ── start button (not ended) ── */}
              {!isEnded && (
                <div className="flex justify-end">
                  <button
                    onClick={handleStart}
                    disabled={starting || !(s?.can_start ?? s?.canStart)}
                    className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: (s?.can_start ?? s?.canStart) ? "#14b8a6" : "#94a3b8" }}>
                    {starting ? <IcoSpinner /> : <IcoPlayStart />}
                    {(s?.can_start ?? s?.canStart) ? "بدء الجلسة" : (isLive ? "جلسة نشطة" : "بدء الجلسة")}
                  </button>
                </div>
              )}

              {/* ── ended summary cards ── */}
              {isEnded && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* end time */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold" style={{ color: "#024677" }}>
                        {s?.timing?.ended_at_time || timeTo || "—"}
                      </span>
                      <IcoClock />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 mt-2">وقت انتهاء الجلسة</p>
                  </div>

                  {/* duration */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold" style={{ color: "#024677" }}>
                        {s?.timing?.actual_duration_minutes ?? s?.duration_minutes ?? "—"} دقيقة
                      </span>
                      <IcoBarChart />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 mt-2">مدة الجلسة الفعلية</p>
                  </div>

                  {/* attendance % */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-2xl font-extrabold block" style={{ color: "#024677" }}>
                        {attendancePct}%
                      </span>
                      <p className="text-xs font-semibold text-slate-400 mt-2">
                        نسبة الحضور النهائية ({presentCount} / {totalCount})
                      </p>
                    </div>
                    <MiniDonut pct={attendancePct} />
                  </div>
                </div>
              )}

              {/* ── venue card (offline) ── */}
              {isOffline && venue && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                  <p className="text-base font-bold" style={{ color: "#024677" }}>مقر انعقاد الجلسة</p>
                  <div className="flex items-center w-full min-w-0"
                    style={{ gap: 13, borderRadius: 13, border: "1.32px solid #E6EDF2", padding: "13px 20px" }}>
                    <span className="shrink-0"><IcoLocation /></span>
                    <span className="text-sm font-semibold text-slate-700 truncate">{venue}</span>
                  </div>
                </div>
              )}

              {/* ── attendance chart — always visible, even at 0 ── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-1">
                  <div className="text-right mb-2">
                    <p className="text-2xl font-extrabold" style={{ color: "#024677" }}>
                      إجمالي الحضور {presentCount} / {totalCount}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      نسبة الحضور الحالية {attendancePct}%
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 text-right mb-3">
                    تسجيل الحضور عبر الجلسة
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#94a3b8" stopOpacity={0.6} />
                          <stop offset="44%"  stopColor="#024677" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#024677" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, chartMax]} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }}
                        formatter={v => [v, "متدرب"]} />
                      <Area type="monotone" dataKey="count"
                        stroke="#64748b" strokeWidth={2.5}
                        fill="url(#attendGrad)"
                        dot={{ r: 3, fill: "#64748b" }}
                        activeDot={{ r: 5, strokeWidth: 0, fill: "#64748b" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              {/* ── meeting link / live stream ── */}
              {isOnline && meetingUrl && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3"
                    style={{ borderBottom: "1.32px solid #F1F5F9" }}>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-bold" style={{ color: isEnded ? "#94a3b8" : "#024677" }}>
                        {isLive ? "الانضمام للبث المباشر" : isEnded ? "رابط الجلسة (انتهت)" : "رابط الجلسة الأونلاين"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs" dir="ltr">{meetingUrl}</p>
                    </div>
                    {isEnded ? (
                      <span className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl shrink-0 cursor-not-allowed select-none"
                        style={{ background: "#f1f5f9", color: "#94a3b8" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        الجلسة انتهت
                      </span>
                    ) : (
                      <a href={meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition shrink-0"
                        style={{ background: "#024677" }}>
                        <IcoPlay />
                        {isLive ? "الانضمام للبث المباشر" : "الانضمام للجلسة"}
                      </a>
                    )}
                  </div>
                  {isLive && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2"
                      style={{ background: "#F8FAFC" }}>
                      <IcoLive />
                      <p className="text-sm font-semibold text-teal-500">البث المباشر نشط</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── session files ── */}
              {files.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                  <p className="text-base font-bold" style={{ color: "#024677" }}>ملفات الجلسة</p>
                  <div className="flex flex-wrap gap-3">
                    {files.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold text-[#024677] border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition">
                        <IcoVideo /> {f.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── attendance table ── */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

                {/* table header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-sm font-bold" style={{ color: "#024677" }}>سجل الحضور</span>
                    {isLive && (
                      <span className="flex items-center gap-1.5 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-red-500">تحديث تلقائي</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      ({presentCount} حاضر / {totalCount} مسجل)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={handleNotify} disabled={notifying || notified || !sessionId}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
                      style={notified
                        ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                        : { background: "#024677", color: "#fff" }}>
                      {notifying ? <IcoSpinner /> : <IcoBell />}
                      {notified ? "تم الإشعار" : "تنبيه الطلاب"}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition">
                      <IcoPrint /> طباعة
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition">
                      <IcoDownload /> تصدير
                    </button>
                  </div>
                </div>

                {/* search + filter */}
                <div className="flex items-center justify-end px-4 py-3 border-b border-slate-100 gap-3 flex-wrap">
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <IcoSearch />
                    </span>
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن اسم متدرب..."
                      className="pr-8 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-44 focus:outline-none focus:border-teal-400 transition" />
                  </div>
                  <div className="flex items-center gap-1">
                    {["الكل", "حاضر", "غائب"].map(f => (
                      <button key={f} onClick={() => setPresFilter(f)}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold transition"
                        style={f === presFilter
                          ? { background: "#024677", color: "#fff" }
                          : { background: "#f8fafc", color: "#024677", border: "1px solid #e2e8f0" }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-right  text-xs font-semibold text-slate-500 px-4 py-3">اسم المتدرب</th>
                        <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">الحالة</th>
                        <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">وقت تسجيل الدخول</th>
                        <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">
                          <span className="inline-flex items-center gap-1">
                            <IcoLocation /> اللوكيشن
                          </span>
                        </th>
                        <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-sm text-slate-400">
                            {trainees.length === 0
                              ? "لا يوجد متدربون مسجلون في هذه الجلسة"
                              : "لا توجد نتائج مطابقة"}
                          </td>
                        </tr>
                      ) : filtered.map(tr => (
                        <AttendeeRow key={tr.id ?? tr.trainee_id} attendee={tr} locText={locText} onNotify={handleNotify} sessionId={sessionId} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── coach attendance ── */}
              {coach && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-sm font-bold mb-3" style={{ color: "#024677" }}>حضور المدرب</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700">{coach.name}</p>
                      <p className={`text-xs font-bold mt-0.5 ${coach.attended ? "text-teal-600" : "text-red-500"}`}>
                        {coach.status_label ?? (coach.attended ? "حاضر" : "غائب")}
                      </p>
                    </div>
                    {coach.checked_in_at && (
                      <span className="text-xs text-slate-400 tabular-nums">{coach.checked_in_at}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* result modal */}
      {result && (
        <ResultModal success={result.success} message={result.message} onClose={() => setResult(null)} />
      )}
    </>
  );
}
