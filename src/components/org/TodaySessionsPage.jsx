import { useState, useEffect } from "react";
import { fetchSessions } from "../../services/api";
import { computeStatus } from "./SessionsPage";

// ── helpers ───────────────────────────────────────────────────────────────────
function todayDate() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function normalise(s) {
  return {
    id:           s.id,
    title:        s.title,
    program:      s.program_name  ?? "—",
    trainer:      s.coach_name    ?? "—",
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

// ── tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { key: "all",      label: "الكل"        },
  { key: "upcoming", label: "قادمة"       },
  { key: "live",     label: "جارية الآن"  },
  { key: "ended",    label: "انتهت"       },
];

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoCal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#024677" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
function IcoFilter() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
function IcoSort() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6"  x2="21" y2="6"/>
      <line x1="8" y1="12" x2="15" y2="12"/>
      <line x1="8" y1="18" x2="11" y2="18"/>
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="30" height="30" viewBox="0 0 24 24"
      fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

// ── session card (inline — same shape as SessionsPage SessionCard) ─────────────
const STATUS_CFG = {
  live:     { label: "جارية الآن", color: "#16a34a", bg: "#f0fdf4" },
  upcoming: { label: "قادمة",       color: "#2563eb", bg: "#eff6ff" },
  ended:    { label: "منتهية",      color: "#64748b", bg: "#f8fafc" },
};

function SessionCard({ session, onView, onEdit }) {
  const st       = STATUS_CFG[session.status] ?? STATUS_CFG.upcoming;
  const isOnline = session.type === 0 || session.type?.value === 0 ||
                   session.type?.delivery_mode === "online";
  const isLive   = session.status === "live";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition"
      dir="rtl"
      style={isLive ? { borderColor: "#14b8a6", boxShadow: "0 0 0 1.5px #14b8a622" } : {}}>

      {isLive && <div className="w-full h-1.5 rounded-t-xl mb-3" style={{ background: "#14b8a6" }} />}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}>{st.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${isOnline ? "text-[#0ea5e9] bg-[#e0f2fe]" : "text-[#f59e0b] bg-[#fef3c7]"}`}>
              {isOnline ? "أونلاين" : "حضوري"}
            </span>
          </div>

          <p className="text-sm font-bold text-slate-800 truncate">{session.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{session.program}</p>

          <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-slate-500">
            {session.timeFrom && <span>🕐 {session.timeFrom}{session.timeTo ? ` — ${session.timeTo}` : ""}</span>}
            {session.trainees > 0 && <span>👥 {session.trainees} متدرب</span>}
            {session.venue && <span>📍 {session.venue}</span>}
            {session.trainer && session.trainer !== "—" && <span>المدرب: {session.trainer}</span>}
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {isLive ? (
            <button onClick={() => onView?.(session)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
              style={{ background: "#047857" }}>
              دخول مباشر
            </button>
          ) : (
            <button onClick={() => onView?.(session)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
              style={{ background: "#024677" }}>
              عرض
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit?.(session)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              تعديل
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function TodaySessionsPage({ onViewSession, onEditSession }) {
  const today = todayDate();

  const [activeTab, setActiveTab] = useState("all");
  const [search,    setSearch]    = useState("");
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // load today's sessions from all statuses
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchSessions({ status: "scheduled", page: 1 }),
      fetchSessions({ status: "running",   page: 1 }),
      fetchSessions({ status: "ended",     page: 1 }),
    ])
      .then(([sched, running, ended]) => {
        if (!alive) return;
        const extract = res => (res?.data?.all_sessions?.data ?? []).map(normalise);
        const all     = [...extract(sched), ...extract(running), ...extract(ended)];

        // filter to today + deduplicate
        const seen    = new Set();
        const todayList = all
          .filter(s => s.date === today)
          .filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });

        setSessions(todayList);
      })
      .catch(err => { if (alive) setError(err.message || "حدث خطأ أثناء تحميل الجلسات"); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    const matchTab = activeTab === "all" || s.status === activeTab;
    const q        = search.trim().toLowerCase();
    const matchQ   = !q
      || (s.title   || "").toLowerCase().includes(q)
      || (s.program || "").toLowerCase().includes(q)
      || (s.trainer || "").toLowerCase().includes(q);
    return matchTab && matchQ;
  });

  // ── tab counts ──────────────────────────────────────────────────────────────
  const counts = {
    all:      sessions.length,
    upcoming: sessions.filter(s => s.status === "upcoming").length,
    live:     sessions.filter(s => s.status === "live").length,
    ended:    sessions.filter(s => s.status === "ended").length,
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 px-4 sm:px-5 py-4 space-y-5" dir="rtl">

      {/* ── header ── */}
      <div className="w-full max-w-[1020px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <IcoCal />
          <h1 className="text-xl font-bold" style={{ color: "#024677" }}>جلسات اليوم</h1>
          <span className="text-xs text-slate-400">{today}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* search */}
          <div className="relative w-full sm:w-[300px]">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IcoSearch />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن جلسة..."
              className="w-full pr-9 pl-3 h-[34px] text-xs bg-white rounded-xl focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400"
              style={{ border: "1px solid #B4C8D7" }} />
          </div>
          <button className="w-[34px] h-[34px] rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition flex items-center justify-center">
            <IcoFilter />
          </button>
          <button className="w-[34px] h-[34px] rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition flex items-center justify-center">
            <IcoSort />
          </button>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="w-full max-w-[1020px] mx-auto">
        <div className="w-fit max-w-full rounded-xl p-1 flex items-stretch gap-1 overflow-x-auto"
          style={{ background: "#F2F5F8" }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="min-w-[96px] whitespace-nowrap px-4 h-[32px] rounded-lg text-xs font-bold transition"
              style={activeTab === tab.key
                ? { background: "#5AEACF", color: "#024677", borderLeft: "4px solid #49DCC1" }
                : { color: "#64748b",      borderLeft: "4px solid #EAEAEA" }}>
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className="mr-1.5 text-[10px] font-bold opacity-70">
                  ({counts[tab.key]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── content ── */}
      <div className="w-full max-w-[1020px] mx-auto space-y-3 min-h-[200px]">

        {loading && (
          <div className="flex justify-center py-14"><IcoSpinner /></div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && filtered.map(s => (
          <SessionCard key={s.id} session={s}
            onView={() => onViewSession?.(s)}
            onEdit={() => onEditSession?.(s)} />
        ))}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-14 text-slate-400 text-sm">
            {sessions.length === 0
              ? "لا توجد جلسات مجدولة لهذا اليوم"
              : "لا توجد جلسات في هذا التصنيف"}
          </div>
        )}
      </div>
    </main>
  );
}
