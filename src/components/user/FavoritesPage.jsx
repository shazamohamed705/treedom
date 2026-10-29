import { useState, useEffect } from "react";
import { fetchMyFavourites, removeMyFavourite, fetchMyProgramDetail } from "../../services/api";
import { sessionTypeUiKey } from "../../services/sessionType";
import { setFav, seedFavs } from "../../services/favourites";
import { programCover, programVideoUrl, attachProgramVideos } from "../../services/programMedia";
import Pagination from "../shared/Pagination";

// ── colorful thumbnail per program — matches the browse cards ────────────────
const THUMBS = [
  "linear-gradient(135deg,#024677 0%,#0a5fa0 55%,#10b0c8 100%)",
  "linear-gradient(135deg,#1e3c72 0%,#2a5298 60%,#8e2de2 130%)",
  "linear-gradient(135deg,#134e5e 0%,#2d8f74 100%)",
  "linear-gradient(135deg,#42275a 0%,#734b6d 55%,#e96443 140%)",
  "linear-gradient(135deg,#0f2027 0%,#203a43 60%,#ff6b6b 160%)",
  "linear-gradient(135deg,#5f2c82 0%,#49a09d 100%)",
];
const thumbFor = (p) => THUMBS[(parseInt(p.cat, 10) || 0) % THUMBS.length];

// session_type text → badge key
const normalizeType = (t) => sessionTypeUiKey(t);

// ── icons ─────────────────────────────────────────────────────────────────────
const IcoStar     = ({ filled }) => (
  <svg width={20} height={20} viewBox="0 0 24 24"
    fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoPlay = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white" stroke="none">
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>
);

