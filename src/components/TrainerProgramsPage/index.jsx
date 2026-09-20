import { useState, useEffect, useCallback } from "react";
import { fetchCoachPrograms } from "../../services/api";
import { hasPermission } from "../../services/auth";
import { contentTypeUiKey } from "../../services/sessionType";
import Pagination from "../Pagination";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconSort() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h9M8 18h5"/>
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function IconGradHeader() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function IconCal()   { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IconClock() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconVid()   { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>; }
function IconPin()   { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconUsers() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconStar()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconTrend() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }

// ─────────────────────────────────────────────────────────────────────────────
// Status & Type config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  approved: {
    label: "معتمد", color: "#16a34a", bg: "#f0fdf4",
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  review: {
    label: "قيد المراجعة", color: "#64748b", bg: "#f8fafc",
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  rejected: {
    label: "مرفوض", color: "#dc2626", bg: "#fef2f2",
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  },
};

const TYPE = {
  recorded:    { label: "كورس مسجل",       Icon: IconVid, color: "#64748b", bg: "#f1f5f9" },
  offline:     { label: "حضوري",            Icon: IconPin, color: "#64748b", bg: "#f1f5f9" },
  interactive: { label: "جلسات تفاعلية",   Icon: IconVid, color: "#7c3aed", bg: "#ede9fe" },
};

const STATE_COLOR = { "نشط": "#16a34a", "مكتمل": "#2563eb" };

// ─────────────────────────────────────────────────────────────────────────────
// Normalise raw API program
// ─────────────────────────────────────────────────────────────────────────────
function normalise(p) {
  // map API status (2=approved, 1=draft/review, 0=rejected) to key
  const statusMap = { 2: "approved", 1: "review", 0: "rejected" };
  const statusKey = statusMap[p.status] ?? "review";

  const typeKey = contentTypeUiKey(p.session_type?.value) || contentTypeUiKey(p.content_type?.value) || null;

  return {
    id:           p.id,
    name:         p.name?.ar ?? p.name?.en ?? (typeof p.name === 'object' ? JSON.stringify(p.name) : p.name) ?? "—",
    status:       statusKey,
    statusText:   p.status_text ?? statusMap[p.status] ?? "—",
    type:         typeKey,
    sessionType:  p.session_type?.text ?? "",
    trainer:      p.trainer?.name ?? "—",
    trainerAvatar:(p.trainer?.name ?? "م").charAt(0),
    date:         p.created_at ?? p.start_date ?? "",
    startDate:    p.start_date ?? "",
    endDate:      p.end_date   ?? "",
    sessions:     p.sessions_count ?? 0,
    completedSessions: p.completed_sessions_count ?? 0,
    weeks:        p.duration_weeks ?? 0,
    trainees:     p.trainees_count ?? 0,
    capacity:     p.capacity_label ?? "",
    rating:       p.rating > 0 ? p.rating : null,
    progress:     p.progress_percent ?? 0,
    remaining:    (p.sessions_count ?? 0) - (p.completed_sessions_count ?? 0),
    programState: p.activity_status?.text ?? null,
    price:        p.price_amount ? `${p.price_amount} ${p.currency ?? "SAR"}` : null,
    hours:        p.hours_count  ?? null,
    keywords:     p.keywords     ?? [],
    category:     p.category?.name ?? "",
    field:        p.field?.name    ?? "",
  };
}

const TABS = [
  { key: "all",      label: "الكل" },
  { key: "approved", label: "معتمدة" },
  { key: "review",   label: "قيد المراجعة" },
  { key: "rejected", label: "مرفوضة" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────────────────
function Bar({ value }) {
  const bg = value >= 80 ? "#14b8a6" : value >= 50 ? "#3b82f6" : "#f59e0b";
  return (
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: bg }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Program card
// ─────────────────────────────────────────────────────────────────────────────
function ProgramCard({ program: p, onView }) {
  const st  = STATUS[p.status]  || STATUS.review;
  const typ = p.type ? TYPE[p.type] : null;

  return (
    <div className="rounded-2xl border border-slate-200 hover:shadow-md transition-shadow flex flex-col"
      style={{ background: "#F2F5F86B" }} dir="rtl">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-3 gap-2">

        {/* badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: st.color }}>
            {st.icon}{st.label}
          </span>
          {typ && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md"
              style={{ background: typ.bg, color: typ.color }}>
              <typ.Icon />{typ.label}
            </span>
          )}
        </div>

        {/* title */}
        <h3 className="text-sm font-bold leading-snug" style={{ color: "#024677" }}>{p.name}</h3>

        {/* trainer */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: "#E8F4FB", color: "#024677" }}>{p.trainerAvatar}</div>
          <span className="text-[11px] text-slate-500">{typeof p.trainer === 'object' ? p.trainer?.name : p.trainer}</span>
        </div>

        {/* meta */}
        <div className="flex flex-col sm:flex-row sm:gap-4 gap-2 mt-1">
          <div className="flex-1 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5"><IconCal /><span>{p.startDate || p.date}</span></div>
            <div className="flex items-center gap-1.5"><IconClock /><span>{p.sessions} جلسة — {p.weeks} أسبوع</span></div>
            {p.hours && <div className="flex items-center gap-1.5"><IconClock /><span>{p.hours} ساعة تدريبية</span></div>}
          </div>
          <div className="flex-1 space-y-1.5 text-[11px] text-slate-500">
            {p.programState && (
              <div className="flex items-center gap-1.5">
                <IconTrend />
                <span>الحالة: </span>
                <span className="font-semibold" style={{ color: STATE_COLOR[p.programState] ?? "#64748b" }}>{p.programState}</span>
              </div>
            )}
            {p.progress > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="shrink-0">التقدم:</span>
                <Bar value={p.progress} />
                <span className="shrink-0 font-semibold text-slate-600">{p.progress}%</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <IconUsers /><span>{p.capacity || p.trainees}</span>
              {p.rating && <span className="flex items-center gap-0.5 mr-1"><IconStar /><span className="text-amber-500 font-semibold">{p.rating}</span></span>}
            </div>
          </div>
        </div>

        {/* keywords */}
        {p.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {p.keywords.slice(0, 3).map((k, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{k}</span>
            ))}
            {p.keywords.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">+{p.keywords.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="px-3 pb-3 pt-1">
        <button
          onClick={() => onView?.(p)}
          className="w-full h-9 rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
          style={{ background: "#024677" }}>
          {p.status === "rejected" ? "عرض سبب الرفض" : "عرض البرنامج"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function TrainerProgramsPage({ onViewProgram, onAddProgram }) {
  const [programs,  setPrograms]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [page,      setPage]      = useState(1);
  const [lastPage,  setLastPage]  = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [search,    setSearch]    = useState("");

  const load = useCallback((tab, q, p) => {
    setLoading(true);
    setError(null);
    fetchCoachPrograms({
      status:   tab !== "all" ? (tab === "approved" ? 2 : tab === "rejected" ? 0 : 1) : undefined,
      search:   q || undefined,
      page:     p,
      per_page: 15,
    })
      .then(res => {
        const data = res.data ?? res;
        setPrograms((data.programs ?? []).map(normalise));
        setLastPage(data.pagination?.total_pages ?? 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load("all", "", 1); }, [load]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(activeTab, search, 1); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const handleTab = tab => {
    setActiveTab(tab); setPage(1); load(tab, search, 1);
  };

  const counts = {
    all:      programs.length,
    approved: programs.filter(p => p.status === "approved").length,
    review:   programs.filter(p => p.status === "review").length,
    rejected: programs.filter(p => p.status === "rejected").length,
  };

  // client-side search on already-loaded data
  const filtered = programs.filter(p =>
    !search || p.name.includes(search) || p.category.includes(search) || p.field.includes(search)
  );

  // spinner
  const Spinner = () => (
    <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-white p-4 sm:p-5" dir="rtl">

      {/* header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <IconGradHeader />
          <h1 className="text-xl font-bold text-slate-800">برامجي التدريبية</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasPermission("programs.create") && (
            <button onClick={onAddProgram}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2.5 rounded-xl transition hover:opacity-90"
              style={{ background: "#024677" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              إضافة برنامج
            </button>
          )}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IconSearch />
            </span>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن برنامج..."
              className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl
                         w-44 focus:outline-none focus:border-teal-400 transition
                         placeholder:text-slate-400 text-slate-700"/>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="flex w-fit max-w-full mb-5 border border-slate-200 rounded-xl overflow-x-auto divide-x divide-x-reverse divide-slate-200">
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => handleTab(tab.key)}
              className="flex items-center justify-center gap-1.5 px-5 py-3
                         text-xs font-semibold transition-all min-w-[90px] whitespace-nowrap shrink-0"
              style={active
                ? { background: "#14b8a6", color: "#fff" }
                : { background: "#fff",    color: "#475569" }}>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                style={active
                  ? { background: "rgba(255,255,255,.25)", color: "#fff" }
                  : { background: "#f1f5f9", color: "#64748b" }}>
                {counts[tab.key]}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* states */}
      {loading && (
        <div className="flex justify-center py-16"><Spinner /></div>
      )}
      {!loading && error && (
        <div className="flex flex-col items-center py-16 gap-3">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={() => load(activeTab, search, page)}
            className="text-xs font-bold px-4 py-2 rounded-xl text-white"
            style={{ background: "#024677" }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl mx-auto">
            {filtered.map(p => (
              <ProgramCard key={p.id} program={p} onView={onViewProgram} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-16 text-slate-400 text-sm">
                لا توجد برامج
              </div>
            )}
          </div>

          {/* pagination */}
          {lastPage > 1 && (
            <Pagination
              page={page}
              totalPages={lastPage}
              onChange={p => { setPage(p); load(activeTab, search, p); }} />
          )}
        </>
      )}
    </main>
  );
}
