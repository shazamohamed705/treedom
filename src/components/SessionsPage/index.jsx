import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSessions } from "../../services/api";
import { sessionTypeUiKey } from "../../services/sessionType";
import Pagination from "../Pagination";

function parseLocalDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 0, 0, 0, 0);
  const dmy = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const y = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
    if (a > 12) return new Date(y, b - 1, a);
    if (b > 12) return new Date(y, a - 1, b);
    return new Date(y, b - 1, a);
  }
  const dm = s.match(/^(\d{1,2})[/.](\d{1,2})$/);
  if (dm) {
    const now = new Date();
    const a = Number(dm[1]);
    const b = Number(dm[2]);
    const day = a > 12 ? a : a;
    const month = a > 12 ? b : b;
    return new Date(now.getFullYear(), month - 1, day);
  }
  if (/^\d{1,2}:\d{2}/.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseHm(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return [Math.min(23, h), Math.min(59, min)];
}

// ── computeStatus (exported — used by TrainerDashboardPage, TrainerMyRequestsPage) ──
export function computeStatus(session) {
  if (!session) return "upcoming";
  const date      = session.date ?? session.start_date ?? session.scheduled_date ?? session.session_date;
  const starts_at = session.starts_at ?? session.timeFrom ?? session.start_time;
  const ends_at   = session.ends_at ?? session.timeTo ?? session.end_time;
  const apiEnded  = session.status === "ended" || session.status === "completed" || session.status === "انتهت";

  const base = parseLocalDate(date) || parseLocalDate(starts_at);
  if (base) {
    const [sh, sm] = parseHm(starts_at) || [0, 0];
    const [eh, em] = parseHm(ends_at) || [23, 59];
    const start = new Date(base);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(base);
    end.setHours(eh, em, 59, 0);
    if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
    const now = new Date();
    if (now >= start && now <= end) return "live";
    if (now > end) return "ended";
    return "upcoming";
  }

  if (apiEnded) return "ended";
  return "upcoming";
}

const STARTED_KEY = "coachStartedSessionIds";

export function markCoachSessionStarted(id) {
  if (id == null) return;
  try {
    const ids = JSON.parse(sessionStorage.getItem(STARTED_KEY) || "[]");
    const key = String(id);
    if (!ids.includes(key)) {
      ids.push(key);
      sessionStorage.setItem(STARTED_KEY, JSON.stringify(ids));
    }
  } catch { /* ignore */ }
}

export function sessionAlreadyStarted(s) {
  if (!s) return false;
  try {
    if (JSON.parse(sessionStorage.getItem(STARTED_KEY) || "[]").includes(String(s.id))) return true;
  } catch { /* ignore */ }
  // API still allows start → keep the button open (is_live / جارية الآن is not a start)
  if (s.can_start === true || s.canStart === true) return false;
  // a real start timestamp only
  if (s.actual_started_at || s.timing?.actual_started_at) return true;
  return false;
}

// ── normalise raw API session ─────────────────────────────────────────────────
function sessionStartMs(s) {
  try {
    const base = new Date(s.date || Date.now());
    const [h, m] = String(s.starts_at || s.timeFrom || "00:00").split(":").map(Number);
    base.setHours(h || 0, m || 0, 0, 0);
    return base.getTime();
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function collectFromResponse(res) {
  const d = res?.data ?? res ?? {};
  const coming = Array.isArray(d.coming_sessions) ? d.coming_sessions : [];
  const paged  = d.all_sessions?.data ?? (Array.isArray(d.all_sessions) ? d.all_sessions : []);
  const lastPage = Number(d.all_sessions?.meta?.last_page ?? d.all_sessions?.last_page ?? 1) || 1;
  return { coming, paged, lastPage };
}

function textOf(v) {
  if (v == null) return "";
  if (typeof v === "object") return String(v.ar ?? v.en ?? v.name ?? v.title ?? "");
  return String(v);
}

function matchesQuery(s, q) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return [s.title, s.program, s.trainer, s.date, s.timeFrom, s.timeTo, s.venue, s.type]
    .some(v => textOf(v).toLowerCase().includes(n));
}

function mergeUpcomingRaw(pools) {
  const seen = new Set();
  const out = [];
  pools.flat().forEach(s => {
    if (!s?.id || seen.has(s.id)) return;
    const st = computeStatus(s);
    if (st !== "live" && st !== "upcoming") return;
    seen.add(s.id);
    out.push(s);
  });
  out.sort((a, b) => sessionStartMs(a) - sessionStartMs(b));
  return out;
}

function normalise(s) {
  return {
    id:           s.id,
    title:        s.title,
    program:      s.program_name  ?? (typeof s.program === "object" ? s.program?.name : s.program) ?? "—",
    trainer:      s.coach_name    ?? (typeof s.coach === "object" ? s.coach?.name : s.coach) ?? "—",
    date:         s.date,
    timeFrom:     s.starts_at,
    timeTo:       s.ends_at,
    trainees:     s.trainees_count ?? 0,
    type:         s.type,
    status:       computeStatus(s),
    venue:        s.location       ?? null,
    hasRecording: !!s.video_url,
    meetingUrl:   s.meeting_url    ?? null,
    canStart:     s.can_start,
    isLive:       s.is_live,
    coachId:      s.coach_id       ?? null,
    programId:    s.program_id     ?? null,
  };
}

// ── icons ─────────────────────────────────────────────────────────────────────
const I = ({ d, size = 14, stroke = "currentColor", sw = 2, fill = "none", cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>{d}</svg>
);

const IcoGrad    = () => <I size={18} stroke="#14b8a6" d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>}/>;
const IcoSearch  = () => <I d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoSort    = () => <I d={<path d="M8 6h13M8 12h9M8 18h5"/>}/>;
const IcoFilter  = () => <I d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>}/>;
const IcoCal     = () => <I d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcoClock   = () => <I d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const IcoUsers   = () => <I d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const IcoCheck   = () => <I stroke="#14b8a6" d={<polyline points="20 6 9 17 4 12"/>}/>;
const IcoVideo   = () => <I d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}/>;
const IcoPin     = () => <I d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;
const IcoEdit    = () => <I d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>;
const IcoPlay    = () => <I fill="#14b8a6" stroke="#14b8a6" d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const IcoPlayCircle = () => <I size={20} stroke="#047857" d={<><circle cx="12" cy="12" r="9"/><polygon points="10 8.5 15.5 12 10 15.5 10 8.5"/></>}/>;
const IcoChart   = () => <I d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}/>;
const IcoPlus    = () => <I sw={2.5} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>;
const IcoClose   = () => <I size={13} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const IcoSpinner = () => (
  <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24"
    fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const TYPE_MAP = {
  interactive: { label: "جلسات تفاعلية",   bg: "#ede9fe", color: "#7c3aed" },
  offline:     { label: "حضوري",            bg: "#f1f5f9", color: "#64748b" },
  recorded:    { label: "مسجلة",            bg: "#f0fdf4", color: "#16a34a" },
  online:      { label: "أونلاين",          bg: "#ede9fe", color: "#7c3aed" },
};

const UP_SORTS = [
  { key: "soonest", label: "الأقرب أولاً" },
  { key: "latest",  label: "الأبعد أولاً" },
  { key: "live",    label: "الجارية أولاً" },
  { key: "name",    label: "حسب الاسم" },
  { key: "program", label: "حسب البرنامج" },
  { key: "trainer", label: "حسب المدرب" },
];

const UP_FILTERS = [
  { key: "all",         label: "الكل" },
  { key: "live",        label: "جارية الآن" },
  { key: "upcoming",    label: "قادمة" },
  { key: "interactive", label: "أونلاين" },
  { key: "offline",     label: "حضوري" },
  { key: "recorded",    label: "مسجل" },
];

function sessionMode(s) {
  return sessionTypeUiKey(s?.type ?? s?.delivery_mode);
}

function applyUpcomingFilter(list, filter) {
  if (filter === "all") return list;
  if (filter === "live" || filter === "upcoming") return list.filter(s => s.status === filter);
  return list.filter(s => {
    const m = sessionMode(s);
    return m === filter || (filter === "interactive" && (m === "online" || m === "interactive"));
  });
}

function applyUpcomingSort(list, sort) {
  const copy = [...list];
  const byText = (a, b, pick) => textOf(pick(a)).localeCompare(textOf(pick(b)), "ar");
  if (sort === "latest")  return copy.sort((a, b) => sessionStartMs(b) - sessionStartMs(a));
  if (sort === "name")    return copy.sort((a, b) => byText(a, b, s => s.title));
  if (sort === "program") return copy.sort((a, b) => byText(a, b, s => s.program));
  if (sort === "trainer") return copy.sort((a, b) => byText(a, b, s => s.trainer));
  if (sort === "live")    return copy.sort((a, b) => Number(b.status === "live") - Number(a.status === "live") || sessionStartMs(a) - sessionStartMs(b));
  return copy.sort((a, b) => Number(b.status === "live") - Number(a.status === "live") || sessionStartMs(a) - sessionStartMs(b));
}

function MenuDrop({ open, onClose, align = "left", children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = e => { if (!ref.current?.contains(e.target)) onClose?.(); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref}
      className={`absolute top-full mt-1.5 z-40 min-w-[170px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 ${align === "left" ? "left-0" : "right-0"}`}
      dir="rtl">
      {children}
    </div>
  );
}

function TypeBadge({ type }) {
  const key = sessionTypeUiKey(type);
  const t = TYPE_MAP[key] || TYPE_MAP.interactive;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
      style={{ background: t.bg, color: t.color }}>
      <IcoVideo />{t.label}
    </span>
  );
}

