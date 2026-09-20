import { useState, useEffect, useMemo, useRef } from "react";
import UserSessionViewPage from "../UserSessionViewPage";
import JoinSessionModal from "../JoinSessionModal";
import { sessionHasFiles } from "../UserProgramSessionPage/sessionHelpers";
import { fetchMySessions, checkInMySession, rememberSessionCheckIn, sessionLooksCheckedIn } from "../../services/api";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>{d}</svg>
);

const IcoCal      = () => <Ico size={16} stroke="#024677" d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcoChevL    = () => <Ico size={13} stroke="#64748b" d={<polyline points="15 18 9 12 15 6"/>}/>;
const IcoClock    = () => <Ico size={14} stroke="#64748b" d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const IcoUser     = () => <Ico size={14} stroke="#64748b" d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const IcoVideo    = () => <Ico size={13} stroke="#31AFEA" d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}/>;
const IcoDownload = () => <Ico size={14} stroke="#64748b" d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
const IcoRefresh  = () => <Ico size={14} stroke="#64748b" d={<><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const IcoPin      = () => <Ico size={14} stroke="#64748b" d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;
const IcoDir      = () => <Ico size={14} stroke="#64748b" d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;

// ── helpers ───────────────────────────────────────────────────────────────────
function computeStatus(s) {
  const today = new Date();
  const sessionDate = new Date((s.date ?? "") + "T00:00:00");
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sDate = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

  const parseTime = (t = "00:00") => {
    const cleaned = String(t).trim().toLowerCase();
    const isPm = /pm|م/.test(cleaned) && !cleaned.endsWith("am");
    const isAm = /am|ص/.test(cleaned);
    const m = cleaned.match(/(\d{1,2}):(\d{2})/);
    let h = m ? Number(m[1]) : 0;
    let min = m ? Number(m[2]) : 0;
    if (isNaN(h)) h = 0;
    if (isNaN(min)) min = 0;
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return [h, min];
  };

  const [sh, sm] = parseTime(s.starts_at);
  const [eh, em] = parseTime(s.ends_at);
  const start = new Date(sessionDate); start.setHours(sh, sm, 0, 0);
  const end   = new Date(sessionDate); end.setHours(eh, em, 0, 0);
  const hasEnd = !!(s.ends_at);

  if (s.is_completed || s.status === "ended" || s.status === "completed") return "completed";
  if (hasEnd && today > end) return "completed";
  if (s.is_live || s.status === "running" || s.status === "live") return "today";
  if (today >= start && (!hasEnd || today <= end)) return "today";
  if (sDate.getTime() === todayDate.getTime() && (!hasEnd || today <= end)) return "today";
  if (sDate > todayDate) return "upcoming";
  return "completed";
}

const arDateFmt = new Intl.DateTimeFormat("ar-SA", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
function formatArabicDate(iso) {
  if (!iso) return "";
  try { return arDateFmt.format(new Date(iso + "T00:00:00")); } catch { return iso; }
}

function getTodayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}

function mapSession(s, index) {
  // s.id is the enrollment/pivot id; s.session_id is the actual session primary key
  // The check-in endpoint is /trainee/sessions/{session_id}/check-in
  const realSessionId = s.session_id ?? s.id;
  return {
    id:               realSessionId,
    rawId:            realSessionId,           // always the real session id for API calls
    enrollId:         s.id,                    // enrollment id if needed
    title:            s.program_name ?? s.title,
    sessionNum:       s.session_number ?? index + 1,
    subtitle:         s.session_title ?? s.title,
    timeFrom:         s.starts_at,
    timeTo:           s.ends_at,
    type:             s.type?.delivery_mode ?? s.delivery_mode ?? "online",
    typeText:         s.type?.text ?? null,
    trainer:          s.coach_name,
    status:           computeStatus(s),
    isRunning:        !!(s.is_live || s.status === "running" || s.status === "live"),
    date:             s.date,
    venue:            s.location ?? null,
    meetingUrl:       s.meeting_url ?? null,
    canCheckIn:       s.can_check_in,
    isCompleted:      s.is_completed,
    isCheckedIn:      sessionLooksCheckedIn(s, realSessionId),
    requiresLocation: s.requires_location,
    attachments:      s.attachments ?? s.files ?? s.attachment ?? [],
    files:            s.files ?? s.attachments ?? [],
    attachments_count: s.attachments_count ?? s.files_count,
  };
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white animate-pulse" dir="rtl">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-4 w-14 rounded bg-slate-200"/>
          <div className="h-5 w-40 rounded bg-slate-200"/>
        </div>
        <div className="h-3 w-56 rounded bg-slate-100"/>
        <div className="h-8 w-40 rounded-lg bg-slate-100"/>
        <div className="flex gap-2 border-t border-slate-100 pt-3 justify-end">
          <div className="h-8 w-24 rounded-xl bg-slate-200"/>
          <div className="h-8 w-28 rounded-xl bg-slate-100"/>
        </div>
      </div>
    </div>
  );
}

