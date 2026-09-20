import { useState, useEffect, useCallback } from "react";
import { fetchCoachSessionDetail, fetchCoachSessionAttendance, notifyCoachSession, startCoachSession, notifyCoachTrainee } from "../services/api";
import { hasPermission } from "../services/auth";
import { computeStatus, markCoachSessionStarted, sessionAlreadyStarted } from "./SessionsPage";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const IcoBack   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoGrad   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IcoZoom   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const IcoPrint  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const IcoExport = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoBell   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoPinBig = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoTrend  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IcoBars   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoPlay   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoSpinner = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M12 2a10 10 0 0 1 10 10"/></svg>;

// ─────────────────────────────────────────────────────────────────────────────
// Mini donut
// ─────────────────────────────────────────────────────────────────────────────
function MiniDonut({ pct }) {
  const C = 2 * Math.PI * 14;
  return (
    <svg width="54" height="54" viewBox="0 0 36 36" className="shrink-0">
      <circle cx="18" cy="18" r="14" fill="none" stroke="#E6EDF2" strokeWidth="4"/>
      <circle cx="18" cy="18" r="14" fill="none" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * C} ${C}`} transform="rotate(-90 18 18)"/>
      <text x="18" y="21.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#024677">{pct}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendee row
// ─────────────────────────────────────────────────────────────────────────────
function AttendeeRow({ a, loc, sessionId }) {
  const [busy,    setBusy]    = useState(false);
  const [done,    setDone]    = useState(false);
  const [rowErr,  setRowErr]  = useState(null);

  const attended = a.attended === true || a.status === "present" || a.status === "attended" || !!a.checked_in_at;
  const checkTime = a.checked_in_at_time ?? a.checked_in_at;

  const handleNotifyOne = async () => {
    if (busy || done || !a.id || !sessionId) return;
    setBusy(true);
    setRowErr(null);
    try {
      await notifyCoachTrainee(sessionId, a.id);
      setDone(true);
    } catch (err) {
      setRowErr(err?.message ?? "فشل الإرسال");
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-semibold text-slate-800">{a.name ?? a.trainee_name ?? "—"}</p>
        {a.email && <p className="text-[11px] text-slate-400">{a.email}</p>}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-xs font-semibold ${attended ? "text-teal-600" : "text-red-500"}`}>
          {attended ? "حاضر" : "غائب"}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 tabular-nums">
        {checkTime || "—"}
      </td>
      <td className="px-4 py-3 text-center text-xs text-slate-500">{loc}</td>
      <td className="px-4 py-3 text-center">
        {rowErr && <p className="text-[10px] text-red-400 mb-1">{rowErr}</p>}
        {hasPermission("sessions.notify") && (
          <button
            onClick={handleNotifyOne}
            disabled={busy || done}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-lg border transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={done
              ? { background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }
              : { background: "#fff",    color: "#475569", borderColor: "#e2e8f0" }}>
            {busy
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              : <IcoBell />}
            {done ? "تم الإشعار" : "تنبيه"}
          </button>
        )}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function TrainerSessionViewPage({ sessionId, onBack }) {
  const [s,        setS]        = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [startErr, setStartErr] = useState(null);
  const [starting, setStarting] = useState(false);
  const [notified, setNotified] = useState(false);
  const [filter,   setFilter]   = useState("الكل");
  const [search,   setSearch]   = useState("");

  const load = useCallback(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchCoachSessionDetail(sessionId),
      fetchCoachSessionAttendance(sessionId).catch(() => null),
    ])
      .then(([detail, attendance]) => {
        const d = detail?.data ?? detail ?? {};
        setS(d);

        const att      = attendance?.data ?? attendance ?? {};
        const attendees = att.attendees ?? {};
        const stats     = attendees.summary ?? att.statistics ?? {};

        const students     = attendees.students ?? [];
        const employees    = attendees.employees ?? [];
        const presentAll   = attendees.present?.all ?? [];
        const presentIds   = new Set(presentAll.map(x => x?.id).filter(v => v != null));
        const enrolled     = [...students, ...employees];

        const toRows = arr => arr.map(t => {
          const p = presentIds.has(t?.id);
          return {
            id: t?.id,
            name: t?.name ?? t?.trainee_name ?? t?.student_name ?? t?.user?.name,
            email: t?.email ?? t?.user?.email,
            attended: p || t?.attended === true || t?.status === "present" || t?.status === "attended" || !!t?.checked_in_at,
            checked_in_at_time: t?.checked_in_at_time ?? t?.checked_in_at ?? null,
          };
        });

        setTrainees(enrolled.length > 0 ? toRows(enrolled) : toRows(presentAll));
        setSummary({
          total:   typeof stats.total_enrolled   === "number" ? stats.total_enrolled
                 : typeof stats.trainees_total   === "number" ? stats.trainees_total
                 : enrolled.length,
          present: typeof stats.total_present    === "number" ? stats.total_present
                 : typeof stats.trainees_present === "number" ? stats.trainees_present
                 : presentAll.length,
          absent:  typeof stats.total_absent     === "number" ? stats.total_absent
                 : typeof stats.trainees_absent  === "number" ? stats.trainees_absent
                 : 0,
          percent: typeof stats.attendance_percent === "number" ? stats.attendance_percent
                 : typeof att.attendance_percent   === "number" ? att.attendance_percent
                 : null,
        });
      })
      .catch(err => setError(err.message ?? "حدث خطأ أثناء تحميل الجلسة"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const timeStatus = computeStatus(s);
  const inWindow  = timeStatus === "live";
  const isLive    = inWindow || !!(s?.is_live || s?.status === "live" || s?.status === "running");
  const timePassed = timeStatus === "ended";
  const isEnded   = timePassed || !!(s?.status === "ended" || s?.timing?.has_ended || s?.actual_ended_at);
  const alreadyStarted = sessionAlreadyStarted(s);
  const canPressStart = inWindow && !alreadyStarted && !isEnded;
  const isOffline = (s?.delivery_mode ?? s?.type?.delivery_mode) === "offline";

  const totalTrainees = s ? (s.trainees_count ?? summary?.total ?? trainees.length) : 0;
  const presentCount  = summary?.present ?? trainees.filter(t => t.attended).length;
  const absentCount   = summary?.absent ?? Math.max(0, totalTrainees - presentCount);
  const pct           = summary && typeof summary.percent === "number"
    ? Math.round(summary.percent)
    : totalTrainees > 0 ? Math.round((presentCount / totalTrainees) * 100) : 0;
  const locText = isOffline ? (s?.location || "حضوري") : "أونلاين";
  const durationText = s?.duration_minutes ? `${s.duration_minutes} دقيقة` : (s?.actual_ended_at && s?.actual_started_at ? "—" : "120 دقيقة");

  const FILTERS = ["الكل", "حاضر", "غائب"];

  const filtered = trainees.filter(a => {
    const attended = a.attended;
    const matchFilter =
      filter === "الكل" ||
      (filter === "حاضر" && attended) ||
      (filter === "غائب" && !attended);
    const matchSearch = !search.trim() || (a.name || "").includes(search) || (a.email || "").includes(search);
    return matchFilter && matchSearch;
  });

  const handleStart = async () => {
    if (starting || !sessionId || alreadyStarted) return;
    setStartErr(null);
    setStarting(true);
    try {
      const res = await startCoachSession(sessionId);
      markCoachSessionStarted(sessionId);
      const updated = res?.data ?? res;
      if (updated?.id) setS(updated);
      load();
    } catch (err) {
      setStartErr(err.message ?? "تعذر بدء الجلسة");
    } finally {
      setStarting(false);
    }
  };

  const handleNotify = async () => {
    try {
      await notifyCoachSession(sessionId);
      setNotified(true);
    } catch {
      setNotified(false);
    }
  };

  const joinUrl = s?.meeting_url || s?.video_url;

  if (loading && !s) {
    return (
      <main className="flex-1 flex items-center justify-center" dir="rtl">
        <IcoSpinner />
      </main>
    );
  }

  if (error && !s) {
    return (
      <main className="flex-1 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <p className="text-sm font-medium text-red-500">{error}</p>
          <button onClick={load}
            className="text-xs font-bold px-5 py-2.5 rounded-xl text-white"
            style={{ background: "#024677" }}>إعادة المحاولة</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto" dir="rtl" style={{ background: "#FFFFFF" }}>
      <div className="w-full max-w-[1020px] mx-auto px-4 sm:px-5 py-5 space-y-4">

        {/* breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <IcoGrad />
            <span className="text-sm font-bold" style={{ color: "#024677" }}>{s?.title}</span>
            {s?.program?.name && <span className="text-xs text-slate-400">— {s.program.name}</span>}
            {s?.coach?.name && <span className="text-xs text-slate-400">المدرب: {s.coach.name}</span>}
            <span className="text-xs text-slate-400">{s?.date} | {s?.starts_at}</span>
            {isLive && (
              <span className="flex items-center gap-1 text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"/>جارية الآن
              </span>
            )}
            {isEnded && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">انتهت</span>
            )}
          </div>
          <button onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition">
            العودة لقائمة الجلسات<IcoBack />
          </button>
        </div>

        {/* action button — only during session start→end window */}
        {!isEnded && (inWindow || alreadyStarted) && (
          <div className="flex justify-end items-center gap-3">
            {startErr && <span className="text-xs text-red-500">{startErr}</span>}
            <button
              onClick={handleStart}
              disabled={starting || !canPressStart}
              className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: canPressStart ? "#14b8a6" : "#94a3b8" }}>
              <IcoPlay />{starting ? "جاري البدء..." : (alreadyStarted ? "جلسة نشطة" : "بدء الجلسة")}
            </button>
          </div>
        )}

        {/* ended stat cards */}
        {isEnded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold" style={{ color: "#024677" }}>{s?.actual_ended_at ?? s?.ends_at}</span>
                <IcoTrend />
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-2">وقت انتهاء الجلسة</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold" style={{ color: "#024677" }}>{durationText}</span>
                <IcoBars />
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-2">مدة الجلسة</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-3">
              <div>
                <span className="text-2xl font-extrabold block" style={{ color: "#024677" }}>{pct}%</span>
                <p className="text-xs font-semibold text-slate-400 mt-2">
                  نسبة الحضور ({presentCount} / {totalTrainees})
                </p>
              </div>
              <MiniDonut pct={pct} />
            </div>
          </div>
        )}

        {/* offline venue */}
        {isOffline && s?.location && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <p className="text-base font-bold" style={{ color: "#024677" }}>مقر انعقاد الجلسة</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-5 py-3">
              <IcoPinBig />
              <span className="text-sm font-semibold text-slate-700">{s.location}</span>
            </div>
          </div>
        )}

        {/* online join */}
        {!isOffline && joinUrl && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3"
              style={{ borderBottom: "1.32px solid #F1F5F9" }}>
              <div>
                <p className="text-sm font-bold" style={{ color: isEnded ? "#94a3b8" : "#024677" }}>
                  {isLive ? "الانضمام للبث المباشر" : isEnded ? "رابط الجلسة (انتهت)" : "رابط الجلسة الأونلاين"}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-xs" dir="ltr">{joinUrl}</p>
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
                <a href={joinUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition shrink-0"
                  style={{ background: "#024677" }}>
                  <IcoZoom />{isLive ? "الانضمام للبث المباشر" : "الانضمام للجلسة"}
                </a>
              )}
            </div>
          </div>
        )}

        {/* attendance table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>
              <span className="text-sm font-bold" style={{ color: "#024677" }}>سجل الحضور</span>
              <span className="text-xs text-slate-400">({presentCount} حاضر / {absentCount} غائب / {totalTrainees} مسجل)</span>
            </div>
            <div className="flex items-center gap-2">
              {hasPermission("sessions.notify") && (
                <button onClick={handleNotify}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                  style={notified
                    ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                    : { background: "#024677", color: "#fff" }}>
                  <IcoBell />{notified ? "تم الإشعار" : "تنبيه الطلاب"}
                </button>
              )}
              <button className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition">
                <IcoPrint />طباعة
              </button>
              <button className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition">
                <IcoExport />تصدير
              </button>
            </div>
          </div>

          {/* filters */}
          {(trainees.length > 0 || totalTrainees > 0) && (
            <div className="flex items-center justify-end px-4 py-3 border-b border-slate-100 gap-3 flex-wrap">
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IcoSearch /></span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن اسم متدرب..."
                  className="pr-8 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-44 focus:outline-none focus:border-teal-400 transition"/>
              </div>
              <div className="flex items-center gap-1">
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold transition"
                    style={f === filter
                      ? { background: "#024677", color: "#fff" }
                      : { background: "#f8fafc", color: "#024677", border: "1px solid #e2e8f0" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-right  text-xs font-semibold text-slate-500 px-4 py-3">اسم المتدرب</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">الحالة</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">وقت الدخول</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">اللوكيشن</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-sm text-slate-400">
                      {trainees.length === 0 ? "لا يوجد متدربون مسجلون حتى الآن" : "لا توجد نتائج مطابقة"}
                    </td>
                  </tr>
                ) : filtered.map(a => (
                  <AttendeeRow key={a.id ?? a.id_user ?? a.attendance_id} a={a} loc={locText} sessionId={sessionId} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
