import { useState, useEffect, useCallback, useRef } from "react";
import { fetchCoachSessions } from "../../services/api";
import { hasPermission } from "../../services/auth";
import { sessionTypeUiKey } from "../../services/sessionType";
import Pagination from "../shared/Pagination";
import { computeStatus } from "../org/SessionsPage";
import useReloadOnFocus from "../../hooks/useReloadOnFocus";

function resolveStatus(s) {
  const st = computeStatus(s);
  return st === "upcoming" ? "scheduled" : st;
}

// Sort: live → scheduled (by date/time) → ended
function sortSessions(list) {
  const order = { live: 0, scheduled: 1, ended: 2 };
  return [...list].sort((a, b) => {
    const sa = resolveStatus(a);
    const sb = resolveStatus(b);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    // same bucket → sort by date+time ascending
    const da = new Date((a.date || "9999-01-01") + "T" + (a.starts_at || "00:00").replace(/[ap]m/i, "").trim());
    const db = new Date((b.date || "9999-01-01") + "T" + (b.starts_at || "00:00").replace(/[ap]m/i, "").trim());
    return da - db;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const I = ({ d, size = 14, stroke = "currentColor", sw = 2, fill = "none", cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>{d}</svg>
);
const IcoGrad    = () => <I size={18} stroke="#14b8a6" d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>}/>;
const IcoSearch  = () => <I d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoClose   = () => <I d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const IcoPlus    = () => <I d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>;
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
const IcoSpinner    = () => <I cls="animate-spin" size={28} stroke="#024677" d={<path d="M12 2a10 10 0 0 1 10 10"/>}/>;

// ─────────────────────────────────────────────────────────────────────────────
// Status mapping (from API)
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: "all",      label: "الكل"      },
  { key: "live",     label: "جارية الآن" },
  { key: "scheduled",label: "قادمة"     },
  { key: "ended",    label: "انتهت"     },
];

const MODE_TABS = [
  { key: "all",      label: "الكل"    },
  { key: "online",   label: "أونلاين" },
  { key: "offline",  label: "حضوري"   },
  { key: "recorded", label: "مسجل"    },
];

const UP_SORTS = [
  { key: "soonest", label: "الأقرب أولاً" },
  { key: "latest",  label: "الأبعد أولاً" },
  { key: "live",    label: "الجارية أولاً" },
  { key: "name",    label: "حسب الاسم" },
  { key: "program", label: "حسب البرنامج" },
];

const UP_FILTERS = [
  { key: "all",      label: "الكل" },
  { key: "live",     label: "جارية الآن" },
  { key: "upcoming", label: "قادمة" },
  { key: "online",   label: "أونلاين" },
  { key: "offline",  label: "حضوري" },
  { key: "recorded", label: "مسجل" },
];

function textOf(v) {
  if (v == null) return "";
  if (typeof v === "object") return String(v.ar ?? v.en ?? v.name ?? v.title ?? v.text ?? "");
  return String(v);
}

function matchesSessionQuery(s, q) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return [
    s.title, s.program_name, s.program?.name, s.date, s.starts_at, s.ends_at,
    s.location, s.type?.text, s.type?.delivery_mode, s.status_label,
  ].some(v => textOf(v).toLowerCase().includes(n));
}

function trainerSessionMode(s) {
  return sessionTypeUiKey(s?.type ?? s?.delivery_mode);
}

function modeMatches(s, key) {
  if (key === "all") return true;
  const m = trainerSessionMode(s);
  if (key === "online") return m === "online" || m === "interactive" || m === "zoom";
  return m === key;
}

function comingStartMs(s) {
  try {
    const d = new Date(`${s.date || "9999-01-01"}T00:00:00`);
    const m = String(s.starts_at || "00:00").match(/(\d{1,2}):(\d{2})/);
    if (m) d.setHours(Number(m[1]) % 24, Number(m[2]), 0, 0);
    return d.getTime();
  } catch { return Number.MAX_SAFE_INTEGER; }
}

function applyComingFilter(list, filter) {
  if (filter === "all") return list;
  if (filter === "live") return list.filter(s => resolveStatus(s) === "live");
  if (filter === "upcoming") return list.filter(s => resolveStatus(s) === "scheduled");
  return list.filter(s => modeMatches(s, filter));
}

function applyComingSort(list, sort) {
  const copy = [...list];
  if (sort === "latest") return copy.sort((a, b) => comingStartMs(b) - comingStartMs(a));
  if (sort === "name") return copy.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "ar"));
  if (sort === "program") return copy.sort((a, b) => String(a.program_name || "").localeCompare(String(b.program_name || ""), "ar"));
  if (sort === "live") {
    return copy.sort((a, b) =>
      Number(resolveStatus(b) === "live") - Number(resolveStatus(a) === "live") || comingStartMs(a) - comingStartMs(b)
    );
  }
  return copy.sort((a, b) =>
    Number(resolveStatus(b) === "live") - Number(resolveStatus(a) === "live") || comingStartMs(a) - comingStartMs(b)
  );
}