// ── session card ──────────────────────────────────────────────────────────────
function SessionCard({ session, onView, onJoin, joinBusy, selectedId, onSelect }) {
  const isToday     = session.status === "today";
  const isEnded     = session.status === "ended";
  const isUpcoming  = session.status === "upcoming";
  const isCompleted = session.status === "completed";
  const isSelected  = selectedId === (session.rawId ?? session.id);
  const isBusy      = joinBusy === (session.rawId ?? session.id);
  // isCheckedIn comes directly from the session object (set after check-in)
  const isCheckedIn = !!(session.isCheckedIn || session.isCompleted);
  const hasFiles    = sessionHasFiles(session);

  const displayDate = session.date === getTodayStr() ? null : formatArabicDate(session.date);

  // status badge config — matches screenshot exactly
  const stCfg = isCompleted
    ? { label: "مكتملة", color: "#22c55e", dot: "#22c55e" }
    : isToday
    ? { label: "اليوم",  color: "#f59e0b", dot: "#f59e0b" }
    : isUpcoming
    ? { label: "قادمة",  color: "#31AFEA", dot: "#31AFEA" }
    : { label: "انتهت",  color: "#94a3b8", dot: "#94a3b8" };

  const typeLabel = session.typeText
    ?? (session.type === "online" ? "أونلاين" : "أوفلاين");

  return (
    <div
      dir="rtl"
      onClick={() => onSelect?.(session.rawId ?? session.id)}
      className="rounded-2xl border bg-white overflow-hidden w-full cursor-pointer"
      style={{
        borderColor: isSelected ? "#009966" : isCompleted ? "#22c55e33" : "#e2e8f0",
        boxShadow: isSelected
          ? "0 0 0 1.5px #00996615, 0 2px 10px rgba(8,15,52,0.07)"
          : "0 1px 6px rgba(8,15,52,0.05)",
      }}
    >
      {/* green top bar for selected */}
      {isSelected && <div className="h-1.5 w-full" style={{ background: "#009966" }}/>}

      <div className="px-4 sm:px-5 py-4">

        {/* ── top row: title right, session-num + status left ── */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          {/* RIGHT: program name */}
          <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800 leading-snug text-right flex-1">
            {session.title}
          </h3>
          {/* LEFT: number badge */}
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <span
              className="inline-flex items-center gap-1 text-[12px] font-bold"
              style={{ color: stCfg.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: stCfg.dot }}/>
              {stCfg.label}
            </span>
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-extrabold"
              style={{ background: "#F2F5F8", color: "#024677" }}
            >
              {session.sessionNum}
            </span>
          </div>
        </div>

        {/* ── subtitle ── */}
        {session.subtitle && session.subtitle !== session.title && (
          <p className="text-[12px] sm:text-[13px] text-slate-500 mb-2 text-right leading-snug">
            الجلسة {session.sessionNum} — {session.subtitle}
          </p>
        )}

        {/* ── type + time row ── */}
        <div
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl mb-2 flex-wrap"
          style={{ background: "#F7F9FA" }}
        >
          <span
            className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-bold px-2 py-0.5 rounded-lg"
            style={{ background: "#EBF7FF", color: "#31AFEA" }}
          >
            <IcoVideo/> {typeLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] sm:text-[13px] text-slate-600 font-medium" dir="ltr">
            <IcoClock/>{session.timeFrom} ص–{session.timeTo} م
          </span>
        </div>

        {/* ── date (if not today) ── */}
        {displayDate && (
          <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-500 mb-2">
            <IcoCal/>{displayDate}
          </p>
        )}

        {/* ── venue ── */}
        {session.venue && (
          <p
            className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-600 mb-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: "#F7F9FA" }}
          >
            <IcoPin/>{session.venue}
          </p>
        )}

        {/* ── trainer ── */}
        {session.trainer && (
          <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-600 mb-3">
            <IcoUser/> م. {session.trainer}
          </p>
        )}

        {/* ── action buttons ── */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 flex-wrap justify-end">

          {isCompleted && (<>
            {isCheckedIn && (
              <span
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-2 rounded-xl text-white"
                style={{ background: "#16a34a" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                تم تسجيل الحضور
              </span>
            )}
            <button
              onClick={() => onView?.(session)}
              className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-4 py-2 rounded-xl text-white hover:opacity-90 transition"
              style={{ background: "#31AFEA" }}
            >
              عرض الجلسة
            </button>
            {hasFiles && (
              <button
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <IcoDownload/> ملفات الجلسة
              </button>
            )}
          </>)}

          {isToday && (<>
            {isCheckedIn ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-4 py-2 rounded-xl text-white cursor-default"
                style={{ background: "#16a34a" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                تم تسجيل الحضور
              </button>
            ) : session.canCheckIn === false ? (
              <button
                onClick={() => onView?.(session)}
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-4 py-2 rounded-xl text-white hover:opacity-90 transition"
                style={{ background: "#31AFEA" }}
              >
                عرض الجلسة
              </button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onJoin?.(session); }}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-4 py-2 rounded-xl text-white hover:opacity-90 transition disabled:opacity-60"
                style={{ background: "#024677" }}
              >
                {isBusy
                  ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  : null}
                {isBusy ? "جارِ التسجيل..." : "تسجيل الحضور"}
              </button>
            )}
            {hasFiles && (
              <button
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <IcoDownload/> ملفات الجلسة
              </button>
            )}
          </>)}

          {isUpcoming && (<>
            {session.venue && (
              <button className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                <IcoDir/> الاتجاهات
              </button>
            )}
            {hasFiles && (
              <button
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <IcoDownload/> ملفات الجلسة
              </button>
            )}
          </>)}

          {isEnded && (<>
            <button
              onClick={() => onView?.(session)}
              className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <IcoRefresh/> إعادة مشاهدة
            </button>
            {hasFiles && (
              <button
                className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <IcoDownload/> ملفات الجلسة
              </button>
            )}
          </>)}

        </div>
      </div>
    </div>
  );
}

// ── section label (اليوم / لاحقاً / السابقة) ────────────────────────────────
function SectionLabel({ type, count }) {
  if (type === "today") return (
    <div className="flex items-center gap-2 mt-4 mb-2" dir="rtl">
      <span className="text-[13px] font-extrabold" style={{ color: "#f59e0b" }}>● اليوم</span>
      <span
        className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: "#FEF3C7", color: "#f59e0b" }}
      >{count}</span>
    </div>
  );
  if (type === "upcoming") return (
    <div className="flex items-center gap-2 mt-5 mb-2" dir="rtl">
      <span className="text-[13px] font-extrabold" style={{ color: "#024677" }}>لاحقاً</span>
      <span
        className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: "#F2F5F8", color: "#64748b" }}
      >{count}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 mt-5 mb-2" dir="rtl">
      <span className="text-[13px] font-extrabold text-slate-500">السابقة</span>
      <span
        className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: "#F2F5F8", color: "#64748b" }}
      >{count}</span>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
