import { useState, useEffect } from "react";
import {
  fetchMyEnrollments,
  fetchMyProgramDetail,
  fetchMySessions,
  fetchEmployeeEnrollments,
  fetchEmployeeSessions,
  addMyFavourite,
  removeMyFavourite,
} from "../../services/api";
import { getUser } from "../../services/auth";
import { useFavStore, setFav, seedFavs } from "../../services/favourites";
import { getProgramLocalPercent } from "../../services/watchProgress";
import {
  mediaUrl,
  programCover,
  programVideoUrl,
  groupSessionsByProgram,
  sessionsForProgram,
  attachProgramVideos,
} from "../../services/programMedia";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 13, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoPlay  = ({ size = 14 }) => <Ico size={size} fill="white" stroke="white" d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const IcoStar  = () => <Ico size={11} fill="#f59e0b" stroke="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const IcoBack  = () => <Ico d={<polyline points="15 18 9 12 15 6"/>}/>;

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

function Bar({ value }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: "#14b8a6" }}/>
    </div>
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
function EnrolledCard({ p, onView }) {
  const favStore = useFavStore();
  const pid      = String(p.programId ?? p.id ?? "");
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
        {/* progress bar at bottom of thumbnail */}
        {(p.progress ?? 0) > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="h-full" style={{ width: `${p.progress}%`, background: "#14b8a6" }}/>
          </div>
        )}
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

        {/* enrolled badge */}
        <p className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#14b8a6" }}>
          ✓ أنت مسجّل في هذا البرنامج
        </p>

        {/* progress bar */}
        {(p.progress ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-slate-400">التقدم</span>
              <span className="text-[9px] font-bold" style={{ color: "#14b8a6" }}>{p.progress}%</span>
            </div>
            <Bar value={p.progress}/>
          </div>
        )}

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
        <div className="h-1.5 rounded-full mt-1" style={{ background: "#EEF2F6" }}/>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function MyEnrolledProgramsPage({ role = "user", onViewProgram, onBack }) {
  const isEmployee = role === "employee";
  const userType   = (() => {
    const u = getUser();
    const t = u?.type ?? u?.role ?? null;
    if (t === "employee") return "employee";
    return "user";
  })();

  const [programs, setPrograms] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const doFetch   = (p) => isEmployee ? fetchEmployeeEnrollments(p) : fetchMyEnrollments(p);
  const doSessions = (p) => isEmployee ? fetchEmployeeSessions(p)   : fetchMySessions(p);

  useEffect(() => {
    let on = true;
    Promise.all([
      doFetch({ per_page: 100 }),
      doSessions({ filter: "all", per_page: 100 }).catch(() => null),
    ])
      .then(([enrollRes, sessRes]) => {
        const list = enrollRes?.data?.programs ?? [];
        // seed favs
        const favIds = list.filter(e => e.program?.is_favourite).map(e => String(e.program?.id ?? "")).filter(Boolean);
        if (favIds.length) seedFavs(favIds);

        const rawSessions = sessRes?.data?.sessions ?? sessRes?.data ?? [];
        const byProgram   = groupSessionsByProgram(rawSessions);

        const mapped = list.map(e => {
          const p = e.program ?? {};
          const trainerName = p.trainer?.name ?? null;
          const sessionList = sessionsForProgram(e, p, byProgram);
          return {
            id:            `e${e.enrollment_id ?? p.id}`,
            programId:     p.id,
            title:         p.name ?? "—",
            sessions:      e.progress?.total ?? p.sessions_count ?? 0,
            duration:      p.duration_weeks ?? 0,
            price:         parseFloat(p.price_amount) || 0,
            rating:        p.rating ?? 0,
            type:          typeof p.session_type === "object" ? (p.session_type?.text ?? "أونلاين") : (p.session_type ?? "أونلاين"),
            tags:          (p.keywords ?? []).map(k => typeof k === "object" ? k.name : k),
            trainer:       trainerName ?? "—",
            trainerAvatar: trainerName ? trainerName[0] : (p.provider?.name ? p.provider.name[0] : "م"),
            trainerImg:    mediaUrl(p.trainer?.image ?? p.trainer?.profile_image ?? p.trainer?.avatar),
            trainerSub:    p.provider?.name ?? "—",
            progress:      Math.max(
              Number(e.progress?.progress_percent ?? p.progress_percent ?? 0) || 0,
              getProgramLocalPercent(p.id)
            ),
            img:     programCover(p),
            videoUrl: programVideoUrl(p, sessionList),
          };
        });

        if (on) { setPrograms(mapped); setLoading(false); }
        attachProgramVideos(mapped, fetchMyProgramDetail).then(next => { if (on) setPrograms(next); });
      })
      .catch(() => { if (on) setLoading(false); });

    return () => { on = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-5">

        {/* header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#31AFEA] hover:text-[#31AFEA] transition">
            <IcoBack/>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(49,175,234,0.1)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#31AFEA" strokeWidth="2" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold text-slate-800">برامجي</h1>
              {!loading && (
                <p className="text-[11px] text-slate-400">{programs.length} برنامج مسجّل</p>
              )}
            </div>
          </div>
        </div>

        {/* content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(49,175,234,0.08)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#31AFEA" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <p className="text-[15px] font-bold text-slate-700 mb-1">لم تسجّل في أي برنامج بعد</p>
            <p className="text-[12px] text-slate-400">تصفح البرامج المتاحة وابدأ رحلتك التدريبية</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {programs.map(p => (
              <EnrolledCard key={p.id} p={p} onView={onViewProgram}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