function MenuDrop({ open, onClose, children }) {
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
      className="absolute top-full mt-1.5 z-40 min-w-[170px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 left-0"
      dir="rtl">
      {children}
    </div>
  );
}

const TYPE_MAP = {
  offline:  { label: "حضوري",  bg: "#f1f5f9", color: "#64748b" },
  online:   { label: "أونلاين", bg: "#ede9fe", color: "#7c3aed" },
  recorded: { label: "مسجل",   bg: "#f0fdf4", color: "#16a34a" },
  live:     { label: "جارية الآن", bg: "#f0fdf4", color: "#16a34a" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Type badge
// ─────────────────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const key = sessionTypeUiKey(type);
  const t = TYPE_MAP[key] || TYPE_MAP.online;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
      style={{ background: t.bg, color: t.color }}>
      <IcoVideo />{type?.text ?? t.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming card (horizontal scroll)
// ─────────────────────────────────────────────────────────────────────────────
function UpcomingCard({ session, onView, onEdit }) {
  const s = session;
  const isLive = resolveStatus(s) === "live";
  const rawSL = typeof s.status_label === "object" ? (s.status_label?.text ?? s.status_label?.value ?? "") : (s.status_label ?? "");
  return (
    <div className="bg-[#02467705] rounded-lg shrink-0 w-[280px] sm:w-[320px] min-h-[185px] flex flex-col p-5 gap-2" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "#024677" }}>{s.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{s.program_name}</p>
        </div>
        <TypeBadge type={s.type} />
      </div>

      {isLive ? (
        <p className="flex items-center gap-1 text-[11px] font-bold text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>جارية الآن
        </p>
      ) : (
        <p className="text-[11px] font-semibold" style={{ color: "#14b8a6" }}>• {rawSL || "قادمة"}</p>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoCal /></span>{s.date}</span>
        <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoClock /></span>{s.starts_at}</span>
        {s.location && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoPin /></span>{s.location}</span>}
        <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoUsers /></span>{s.trainees_count ?? 0} متدرب</span>
      </div>

      <div className="mt-auto pt-1 flex items-center gap-2">
        {hasPermission("sessions.update") && (
          <button onClick={() => onEdit?.(s)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#024677] px-4 h-[32px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
            <IcoEdit />تعديل
          </button>
        )}
        {isLive && (
          <button onClick={() => onView?.(s)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 h-[32px] rounded-lg"
            style={{ background: "#14b8a6" }}>
            <IcoPlay />الدخول إلى الجلسة
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session row (list)
// ─────────────────────────────────────────────────────────────────────────────
function SessionRow({ session, onView, onEdit }) {
  const s = session;
  const rawStatusLabel = typeof s.status_label === "object" ? (s.status_label?.text ?? s.status_label?.value ?? "") : (s.status_label ?? "");
  const st      = resolveStatus(s);
  const isLive  = st === "live";
  const isEnded = st === "ended";
  const typeInfo = TYPE_MAP[sessionTypeUiKey(s.type ?? s.delivery_mode)] || TYPE_MAP.online;
  const statusLabel = isLive ? "جارية الآن" : isEnded ? "انتهت" : (rawStatusLabel || "قادمة");

  return (
    <div className={`rounded-lg border p-3 space-y-1.5 w-full ${isLive ? "border-teal-300" : "border-slate-200"}`}
      style={{ background: "#F2F5F8" }} dir="rtl">

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800 truncate">{s.title}</p>
              <span className="text-[11px] font-bold shrink-0" style={{ color: typeInfo.color }}>{s.type?.text ?? typeInfo.label}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{s.program_name}</p>
          </div>
        </div>
        <span className="text-[11px] font-bold"
          style={{ color: isLive ? "#16a34a" : isEnded ? "#64748b" : "#2563eb" }}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-700 flex-wrap">
          <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoCal /></span>{s.date}</span>
          <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoClock /></span>{s.starts_at}</span>
          <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoUsers /></span>{s.trainees_count ?? 0} متدرب</span>
          {s.location && <span className="flex items-center gap-1"><span className="text-[#5AEACF] flex items-center"><IcoPin /></span>{s.location}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onView?.(s)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 h-[32px] rounded-lg"
            style={{ background: isLive ? "#14b8a6" : "#5AEACF" }}>
            {isLive ? <><IcoPlay />الدخول إلى الجلسة</> : "عرض"}
          </button>
          {hasPermission("sessions.update") && (
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

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function TrainerSessionsPage({ onViewSession, onEditSession, onAddSession }) {
  const [search,   setSearch]   = useState("");
  const [tab,      setTab]      = useState("all");
  const [mode,     setMode]     = useState("all");
  const [coming,   setComing]   = useState([]);
  const [all,      setAll]      = useState([]);
  const [page,     setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [upSort,   setUpSort]   = useState("soonest");
  const [upFilter, setUpFilter] = useState("all");
  const [upMenu,   setUpMenu]   = useState(null);

  // ── upcoming carousel (groups of 3, auto-rotate) ──
  const CHUNK_SIZE = 3;
  const [chunkIdx, setChunkIdx] = useState(0);
  const [fading,   setFading]   = useState(false);
  const [paused,   setPaused]   = useState(false);
  const query = search.trim();
  const visibleComing = applyComingSort(
    applyComingFilter(query ? coming.filter(s => matchesSessionQuery(s, query)) : coming, upFilter),
    upSort
  );
  const chunkCount = Math.max(1, Math.ceil(visibleComing.length / CHUNK_SIZE));

  useEffect(() => { setChunkIdx(0); }, [upSort, upFilter, query]);

  useEffect(() => {
    if (chunkCount <= 1) return;
    let outT;
    const id = setInterval(() => {
      if (paused) return;
      setFading(true);
      outT = setTimeout(() => {
        setChunkIdx(i => (i + 1) % chunkCount);
        setFading(false);
      }, 450);
    }, 4200);
    return () => { clearInterval(id); if (outT) clearTimeout(outT); };
  }, [chunkCount, paused, upSort, upFilter]);

  const safeIdx   = Math.min(chunkIdx, chunkCount - 1);
  const upcomingChunk = visibleComing.slice(safeIdx * CHUNK_SIZE, safeIdx * CHUNK_SIZE + CHUNK_SIZE);

  // silent = true → don't show spinner (background refresh)
  const load = useCallback((p, extra = {}, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    fetchCoachSessions({ status: "all", page: p, ...extra })
      .then(res => {
        const data = res?.data ?? res;
        // coming_sessions: sort live first, then upcoming by time
        const rawComing = data.coming_sessions ?? [];
        setComing(sortSessions(rawComing));
        const a = data.all_sessions ?? {};
        const rawAll = a.data ?? [];
        // Re-evaluate each session's status locally (handles time-based transitions)
        const enriched = rawAll.map(s => ({
          ...s,
          _resolved_status: resolveStatus(s),
        }));
        setAll(sortSessions(enriched));
        setLastPage(a.meta?.last_page ?? 1);
        if (!silent) setChunkIdx(0);
      })
      .catch(err => { if (!silent) setError(err.message ?? "حدث خطأ أثناء تحميل الجلسات"); })
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  // background auto-refresh every 30 seconds
  const searchRef = useRef(search);
  const pageRef   = useRef(page);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { pageRef.current = page; }, [page]);

  useEffect(() => {
    const id = setInterval(() => {
      const extra = searchRef.current.trim() ? { search: searchRef.current.trim() } : {};
      load(pageRef.current, extra, true /* silent */);
    }, 30_000);
    return () => clearInterval(id);
  }, [load]);

  useReloadOnFocus(() => {
    const extra = searchRef.current.trim() ? { search: searchRef.current.trim() } : {};
    load(pageRef.current, extra, true);
  });

  const liveCnt     = all.filter(s => resolveStatus(s) === "live").length;
  const upcomingCnt = coming.length;
  const endedCnt    = all.filter(s => resolveStatus(s) === "ended").length;

  const filtered = all.filter(s => {
    const st = resolveStatus(s);
    const matchTab  = tab  === "all" || st === tab;
    const matchMode = modeMatches(s, mode);
    const matchSearch = matchesSessionQuery(s, search);
    return matchTab && matchMode && matchSearch;
  });

  const reload = () => { setError(null); load(page); };

  // track last refresh time
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  // bump it after each silent refresh too
  useEffect(() => { setLastRefresh(Date.now()); }, [all]);

  return (
    <main className="flex-1 overflow-y-auto bg-white px-4 sm:px-5 py-4 space-y-5" dir="rtl">

      {/* header */}
      <div className="flex items-center justify-between gap-3 flex-wrap w-full max-w-[1020px] mx-auto">
        <div className="flex items-center gap-2">
          <IcoGrad />
          <h1 className="text-xl font-bold" style={{ color: "#024677" }}>جلساتي</h1>
          <button
            onClick={() => { load(page, search.trim() ? { search: search.trim() } : {}, true); setLastRefresh(Date.now()); }}
            title="تحديث"
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-400 hover:text-teal-600">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          {liveCnt > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"/>
              {liveCnt} جارية الآن
            </span>
          )}
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
                load(1, q ? { search: q } : {});
              }}
              placeholder="ابحث بالاسم أو البرنامج أو التاريخ..."
              className="w-full pr-9 pl-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                aria-label="مسح البحث">
                <IcoClose />
              </button>
            )}
          </div>
          {onAddSession && hasPermission("sessions.create") && (
            <button onClick={onAddSession}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition shrink-0"
              style={{ background: "#14b8a6" }}>
              <IcoPlus />إضافة جلسة
            </button>
          )}
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-[1020px] mx-auto">
        <div className="rounded-[20px] flex items-center justify-between w-full min-h-[120px] p-5"
          style={{ border: "1.34px solid #047857" }}>
          <div className="text-right relative">
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>
            <p className="text-5xl font-bold" style={{ color: "#024677" }}>{liveCnt}</p>
            <p className="text-xs text-teal-500 font-semibold mt-1.5">جارية الآن</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#04785714" }}>
            <IcoPlayCircle />
          </div>
        </div>
        <div className="rounded-[20px] flex items-center justify-between w-full min-h-[120px] p-5"
          style={{ border: "1.34px solid #e2e8f0" }}>
          <div className="text-right">
            <p className="text-5xl font-bold" style={{ color: "#024677" }}>{upcomingCnt}</p>
            <p className="text-xs text-slate-400 mt-1.5">قادمة</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0246770D" }}>
            <IcoCal />
          </div>
        </div>
        <div className="rounded-[20px] flex items-center justify-between w-full min-h-[120px] p-5"
          style={{ border: "1.34px solid #e2e8f0" }}>
          <div className="text-right">
            <p className="text-5xl font-bold" style={{ color: "#024677" }}>{endedCnt}</p>
            <p className="text-xs text-slate-400 mt-1.5">انتهت</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0246770D" }}>
            <IcoCheck />
          </div>
        </div>
      </div>

      {/* upcoming sessions */}
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
                    onClick={() => { setUpSort(o.key); setUpMenu(null); }}
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
                    onClick={() => { setUpFilter(o.key); setUpMenu(null); }}
                    className={`w-full text-right px-3 py-2 text-xs transition
                      ${upFilter === o.key ? "bg-[#0246770D] text-[#024677] font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
                    {o.label}
                  </button>
                ))}
              </MenuDrop>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide transition-opacity duration-500"
          style={{ opacity: fading ? 0 : 1, minHeight: 185 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}>
          {upcomingChunk.map(s => (
            <UpcomingCard key={s.id} session={s} onView={onViewSession} onEdit={onEditSession} />
          ))}
          {!loading && visibleComing.length === 0 && (
            <p className="text-slate-400 text-sm py-4 w-full text-center">لا توجد جلسات قادمة</p>
          )}
        </div>

        {chunkCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {Array.from({ length: chunkCount }).map((_, i) => (
              <button key={i} onClick={() => { setFading(true); setTimeout(() => { setChunkIdx(i); setFading(false); }, 300); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === safeIdx ? 16 : 6, background: i === safeIdx ? "#14b8a6" : "#cbd5e1" }} />
            ))}
          </div>
        )}
      </div>

      {/* status tabs + mode filter + list */}
      <div className="w-full max-w-[1020px] mx-auto space-y-4">

        {/* status tabs */}
        <div className="flex w-fit border border-slate-200 rounded-xl overflow-hidden divide-x divide-x-reverse divide-slate-200">
          {STATUS_TABS.map(t => {
            const count = t.key === "all" ? all.length
              : t.key === "live" ? liveCnt
              : t.key === "scheduled" ? upcomingCnt
              : endedCnt;
            return (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={tab === t.key
                ? { background: "#14b8a6", color: "#fff" }
                : { background: "#fff", color: "#475569" }}>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={tab === t.key
                  ? { background: "rgba(255,255,255,.25)", color: "#fff" }
                  : { background: "#f1f5f9", color: "#64748b" }}>
                {count}
              </span>
              {t.label}
            </button>
            );
          })}
        </div>

        {/* mode tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {MODE_TABS.map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={mode === m.key
                ? { background: "#024677", color: "#fff", borderColor: "#024677" }
                : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* error */}
        {error && (
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button onClick={reload}
              className="text-xs font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: "#024677" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* list */}
        {!error && loading && all.length === 0 ? (
          <div className="flex justify-center py-16"><IcoSpinner /></div>
        ) : (
          <>
            {query && (
              <p className="text-xs text-slate-400">
                {filtered.length} نتيجة للبحث
              </p>
            )}
            <div className="space-y-3">
              {filtered.map(s => (
                <SessionRow key={s.id} session={s} onView={onViewSession} onEdit={onEditSession} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  {query ? "لا توجد نتائج مطابقة" : "لا توجد جلسات"}
                </div>
              )}
            </div>
            <Pagination
              page={page}
              totalPages={lastPage}
              onChange={p => setPage(p)} />
          </>
        )}
      </div>
    </main>
  );
}
