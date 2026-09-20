import { useState, useEffect, useRef } from "react";
import { fetchCoaches, fetchPrograms } from "../services/api";
import Pagination from "./Pagination";

// ── normalise raw API coach ───────────────────────────────────────────────────
function normalise(c) {
  const name = c.name ?? "—";
  return {
    id:             c.id,
    name,
    avatar:         name.trim().charAt(0).toUpperCase(),
    email:          c.email ?? "",
    phone:          c.phone ?? "",
    rating:         c.rating ?? 0,
    programs:       c.programs_count ?? 0,
    trainees:       c.trainees_count ?? c.programs_count ?? 0,
    active:         !!(c.sessions_count > 0 || c.has_active_sessions),
    specialization: c.specialization?.name ?? c.field?.name ?? "",
    image:          c.image ?? null,
  };
}

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoUsers({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IcoGrad({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function IcoBarChart({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  );
}
function IcoTrend({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function IcoSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IcoPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="3.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

// ── sparkline — same wavy style as the company dashboard ────────────────────
const WAVES = [
  "M300 42 C270 34 250 50 220 40 S165 30 140 42 S85 52 50 38 S15 28 0 34",
  "M300 36 C270 44 245 30 215 40 S160 50 135 36 S80 26 50 40 S18 50 0 42",
  "M300 44 C268 36 248 52 218 40 S162 28 138 44 S82 56 48 38 S14 26 0 36",
];
function Sparkline({ color = "#14b8a6", idx = 0 }) {
  const id = `sp-${color.replace("#", "")}-${idx}`;
  const line = WAVES[idx % WAVES.length];
  return (
    <div className="px-4 pb-3 pt-1">
      <svg width="100%" height="40" viewBox="0 0 300 80"
        preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${line} L0 80 L300 80 Z`} fill={`url(#${id})`}/>
        <path d={line} stroke={color} strokeWidth="2.5"
          strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, title, num, sub, growth, color = "#14b8a6", idx = 0 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2 hover:shadow-md transition overflow-hidden" dir="rtl">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#0246770D", color: "#024677" }}>
          {icon}
        </div>
        {growth && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {growth}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-2xl font-extrabold" style={{ color: "#1D293D" }}>{num}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      <Sparkline color={color} idx={idx} />
    </div>
  );
}

// ── trainer card ──────────────────────────────────────────────────────────────
function TrainerCard({ trainer, onViewTrainer }) {
  return (
    <div
      onClick={() => onViewTrainer?.(trainer)}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition cursor-pointer"
      dir="rtl">

      {/* top colored bar */}
      <div className="h-1.5 w-full" style={{ background: "#14b8a6" }} />

      {/* avatar + name row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="relative shrink-0">
          {trainer.image ? (
            <img src={trainer.image} alt={trainer.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
              onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ background: "#14b8a6" }}>
              {trainer.avatar}
            </div>
          )}
          {trainer.active && (
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{trainer.name}</p>
          {trainer.specialization && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{trainer.specialization}</p>
          )}
        </div>
      </div>

      {/* contact info */}
      <div className="px-4 py-2.5 space-y-1.5 border-b border-slate-100">
        {trainer.email && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span className="truncate">{trainer.email}</span>
          </div>
        )}
        {trainer.phone && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l1.97-1.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>{trainer.phone}</span>
          </div>
        )}
        {trainer.rating > 0 && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="text-amber-500 font-semibold">{trainer.rating.toFixed(1)}</span>
            <span className="text-slate-400">• {trainer.specialization || "0"} سنوات</span>
          </div>
        )}
      </div>

      {/* stat boxes */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-slate-100">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center">
          <p className="text-base font-extrabold" style={{ color: "#024677" }}>{trainer.trainees ?? 35}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">برنامج مكتملة</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center">
          <p className="text-base font-extrabold" style={{ color: "#024677" }}>{trainer.programs}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">جلسة نشطة</p>
        </div>
      </div>

      {/* view button */}
      <div className="px-4 py-3 flex justify-end">
        <button
          onClick={e => { e.stopPropagation(); onViewTrainer?.(trainer); }}
          className="w-fit px-6 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "#024677" }}>
          عرض الملف
        </button>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function TrainersPage({ onAddTrainer, onViewTrainer }) {
  const [trainers,  setTrainers]  = useState([]);
  const [stats,     setStats]     = useState({});
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [lastPage,  setLastPage]  = useState(1);
  const [programs,  setPrograms]  = useState([]);
  const [selProg,   setSelProg]   = useState([]);   // selected program IDs
  const [dropOpen,  setDropOpen]  = useState(false);
  const dropRef = useRef();

  const load = (q, p, progs) => {
    setLoading(true);
    fetchCoaches({
      per_page: 15,
      page: p,
      search:     q || undefined,
      program_id: progs?.length === 1 ? progs[0] : undefined,
    })
      .then(res => {
        const data = res.data ?? res;
        setTrainers((data.coaches ?? []).map(normalise));
        setStats(data.statistics ?? {});
        setLastPage(data.pagination?.total_pages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // initial load
  useEffect(() => {
    fetchPrograms({ per_page: 100 }).then(r => setPrograms(r.data?.programs ?? [])).catch(() => {});
    load("", 1, []);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => { load(search, 1, selProg); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // outside click closes dropdown
  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleProgram = id => {
    const next = selProg.includes(id) ? selProg.filter(x => x !== id) : [...selProg, id];
    setSelProg(next); setPage(1); load(search, 1, next);
  };

  // counts
  const totalCount  = stats.coaches_count        ?? trainers.length;
  const activeCount = stats.coaches_has_sessions_count ?? trainers.filter(t => t.active).length;
  const avgRating   = (stats.avg_rate_of_all_coaches ?? 0).toFixed(1);
  const commitment  = trainers.length > 0 ? Math.round(trainers.filter(t => t.active).length / trainers.length * 100) : 0;

  // program dropdown label
  const progLabel = selProg.length === 0 ? "الكل"
    : selProg.length === 1 ? (programs.find(p => p.id === selProg[0])?.name ?? "برنامج واحد")
    : `${selProg.length} برامج مختارة`;

  return (
    <main className="flex-1 overflow-y-auto bg-white px-3 sm:px-4 py-4 space-y-5" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto space-y-5">

        {/* ── header ── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <IcoUsers size={20} className="text-teal-500" />
            <h1 className="text-xl font-bold whitespace-nowrap" style={{ color: "#024677" }}>
              إدارة المدربين
            </h1>
          </div>
          <span className="flex-1" />
          {/* search */}
          <div className="relative w-64 shrink-0">
            <input type="text" placeholder="بحث عن مدرب" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-4 pl-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-400"
              dir="rtl" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IcoSearch size={16} />
            </span>
          </div>
          {/* add trainer */}
          <button onClick={onAddTrainer}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-xl shrink-0 transition hover:opacity-90"
            style={{ background: "#024677" }}>
            <IcoPlus size={16} /> إضافة مدرب جديد
          </button>
        </div>

        {/* ── stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<IcoUsers size={20} />}    title="إجمالي المدربين"  num={totalCount}        color="#5AEACF" idx={0} />
          <StatCard icon={<IcoGrad size={20} />}     title="المدربون النشطون" num={activeCount}   sub="لديهم جلسات مفعّلة" color="#60a5fa" idx={1} />
          <StatCard icon={<IcoBarChart size={20} />} title="متوسط التقييم"    num={`${avgRating}/5`} color="#f59e0b" idx={2} />
          <StatCard icon={<IcoTrend size={20} />}    title="معدل الالتزام"    num={`${commitment}%`} growth="+12%" color="#34d399" idx={3} />
        </div>

        {/* ── program filter ── */}
        <div className="flex flex-col gap-1.5 w-full" dir="rtl">
          <p className="text-sm font-bold" style={{ color: "#024677" }}>اختر البرنامج</p>
          <div className="relative w-full" ref={dropRef}>
            <button onClick={() => setDropOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 cursor-pointer hover:border-teal-400 transition w-full justify-between"
              dir="rtl">
              <span className="truncate text-right">{progLabel}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8"
                strokeWidth="2" strokeLinecap="round"
                className={`transition-transform shrink-0 ${dropOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {dropOpen && (
              <div className="absolute top-full right-0 left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto" dir="rtl">
                {/* "All" option */}
                <button onClick={() => { setSelProg([]); setDropOpen(false); load(search, 1, []); setPage(1); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition text-right text-sm">
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition
                    ${selProg.length === 0 ? "bg-teal-400 border-teal-400" : "border-slate-300"}`}>
                    {selProg.length === 0 && <IcoCheck />}
                  </span>
                  <span className="text-slate-700 font-medium">الكل</span>
                </button>
                <div className="border-t border-slate-100" />
                {programs.map(p => (
                  <button key={p.id} onClick={() => toggleProgram(p.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition text-right text-sm">
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition
                      ${selProg.includes(p.id) ? "bg-teal-400 border-teal-400" : "border-slate-300"}`}>
                      {selProg.includes(p.id) && <IcoCheck />}
                    </span>
                    <span className="text-slate-700 truncate">{p.name?.ar ?? p.name}</span>
                  </button>
                ))}
                {programs.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">لا توجد برامج</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── trainers grid ── */}
        {loading ? (
          <div className="flex justify-center py-16"><IcoSpinner /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainers.map(t => (
                <TrainerCard key={t.id} trainer={t} onViewTrainer={onViewTrainer} />
              ))}
              {trainers.length === 0 && (
                <p className="col-span-3 text-center text-slate-400 text-sm py-12">لا يوجد مدربون</p>
              )}
            </div>

            {/* pagination */}
            {lastPage > 1 && (
              <Pagination
                page={page}
                totalPages={lastPage}
                onChange={p => { setPage(p); load(search, p, selProg); }} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