const PER_PAGE = 5;

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-3 mt-5 flex-wrap" dir="rtl">
      {/* prev */}
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition disabled:opacity-30"
        style={{ border: "1px solid #e2e8f0", color: "#64748b", background: "#fff" }}
      >
        ‹
      </button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition"
          style={p === current
            ? { background: "#024677", color: "#fff", border: "none" }
            : { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }
          }
        >
          {p}
        </button>
      ))}

      {/* next */}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition disabled:opacity-30"
        style={{ border: "1px solid #e2e8f0", color: "#64748b", background: "#fff" }}
      >
        ›
      </button>
    </div>
  );
}

export default function UserSessionsPage({ onViewSession }) {
  const [tab,         setTab]         = useState("all");
  const [page,        setPage]        = useState(1);
  const [viewSession, setViewSession] = useState(null);
  const [joinBusy,    setJoinBusy]    = useState(null);
  const [joinMsg,     setJoinMsg]     = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [counts,      setCounts]      = useState({ all: 0, completed: 0, remaining: 0, upcoming: 0 });
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState(null);

  const handleViewSession = (s) => {
    if (onViewSession) onViewSession(s);
    else setViewSession(s);
  };

  const handleSelect = (id) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  // mark a session as checked-in directly in the sessions array → guaranteed re-render
  const markCheckedIn = (sid) => {
    rememberSessionCheckIn(sid);
    setSessions(prev => prev.map(s =>
      (s.rawId ?? s.id) === sid || String(s.id) === String(sid) ? { ...s, isCheckedIn: true } : s
    ));
  };

  const handleJoin = async (s) => {
    if (joinBusy || !s || s.isCheckedIn) return;
    const sid = s.rawId ?? s.id;
    setJoinBusy(sid);
    setJoinMsg(null);
    try {
      const res     = await checkInMySession(sid);
      const meeting = res?.data?.meeting_url ?? s.meetingUrl;
      markCheckedIn(sid);
      setJoinMsg({
        ok:      true,
        text:    res?.message ?? "تم تسجيل حضورك بنجاح.",
        meetUrl: meeting || null,
        sessionEnded: s.status === "completed" || s.status === "ended",
        session: { ...s, isCheckedIn: true },
      });
      setTimeout(() => fetchSessions(true), 1500);
    } catch (err) {
      const apiMsg = err?.message ?? null;

      const alreadyCheckedIn = apiMsg && (
        apiMsg.includes("مسبقاً") ||
        apiMsg.includes("سبق") ||
        apiMsg.includes("already")
      );

      const sessionNotStarted = apiMsg && (
        apiMsg.includes("لم تبدأ") ||
        apiMsg.includes("انتظر") ||
        apiMsg.includes("not started") ||
        (typeof apiMsg === "string" && apiMsg.toLowerCase().includes("not start"))
      );

      if (alreadyCheckedIn) {
        markCheckedIn(sid);
        setJoinMsg({
          ok:      true,
          text:    apiMsg || "تم تسجيل حضورك مسبقاً.",
          meetUrl: s.meetingUrl || null,
          sessionEnded: s.status === "completed" || s.status === "ended",
          session: { ...s, isCheckedIn: true },
        });
      } else if (sessionNotStarted && s.meetingUrl) {
        setJoinMsg({
          ok:      true,
          text:    "انتظر بدء المدرب.",
          meetUrl: s.meetingUrl,
          sessionEnded: false,
          session: s,
        });
      } else {
        setJoinMsg({ ok: false, text: apiMsg ?? "الجلسة غير متاحة حالياً.", meetUrl: null, session: null });
      }
    } finally {
      setJoinBusy(null);
    }
  };

  const fetchSessions = (silent = false) => {
    if (!silent) setLoading(true);
    fetchMySessions({ filter: "all" })
      .then(res => {
        const raw       = res?.data?.sessions ?? [];
        const apiCounts = res?.data?.counts   ?? {};
        setSessions(raw.map(mapSession));
        setCounts(apiCounts);
      })
      .catch(() => { if (!silent) setSessions([]); })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    fetchSessions();
    // background refresh every 30 s so live status updates are reflected
    const id = setInterval(() => fetchSessions(true), 30_000);
    return () => clearInterval(id);
  }, []);

  const today = getTodayStr();

  // tab counts
  const todayList    = sessions.filter(s => s.status === "today");
  const upcomingList = sessions.filter(s => s.status === "upcoming");
  const endedList    = sessions.filter(s => s.status === "completed" || s.status === "ended");

  const TABS = [
    { key: "all",      label: "الكل",    count: counts.all ?? sessions.length },
    { key: "today",    label: "اليوم",   count: todayList.length, dot: true },
    { key: "upcoming", label: "القادمة", count: counts.remaining ?? upcomingList.length },
    { key: "ended",    label: "السابقة", count: counts.completed ?? endedList.length },
  ];

  const filtered = useMemo(() => {
    if (tab === "today")    return todayList;
    if (tab === "upcoming") return upcomingList;
    if (tab === "ended")    return endedList;
    return sessions;
  }, [tab, sessions]); // eslint-disable-line

  const showGroups = tab === "all";

  // pagination
  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const pagedList   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // reset page on tab change
  const changeTab = (t) => { setTab(t); setPage(1); };

  // today time range for banner
  const todayTimeRange = (() => {
    if (!todayList.length) return null;
    const starts = todayList.map(s => s.timeFrom).filter(Boolean).sort();
    const ends   = todayList.map(s => s.timeTo).filter(Boolean).sort();
    return starts.length ? `${starts[0]} ص — ${ends[ends.length - 1]} م` : null;
  })();

  if (viewSession) {
    return <UserSessionViewPage session={viewSession} onBack={() => setViewSession(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0 w-full" dir="ltr">
      <div className="w-full px-3 sm:px-6 lg:px-10 py-4 sm:py-6" dir="rtl">

        {/* ── today banner ── */}
        {!loading && todayList.length > 0 && (
        <div
          className="rounded-2xl bg-white border border-slate-200 px-4 sm:px-5 py-3 mb-4 flex items-center justify-between gap-3"
          style={{ boxShadow: "0 1px 6px rgba(8,15,52,0.06)" }}
          dir="rtl"
        >
          {/* right: icon + count + time */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#F2F5F8" }}>
              <IcoCal/>
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-slate-800 leading-tight text-right">
                {`${todayList.length} جلسة اليوم`}
              </p>
              {todayTimeRange && (
                <p className="text-[11px] text-slate-400 mt-0.5 text-right" dir="ltr">{todayTimeRange}</p>
              )}
            </div>
          </div>

          {/* left: link */}
          <button
            onClick={() => changeTab("today")}
            className="inline-flex items-center gap-1 text-[12px] font-bold hover:underline transition whitespace-nowrap"
            style={{ color: "#024677" }}
          >
            عرض جلسات اليوم <IcoChevL/>
          </button>
        </div>
        )}

        <JoinSessionModal
          joinMsg={joinMsg}
          onClose={() => setJoinMsg(null)}
          onViewRecording={handleViewSession}
        />

        {/* ── tabs ── */}
        <div
          className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none" }}
          dir="rtl"
        >
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => changeTab(t.key)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-[12px] font-bold transition whitespace-nowrap shrink-0"
                style={{
                  background: active ? "#024677" : "#fff",
                  color:      active ? "#fff" : "#64748b",
                  border:     active ? "none" : "1px solid #e2e8f0",
                  boxShadow:  active ? "none" : "0 1px 3px rgba(8,15,52,0.04)",
                }}
              >
                {t.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center inline-flex items-center justify-center gap-0.5"
                  style={{
                    background: active ? "rgba(255,255,255,0.18)" : "#F2F5F8",
                    color:      active ? "#fff" : "#64748b",
                  }}
                >
                  {t.dot && !active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"/>
                  )}
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── content ── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonCard/><SkeletonCard/><SkeletonCard/>
          </div>

        ) : showGroups ? (
          /* ── "all" tab: grouped by section, each group paginated ── */
          (() => {
            // for "all" tab we paginate the full flat list, but still show section labels
            const allFlat = [...todayList, ...upcomingList, ...endedList];
            const totalP  = Math.ceil(allFlat.length / PER_PAGE);
            const paged   = allFlat.slice((page - 1) * PER_PAGE, page * PER_PAGE);

            const todayPaged    = paged.filter(s => s.status === "today");
            const upcomingPaged = paged.filter(s => s.status === "upcoming");
            const endedPaged    = paged.filter(s => s.status === "completed" || s.status === "ended");

            return (
              <div>
                {todayPaged.length > 0 && (
                  <>
                    <SectionLabel type="today" count={todayList.length}/>
                    <div className="flex flex-col gap-3">
                      {todayPaged.map(s => (
                        <SessionCard key={s.id} session={s} onView={handleViewSession} onJoin={handleJoin} joinBusy={joinBusy} selectedId={selectedId} onSelect={handleSelect}/>
                      ))}
                    </div>
                  </>
                )}
                {upcomingPaged.length > 0 && (
                  <>
                    <SectionLabel type="upcoming" count={upcomingList.length}/>
                    <div className="flex flex-col gap-3">
                      {upcomingPaged.map(s => (
                        <SessionCard key={s.id} session={s} onView={handleViewSession} onJoin={handleJoin} joinBusy={joinBusy} selectedId={selectedId} onSelect={handleSelect}/>
                      ))}
                    </div>
                  </>
                )}
                {endedPaged.length > 0 && (
                  <>
                    <SectionLabel type="ended" count={endedList.length}/>
                    <div className="flex flex-col gap-3">
                      {endedPaged.map(s => (
                        <SessionCard key={s.id} session={s} onView={handleViewSession} onJoin={handleJoin} joinBusy={joinBusy} selectedId={selectedId} onSelect={handleSelect}/>
                      ))}
                    </div>
                  </>
                )}
                {allFlat.length === 0 && (
                  <p className="text-center py-16 text-slate-400 text-[13px]">لا توجد جلسات</p>
                )}
                <Pagination current={page} total={totalP} onChange={setPage}/>
              </div>
            );
          })()

        ) : (
          /* ── filtered tabs ── */
          <div>
            <div className="flex flex-col gap-3">
              {pagedList.map(s => (
                <SessionCard key={s.id} session={s} onView={handleViewSession} onJoin={handleJoin} joinBusy={joinBusy} selectedId={selectedId} onSelect={handleSelect}/>
              ))}
              {filtered.length === 0 && (
                <p className="text-center py-16 text-slate-400 text-[13px]">لا توجد جلسات</p>
              )}
            </div>
            <Pagination current={page} total={totalPages} onChange={setPage}/>
          </div>
        )}

      </div>
    </div>
  );
}