// ── Upcoming card (horizontal scroll strip) ───────────────────────────────────
function UpcomingCard({ session: s, onView, onEdit }) {
  const isLive = computeStatus({
    date: s.date,
    starts_at: s.timeFrom ?? s.starts_at,
    ends_at: s.timeTo ?? s.ends_at,
  }) === "live";
  return (
    <div className="bg-[#02467705] rounded-lg shrink-0 w-[280px] sm:w-[320px] min-h-[185px] flex flex-col p-5 gap-2" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "#024677" }}>{s.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{s.program}</p>
        </div>
        <TypeBadge type={s.type} />
      </div>

      {isLive ? (
        <p className="flex items-center gap-1 text-[11px] font-bold text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>جارية الآن
        </p>
      ) : (
        <p className="text-[11px] font-semibold" style={{ color: "#14b8a6" }}>• قادمة</p>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoCal /></span>{s.date}</span>
        <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoClock /></span>{s.timeFrom}{s.timeTo ? ` - ${s.timeTo}` : ""}</span>
        {s.venue && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoPin /></span>{s.venue}</span>}
        {s.trainees > 0 && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoUsers /></span>{s.trainees} متدرب</span>}
      </div>

      <div className="mt-auto pt-1 flex items-center gap-2">
        {onEdit && (
          <button onClick={() => onEdit?.(s)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#024677] px-4 h-[32px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
            <IcoEdit />تعديل
          </button>
        )}
        {isLive ? (
          <button onClick={() => onView?.(s)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 h-[32px] rounded-lg"
            style={{ background: "#14b8a6" }}>
            <IcoPlay />الدخول إلى الجلسة
          </button>
        ) : (
          <button onClick={() => onView?.(s)}
            className="text-xs font-bold text-[#024677] px-4 h-[32px] rounded-lg hover:opacity-90 transition"
            style={{ background: "#5AEACF" }}>
            عرض
          </button>
        )}
      </div>
    </div>
  );
}

// ── Session row (list) ────────────────────────────────────────────────────────
function SessionRow({ session: s, onView, onEdit, onAddContent }) {
  const isLive  = s.status === "live";
  const isEnded = s.status === "ended";
  const key = sessionTypeUiKey(s.type);
  const typeInfo = TYPE_MAP[key] || TYPE_MAP.interactive;

  return (
    <div className={`rounded-lg border p-3 space-y-1.5 w-full ${isLive ? "border-teal-300" : "border-slate-200"}`}
      style={{ background: "#F2F5F8" }} dir="rtl">

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800 truncate">{s.title}</p>
              <span className="text-[11px] font-bold shrink-0" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{s.program}</p>
          </div>
        </div>
        <span className="text-[11px] font-bold shrink-0"
          style={{ color: isLive ? "#16a34a" : isEnded ? "#64748b" : "#2563eb" }}>
          {isLive ? "جارية الآن" : isEnded ? "انتهت" : "قادمة"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-700 flex-wrap">
          {s.date     && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoCal /></span>{s.date}</span>}
          {s.timeFrom && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoClock /></span>{s.timeFrom}</span>}
          {s.trainees > 0 && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoUsers /></span>{s.trainees} متدرب</span>}
          {s.venue    && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoPin /></span>{s.venue}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEnded ? (
            <button onClick={() => onView?.(s)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#024677] px-4 h-[32px] rounded-lg hover:opacity-90 transition"
              style={{ background: "#5AEACF" }}>
              <IcoChart />عرض التحليل
            </button>
          ) : (
            <button onClick={() => onView?.(s)}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-4 h-[32px] rounded-lg"
              style={{ background: "#14b8a6" }}>
              <IcoPlay />{isLive ? "الدخول إلى الجلسة" : "عرض"}
            </button>
          )}
          {/* زرار إضافة محتوى — يظهر فقط لو انتهت الجلسة ومفيهاش تسجيل */}
          {isEnded && !s.hasRecording && onAddContent && (
            <button onClick={() => onAddContent(s)}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-4 h-[32px] rounded-lg hover:opacity-90 transition"
              style={{ background: "#024677" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              إضافة محتوى
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit?.(s)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#024677] px-4 h-[32px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
              <IcoEdit />تعديل الجلسة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function SessionsPage({ onViewSession, onEditSession, onAddContent }) {
  const navigate = useNavigate();

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter,   setModeFilter]   = useState("all");
  const [allSessions,  setAllSessions]  = useState([]);
  const [upcoming,     setUpcoming]     = useState([]);
  const [tabs,         setTabs]         = useState({});
  const [loading,      setLoading]      = useState(true);
  const [searching,    setSearching]    = useState(false);
  const [page,         setPage]         = useState(1);
  const [lastPage,     setLastPage]     = useState(1);
  const [upSort,       setUpSort]       = useState("soonest");
  const [upFilter,     setUpFilter]     = useState("all");
  const [upMenu,       setUpMenu]       = useState(null);

  // ── upcoming carousel ──────────────────────────────────────────────────────
  const CHUNK_SIZE   = 3;
  const [offset,  setOffset]  = useState(0);
  const [fading,  setFading]  = useState(false);
  const [paused,  setPaused]  = useState(false);
  const sessionKey = upcoming.map(s => s.id).join(",");
  const canSlide   = upcoming.length > CHUNK_SIZE; // rotation uses full upcoming list

  useEffect(() => { setOffset(0); setFading(false); }, [sessionKey, upSort, upFilter]);

  useEffect(() => {
    if (!canSlide) return;
    let outT;
    const id = setInterval(() => {
      if (paused) return;
      setFading(true);
      outT = setTimeout(() => {
        setOffset(i => (i + 1) % upcoming.length);
        setFading(false);
      }, 350);
    }, 3500);
    return () => { clearInterval(id); if (outT) clearTimeout(outT); };
  }, [canSlide, upcoming.length, paused, sessionKey]);

  const loadList = useCallback(async (status, mode, q, p, silent = false) => {
    if (!silent) setLoading(true);
    else setSearching(true);
    try {
      const res = await fetchSessions({
        status:        status === "all" ? undefined : status,
        delivery_mode: mode   === "all" ? undefined : mode,
        search:        q || undefined,
        page:          p,
      });
      const data = res?.data ?? {};
      setTabs(data.tabs ?? {});
      setAllSessions((data.all_sessions?.data ?? []).map(normalise));
      setLastPage(data.all_sessions?.meta?.last_page ?? data.all_sessions?.last_page ?? 1);
    } catch { /* noop */ }
    finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  const loadUpcoming = useCallback(async (mode) => {
    try {
      const [base, scheduledRes, runningRes] = await Promise.all([
        fetchSessions({
          delivery_mode: mode === "all" ? undefined : mode,
          page: 1,
        }).catch(() => null),
        fetchSessions({
          status: "scheduled",
          page: 1,
          delivery_mode: mode === "all" ? undefined : mode,
        }).catch(() => null),
        fetchSessions({
          status: "running",
          page: 1,
          delivery_mode: mode === "all" ? undefined : mode,
        }).catch(() => null),
      ]);
      const first = collectFromResponse(base);
      const sched = collectFromResponse(scheduledRes);
      const extraPages = [];
      for (let pg = 2; pg <= Math.min(sched.lastPage, 5); pg++) extraPages.push(pg);
      const rest = extraPages.length
        ? await Promise.all(extraPages.map(pg => fetchSessions({
            status: "scheduled",
            page: pg,
            delivery_mode: mode === "all" ? undefined : mode,
          }).catch(() => null)))
        : [];
      const pool = [
        ...first.coming, ...first.paged,
        ...sched.coming, ...sched.paged,
        ...collectFromResponse(runningRes).coming,
        ...collectFromResponse(runningRes).paged,
        ...rest.flatMap(r => {
          const next = collectFromResponse(r);
          return [...next.coming, ...next.paged];
        }),
      ];
      setUpcoming(mergeUpcomingRaw(pool).map(normalise));
    } catch { /* noop */ }
  }, []);

  useEffect(() => { loadUpcoming(modeFilter); }, [modeFilter]); // eslint-disable-line

  useEffect(() => {
    const q = search.trim();
    const t = setTimeout(() => {
      setPage(1);
      loadList(statusFilter, modeFilter, q, 1, Boolean(q));
    }, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [statusFilter, modeFilter, search]); // eslint-disable-line

  // live-status polling every 60s
  useEffect(() => {
    const tick = () => {
      const refresh = (list) => list.map(s => {
        const newStatus = computeStatus({
          date: s.date, starts_at: s.timeFrom, ends_at: s.timeTo,
        });
        return newStatus === s.status ? s : { ...s, status: newStatus };
      });
      setAllSessions(refresh);
      setUpcoming(refresh);
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const liveCount     = upcoming.filter(s => s.status === "live").length;
  const upcomingCount = upcoming.filter(s => s.status === "upcoming").length;
  const endedCount    = tabs.ended?.count ?? allSessions.filter(s => s.status === "ended").length;
  const tabList       = Object.values(tabs);

  const STATUS_TABS = [
    { key: "all",       label: "الكل",       count: allSessions.length },
    { key: "running",   label: "جارية الآن", count: liveCount          },
    { key: "scheduled", label: "قادمة",      count: upcomingCount      },
    { key: "ended",     label: "انتهت",      count: endedCount         },
  ];

  const MODE_TABS = [
    { key: "all",         label: "الكل"    },
    { key: "interactive", label: "أونلاين" },
    { key: "offline",     label: "حضوري"   },
    { key: "recorded",    label: "مسجل"    },
  ];

  const query = search.trim();
  const visibleUpcoming = applyUpcomingSort(
    applyUpcomingFilter(query ? upcoming.filter(s => matchesQuery(s, query)) : upcoming, upFilter),
    upSort
  );
  const visibleSessions = query ? allSessions.filter(s => matchesQuery(s, query)) : allSessions;
  const upcomingChunk = Array.from({ length: Math.min(CHUNK_SIZE, visibleUpcoming.length) }, (_, i) =>
    visibleUpcoming[(offset + i) % visibleUpcoming.length]
  );

  return (
    <main className="flex-1 overflow-y-auto bg-white px-4 sm:px-5 py-4 space-y-5" dir="rtl">

      {/* ── header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap w-full max-w-[1020px] mx-auto">
        <div className="flex items-center gap-2">
          <IcoGrad />
          <h1 className="text-xl font-bold" style={{ color: "#024677" }}>إدارة الجلسات</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-64 sm:w-80">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IcoSearch /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const q = search.trim();
                setPage(1);
                loadList(statusFilter, modeFilter, q, 1, Boolean(q));
              }}
              placeholder="ابحث بالاسم أو البرنامج أو المدرب..."
              className="w-full pr-9 pl-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400"
            />
            {searching && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
              </span>
            )}
            {search && !searching && (
              <button type="button" onClick={() => setSearch("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                aria-label="مسح البحث">
                <IcoClose />
              </button>
            )}
          </div>
          <button onClick={() => navigate("/dashboard/add-session")}
            className="flex items-center gap-1.5 text-white text-xs font-bold h-[36px] px-4 rounded-xl transition hover:opacity-90"
            style={{ background: "#024677" }}>
            <IcoPlus /> إضافة جلسة جديدة
          </button>
        </div>
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-[1020px] mx-auto">
        <div className="rounded-[20px] flex items-center justify-between w-full min-h-[120px] p-5"
          style={{ border: "1.34px solid #047857" }}>
          <div className="text-right relative">
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>
            <p className="text-5xl font-bold" style={{ color: "#024677" }}>{liveCount}</p>
            <p className="text-xs text-teal-500 font-semibold mt-1.5">جارية الآن</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#04785714" }}>
            <IcoPlayCircle />
          </div>
        </div>
        <div className="rounded-[20px] flex items-center justify-between w-full min-h-[120px] p-5"
          style={{ border: "1.34px solid #e2e8f0" }}>
          <div className="text-right">
            <p className="text-5xl font-bold" style={{ color: "#024677" }}>{upcomingCount}</p>
            <p className="text-xs text-slate-400 mt-1.5">قادمة</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0246770D" }}>
            <IcoCal />
          </div>
        </div>
        <div className="rounded-[20px] flex items-center justify-between w-full min-h-[120px] p-5"
          style={{ border: "1.34px solid #e2e8f0" }}>
          <div className="text-right">
            <p className="text-5xl font-bold" style={{ color: "#024677" }}>{endedCount}</p>
            <p className="text-xs text-slate-400 mt-1.5">انتهت</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0246770D" }}>
            <IcoCheck />
          </div>
        </div>
      </div>

      {/* ── upcoming strip ── */}
      <div className="rounded-lg p-3 w-full max-w-[1020px] mx-auto" style={{ border: "1px solid #E6EDF2" }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IcoCal />
            <h2 className="text-base font-bold" style={{ color: "#024677" }}>الجلسات القادمة</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button type="button" onClick={() => setUpMenu(m => m === "sort" ? null : "sort")}
                className={`flex items-center gap-1 text-xs border rounded-xl px-3 py-1.5 transition
                  ${upMenu === "sort" || upSort !== "soonest"
                    ? "text-[#024677] border-[#024677] bg-[#0246770D]"
                    : "text-slate-500 border-slate-200 bg-white hover:bg-slate-50"}`}>
                <IcoSort />ترتيب
              </button>
              <MenuDrop open={upMenu === "sort"} onClose={() => setUpMenu(null)}>
                {UP_SORTS.map(o => (
                  <button key={o.key} type="button"
                    onClick={() => { setUpSort(o.key); setUpMenu(null); setOffset(0); }}
                    className={`w-full text-right px-3 py-2 text-xs transition
                      ${upSort === o.key ? "bg-[#0246770D] text-[#024677] font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
                    {o.label}
                  </button>
                ))}
              </MenuDrop>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setUpMenu(m => m === "filter" ? null : "filter")}
                className={`flex items-center gap-1 text-xs border rounded-xl px-3 py-1.5 transition
                  ${upMenu === "filter" || upFilter !== "all"
                    ? "text-[#024677] border-[#024677] bg-[#0246770D]"
                    : "text-slate-500 border-slate-200 bg-white hover:bg-slate-50"}`}>
                <IcoFilter />فلترة
              </button>
              <MenuDrop open={upMenu === "filter"} onClose={() => setUpMenu(null)}>
                {UP_FILTERS.map(o => (
                  <button key={o.key} type="button"
                    onClick={() => { setUpFilter(o.key); setUpMenu(null); setOffset(0); }}
                    className={`w-full text-right px-3 py-2 text-xs transition
                      ${upFilter === o.key ? "bg-[#0246770D] text-[#024677] font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
                    {o.label}
                  </button>
                ))}
              </MenuDrop>
            </div>
          </div>
        </div>

        {/* carousel */}
        <div
          className="flex gap-2 pb-1 transition-opacity duration-500"
          style={{ opacity: fading ? 0 : 1, minHeight: 185 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}>
          {upcomingChunk.map((s, i) => (
            <UpcomingCard key={s.id ?? `${offset}-${i}`} session={s}
              onView={() => onViewSession?.(s)}
              onEdit={() => onEditSession?.(s)} />
          ))}
          {visibleUpcoming.length === 0 && !loading && (
            <p className="text-xs text-slate-400 py-4 w-full text-center">
              {query ? `لا توجد جلسات قادمة مطابقة لـ "${query}"` : "لا توجد جلسات قادمة"}
            </p>
          )}
        </div>
      </div>

      {/* ── status tabs + mode filter + list ── */}
      <div className="w-full max-w-[1020px] mx-auto space-y-4">

        {/* status tabs */}
        <div className="flex w-fit border border-slate-200 rounded-xl overflow-hidden divide-x divide-x-reverse divide-slate-200">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={statusFilter === t.key
                ? { background: "#14b8a6", color: "#fff" }
                : { background: "#fff", color: "#475569" }}>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={statusFilter === t.key
                  ? { background: "rgba(255,255,255,.25)", color: "#fff" }
                  : { background: "#f1f5f9", color: "#64748b" }}>
                {t.count}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* mode tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {MODE_TABS.map(m => (
            <button key={m.key} onClick={() => setModeFilter(m.key)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={modeFilter === m.key
                ? { background: "#024677", color: "#fff", borderColor: "#024677" }
                : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}>
              {m.label}
            </button>
          ))}
        </div>

        {query && !loading && (
          <p className="text-xs text-slate-500">
            {visibleSessions.length > 0
              ? `${visibleSessions.length} نتيجة لـ "${query}"`
              : `لا توجد نتائج لـ "${query}"`}
          </p>
        )}

        {/* list */}
        <div className="space-y-3">
          {loading && <div className="flex justify-center py-10"><IcoSpinner /></div>}
          {!loading && visibleSessions.map(s => (
            <SessionRow key={s.id} session={s}
              onView={() => onViewSession?.(s)}
              onAddContent={onAddContent ? () => onAddContent(s) : undefined}
              onEdit={() => onEditSession?.(s)} />
          ))}
          {!loading && visibleSessions.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              {query ? `لا توجد جلسات مطابقة لـ "${query}"` : "لا توجد جلسات"}
            </div>
          )}
        </div>

        {/* pagination */}
        {lastPage > 1 && (
          <Pagination
            page={page}
            totalPages={lastPage}
            onChange={p => { setPage(p); loadList(statusFilter, modeFilter, query, p, true); }} />
        )}
      </div>
    </main>
  );
}
