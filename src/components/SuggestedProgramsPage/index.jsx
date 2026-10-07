import { useState, useEffect, useMemo } from "react";
import {
  fetchMyBrowsePrograms,
  fetchMyProgramDetail,
  addMyFavourite,
  removeMyFavourite,
} from "../../services/api";
import { useFavStore, setFav, seedFavs } from "../../services/favourites";
import { mediaUrl, programCover, programVideoUrl, attachCategoryProgramVideos } from "../../services/programMedia";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 13, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoPlay  = ({ size = 14 }) => <Ico size={size} fill="white" stroke="white" d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const IcoStar  = () => <Ico size={11} fill="#f59e0b" stroke="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const IcoBack  = () => <Ico d={<polyline points="15 18 9 12 15 6"/>}/>;
const IcoSearch = ({ size = 14 }) => <Ico size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;

const THUMB_BG = "linear-gradient(135deg,#0a1628 0%,#0f2a4a 50%,#0d3a5c 100%)";

function Riyal({ size = 10 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width={size} height={size + 1}
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 2, flexShrink: 0 }}>
      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  );
}

function Tag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold"
      style={{ background: "rgba(49,175,234,0.13)", color: "#31AFEA" }}>
      {label}
    </span>
  );
}

// ── program card ──────────────────────────────────────────────────────────────
function SuggestedCard({ p, onView }) {
  const favStore = useFavStore();
  const pid      = String(p.id ?? "");
  const isFav    = favStore.has(pid);
  const [favBusy, setFavBusy] = useState(false);

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (favBusy || !pid) return;
    setFav(pid, !isFav);
    setFavBusy(true);
    try {
      if (!isFav) await addMyFavourite(Number(pid));
      else        await removeMyFavourite(Number(pid));
    } catch { setFav(pid, isFav); }
    finally { setFavBusy(false); }
  };

  return (
    <div
      onClick={() => onView?.(p)}
      className="rounded-[16px] bg-white border border-slate-100 flex flex-col relative overflow-hidden cursor-pointer hover:shadow-md transition"
      style={{ boxShadow: "0 4px 20px rgba(8,15,52,0.07)" }}
      dir="rtl"
    >
      {/* thumbnail */}
      <div className="relative overflow-hidden mx-3 mt-3 rounded-xl shrink-0"
        style={{ height: 120, background: THUMB_BG }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize: "12px 12px" }}/>
        {p.videoUrl ? (
          <video src={p.videoUrl} className="absolute inset-0 w-full h-full object-cover" preload="metadata" muted playsInline/>
        ) : p.img ? (
          <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 transition">
            <IcoPlay size={14}/>
          </div>
        </div>
        {/* fav */}
        <button onClick={toggleFav}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition"
          style={{ background: isFav ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.3)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24"
            fill={isFav ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* body */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1.5 flex-1">
        {(p.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1">{p.tags.slice(0, 2).map((t, i) => <Tag key={i} label={t}/>)}</div>
        )}

        <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2">{p.title}</p>

        <p className="text-[10px] font-medium" style={{ color: "#808080" }}>
          المدة: {p.sessions ?? 0} جلسة — {p.duration ?? 0} أسابيع
        </p>

        <p className="text-[11px] font-medium text-slate-700">
          يبدأ {p.date || "قريباً"}
        </p>

        {/* price + rating */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <span className="font-extrabold flex items-center" style={{ color: "#31AFEA", fontSize: 14 }}>
            {p.price ?? 0}<Riyal/>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
            <IcoStar/>{p.rating ?? 0}
          </span>
        </div>

        {/* trainer */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
          {p.trainerImg ? (
            <img src={p.trainerImg} alt="" className="w-7 h-7 rounded-full object-cover shrink-0"/>
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background: "#31AFEA" }}>{p.trainerAvatar ?? "م"}</div>
          )}
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 truncate">
              {typeof p.trainer === "object" ? p.trainer?.name : (p.trainer || "—")}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{p.trainerSub ?? ""}</p>
          </div>
        </div>

        {/* enroll button */}
        <button
          onClick={(e) => { e.stopPropagation(); onView?.(p); }}
          className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-1"
          style={{ background: p.isEnrolled ? "#16a34a" : "#31AFEA" }}
        >
          {p.isEnrolled ? "✓ أنت مسجّل" : "سجل الآن"}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[16px] bg-white border border-slate-100 overflow-hidden animate-pulse">
      <div className="mx-3 mt-3 rounded-xl" style={{ height: 120, background: "#EEF2F6" }}/>
      <div className="px-3 pt-3 pb-3 space-y-2">
        <div className="h-3 rounded w-1/3" style={{ background: "#EEF2F6" }}/>
        <div className="h-4 rounded w-4/5" style={{ background: "#EEF2F6" }}/>
        <div className="h-3 rounded w-1/2" style={{ background: "#EEF2F6" }}/>
        <div className="h-9 rounded-xl mt-2" style={{ background: "#EEF2F6" }}/>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function SuggestedProgramsPage({ onViewProgram, onBack }) {
  const [programs,  setPrograms]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    let on = true;
    fetchMyBrowsePrograms()
      .then(res => {
        const cats = res?.data?.categories ?? [];
        const all  = cats.flatMap(c => c.programs ?? []);
        // seed favs
        const favIds = all.filter(p => p.is_favourite).map(p => String(p.id));
        if (favIds.length) seedFavs(favIds);

        const mapped = all.map(p => ({
          id:            p.id,
          title:         p.name ?? "—",
          sessions:      p.sessions_count ?? 0,
          duration:      p.duration_weeks ?? 0,
          date:          p.start_date ?? "",
          price:         parseFloat(p.price_amount) || 0,
          rating:        p.rating ?? 0,
          type:          typeof p.session_type === "object" ? (p.session_type?.text ?? "أونلاين") : (p.session_type ?? "أونلاين"),
          tags:          (p.keywords ?? []).map(k => typeof k === "object" ? k.name : k),
          trainer:       p.trainer?.name ?? "—",
          trainerAvatar: (p.trainer?.name ?? p.provider?.name ?? "م")[0],
          trainerImg:    mediaUrl(p.trainer?.image ?? p.trainer?.profile_image ?? p.trainer?.avatar),
          trainerSub:    p.provider?.name ?? "—",
          img:           programCover(p),
          videoUrl:      programVideoUrl(p),
          isEnrolled:    p.is_enrolled ?? false,
          categoryName:  p.category?.name ?? "",
        }));

        if (on) { setPrograms(mapped); setLoading(false); }

        // group into categories structure for attachCategoryProgramVideos
        const catGroups = cats.map(c => ({
          ...c,
          programs: mapped.filter(m => all.find(a => a.id === m.id && a.category?.id === c.id)),
        }));
        attachCategoryProgramVideos(catGroups, fetchMyProgramDetail).then(enriched => {
          if (!on) return;
          const flat = enriched.flatMap(c => c.programs);
          setPrograms(prev => prev.map(p => flat.find(f => f.id === p.id) ?? p));
        });
      })
      .catch(() => { if (on) { setError("تعذر تحميل البرامج، حاول مرة أخرى."); setLoading(false); } });

    return () => { on = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return programs;
    const q = search.trim().toLowerCase();
    return programs.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (typeof p.trainer === "string" && p.trainer.toLowerCase().includes(q))
    );
  }, [programs, search]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-5">

        {/* header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#31AFEA] hover:text-[#31AFEA] transition">
            <IcoBack/>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(49,175,234,0.1)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#31AFEA" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold text-slate-800">برامج مقترحة</h1>
              {!loading && (
                <p className="text-[11px] text-slate-400">{filtered.length} برنامج متاح</p>
              )}
            </div>
          </div>

          {/* search */}
          <div className="mr-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5"
            style={{ minWidth: 200 }}>
            <IcoSearch size={13}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن برنامج..."
              className="flex-1 bg-transparent outline-none text-[12px] text-slate-700 placeholder-slate-400"
              dir="rtl"
            />
          </div>
        </div>

        {/* content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[14px] text-slate-500 mb-3">{error}</p>
            <button onClick={() => { setLoading(true); setError(""); }}
              className="px-5 py-2 rounded-xl text-[12px] font-bold text-white"
              style={{ background: "#31AFEA" }}>إعادة المحاولة</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(49,175,234,0.08)" }}>
              <IcoSearch size={28}/>
            </div>
            <p className="text-[15px] font-bold text-slate-700 mb-1">لا توجد نتائج</p>
            <p className="text-[12px] text-slate-400">جرّب كلمة بحث أخرى</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => (
              <SuggestedCard key={p.id} p={p} onView={onViewProgram}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
