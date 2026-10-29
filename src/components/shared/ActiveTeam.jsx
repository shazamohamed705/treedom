import { useState, useEffect, useRef } from "react";
import { fetchCoaches } from "../../services/api";

const PAGE_SIZE = 6;   // cards visible at once (2 rows × 3 cols)
const CYCLE_MS  = 3000; // rotate one trainer every 3s

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoUserPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="16" y1="11" x2="22" y2="11"/>
    </svg>
  );
}

// ── trainer card ──────────────────────────────────────────────────────────────
function TrainerCard({ trainer }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition" dir="rtl">
      {/* avatar */}
      <div className="relative shrink-0">
        {trainer.image ? (
          <img src={trainer.image} alt={trainer.name}
            className="w-11 h-11 rounded-full object-cover"
            onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "#EFF6FF", color: "#3b82f6" }}>
            {trainer.avatar}
          </div>
        )}
        {trainer.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
        )}
      </div>
      {/* info */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 truncate">{trainer.name}</p>
        <p className="text-[10px] text-slate-400 truncate">{trainer.role}</p>
        <p className="text-[10px] text-teal-600 font-semibold mt-0.5 text-left">
          {trainer.programs} برامج نشطة
        </p>
      </div>
    </div>
  );
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-2 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function ActiveTeam({ onAddTrainer }) {
  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [start,    setStart]    = useState(0);
  const [fade,     setFade]     = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchCoaches({ per_page: 20 })          // fetch more so rotation has material
      .then(res => {
        const list = res?.data?.coaches ?? [];
        setTrainers(list.map(c => ({
          id:       c.id,
          name:     c.name ?? "—",
          avatar:   (c.name ?? "م").trim().charAt(0).toUpperCase(),
          role:     c.specialization?.name ?? "—",
          programs: c.programs_count ?? 0,
          isOnline: !!(c.is_active ?? c.sessions_count > 0),
          image:    c.image ?? null,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // start cycling once data loaded and there are more than PAGE_SIZE trainers
  useEffect(() => {
    if (loading || trainers.length <= PAGE_SIZE) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStart(prev => (prev + 1) % trainers.length);
        setFade(true);
      }, 280);
    }, CYCLE_MS);
    return () => clearInterval(timerRef.current);
  }, [loading, trainers.length]);

  // visible slice (circular)
  const visible = [];
  const count   = Math.min(PAGE_SIZE, trainers.length);
  for (let i = 0; i < count; i++) {
    visible.push(trainers[(start + i) % trainers.length]);
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white flex flex-col p-4" dir="rtl">

      {/* header */}
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-800">فريق المدربين النشطين</h2>
          <p className="text-xs text-slate-400 mt-0.5">متاحون حالياً لإسناد برامج وجلسات جديدة</p>
        </div>
        <button
          onClick={onAddTrainer}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200
            text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300
            transition-colors whitespace-nowrap shrink-0">
          <IcoUserPlus /> دعوة مدرب جديد
        </button>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 overflow-hidden transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}>
        {loading
          ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
          : visible.map(t => <TrainerCard key={`${start}-${t.id}`} trainer={t} />)
        }
        {!loading && trainers.length === 0 && (
          <p className="col-span-3 text-center text-sm text-slate-400 py-6">لا يوجد مدربون</p>
        )}
      </div>
    </div>
  );
}