// ── ribbon badge (with المختلط) ──────────────────────────────────────────────
function RibbonBadge({ type }) {
  const cfg = {
    online:   { label:"أونلاين", fill:"#0B5CFF" },
    offline:  { label:"حضوري",  fill:"#A7ABAB" },
    recorded: { label:"مسجل",   fill:"#E2BF34" },
    mixed:    { label:"مختلط",  fill:"#7C3AED" },
  };
  const c = cfg[type] ?? cfg.online;
  const W=34, H=44, bodyH=32;
  return (
    <div className="absolute z-20 pointer-events-none" style={{ top:0, right:8 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none"
        style={{ filter:"drop-shadow(1px 2px 3px rgba(0,0,0,0.28))" }}>
        <path d={`M0 0 H${W} V${bodyH} L${W/2} ${H} L0 ${bodyH} Z`} fill={c.fill}/>
      </svg>
      <div className="absolute top-0 left-0 flex flex-col items-center justify-start"
        style={{ width:W, paddingTop:5 }}>
        <span className="text-[6.5px] font-extrabold text-white leading-tight text-center">{c.label}</span>
      </div>
    </div>
  );
}

// ── program card ──────────────────────────────────────────────────────────────
function FavCard({ p, onToggle }) {
  return (
    <div className="bg-white rounded-[16px] flex flex-col relative overflow-hidden"
      style={{ boxShadow:"0 4px 16px rgba(8,15,52,0.08)", border:"1px solid #f1f5f9" }}>

      <div className="relative overflow-hidden rounded-xl mx-2.5 mt-2.5"
        style={{ height:112, background: thumbFor(p) }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.3) 1px,transparent 1px)", backgroundSize:"14px 14px" }}/>
        {p.videoUrl ? (
          <video
            src={p.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            preload="metadata"
            muted
            playsInline
          />
        ) : p.img ? (
          <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 cursor-pointer transition">
            <IcoPlay/>
          </div>
        </div>
        <RibbonBadge type={p.type}/>
        {/* remove heart — top left */}
        <button
          onClick={() => onToggle(p.id)}
          title="إزالة من المفضلة"
          className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
          style={{ background:"rgba(0,0,0,0.30)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill="#ef4444" stroke="#ef4444" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* body */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1.5">
        {/* tag */}
        {p.tag && (
          <span className="self-start text-[9px] font-bold px-2 py-0.5 rounded-md"
            style={{ background:"rgba(49,175,234,0.13)", color:"#31AFEA" }}>
            {p.tag}
          </span>
        )}
        {/* title */}
        <p className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-2">{p.title}</p>
        {/* trainer */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ background:"#31AFEA" }}>{p.trainerAvatar}</div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-700 leading-none truncate">{p.trainer}</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">{p.trainerSub}</p>
          </div>
        </div>
        {/* progress footer */}
        {p.sessions > 0 && (
          <div className="mt-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-slate-400">{p.completed}/{p.sessions} جلسة مكتملة</span>
              <span className="text-[9px] font-bold" style={{ color:"#14b8a6" }}>{p.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${p.progress}%`, background:"#14b8a6" }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

export default function FavoritesPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [reload,  setReload]  = useState(0);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    let active = true;
    fetchMyFavourites({ per_page: 100 })
      .then(res => {
        if (!active) return;
        const list = res?.data?.favourites ?? [];
        seedFavs(list.map(f => f.id));
        const mapped = list.map(f => ({
          id:          f.id,
          title:       f.name ?? "—",
          type:        normalizeType(f.session_type),
          tag:         f.category?.name ?? "",
          trainer:     f.trainer?.name ?? "—",
          trainerSub:  f.provider?.name ?? "—",
          trainerAvatar: (f.trainer?.name ?? "م")[0],
          saved:       true,
          img:         programCover(f),
          videoUrl:    programVideoUrl(f, f.sessions),
          cat:         String(f.category?.id ?? ""),
          progress:    f.progress_percent ?? 0,
          sessions:    f.sessions_count ?? 0,
          completed:   f.completed_sessions_count ?? 0,
        }));
        setItems(mapped);
        attachProgramVideos(mapped, fetchMyProgramDetail).then(next => {
          if (active) setItems(next);
        });
        setError(false);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const toggle = async (id) => {
    // optimistic: remove from UI immediately
    setItems(prev => prev.filter(p => p.id !== id));
    setFav(String(id), false);
    try {
      await removeMyFavourite(id);
    } catch {
      // revert on failure — reload from server
      setReload(r => r + 1);
    }
  };
  const retry  = () => { setLoading(true); setError(false); setReload(r => r + 1); };

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems  = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const shownPage  = Math.min(page, totalPages);

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="rtl">
      <div className="w-full px-3 sm:px-10 py-6">

        {/* ── header ── */}
        <div className="flex items-center gap-2 mb-1">
          <IcoStar filled/>
          <h1 className="text-[18px] font-bold" style={{ color:"#31AFEA" }}>المفضلة</h1>
        </div>

        {/* sub-label */}
        <p className="text-[12px] text-slate-400 mb-5 text-right">البرامج المفضلة</p>

        {/* ── loading skeletons ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-28 bg-slate-200 mx-2.5 mt-2.5 rounded-xl"/>
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-3/4"/>
                  <div className="h-3 bg-slate-100 rounded w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <IcoStar filled={false}/>
            <p className="mt-3 text-[14px]">تعذر تحميل المفضلة</p>
            <button onClick={retry}
              className="mt-3 px-4 py-2 rounded-xl text-[12px] font-bold text-white"
              style={{ background:"#31AFEA" }}>
              إعادة المحاولة
            </button>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {pageItems.map(p => <FavCard key={p.id} p={p} onToggle={toggle}/>)}
            </div>

            {/* pagination */}
            {totalPages > 1 && (
              <Pagination
                page={shownPage}
                totalPages={totalPages}
                accent="#31AFEA"
                onChange={p => setPage(p)} />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <IcoStar filled={false}/>
            <p className="mt-3 text-[14px]">لا توجد برامج مفضلة بعد</p>
          </div>
        )}

      </div>
    </div>
  );
}