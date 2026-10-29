import { useState, useEffect, useCallback } from "react";
import {
  fetchMyEnrollments,
  fetchMyEnrollmentDetail,
  fetchMySessions,
  fetchMyProgramDetail,
  addMyFavourite,
  removeMyFavourite,
  fetchEmployeeEnrollments,
  fetchEmployeeEnrollmentDetail,
  fetchEmployeeSessions,
} from "../../../services/api";
import { getUser } from "../../../services/auth";
import { useFavStore, setFav } from "../../../services/favourites";
import {
  resolveContinueSession,
  resolveProgramId,
  getProgramLocalPercent,
  getLastWatchForProgram,
  getContinueSessionId,
  markAutoplaySession,
} from "../../../services/watchProgress";
import {
  mediaUrl,
  programCover,
  programVideoUrl,
  groupSessionsByProgram,
  sessionsForProgram,
  attachProgramVideos,
} from "../../../services/programMedia";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 13, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoPlay = ({ size = 14 }) => (
  <Ico size={size} fill="white" stroke="white" d={<polygon points="5 3 19 12 5 21 5 3"/>}/>
);
const IcoBack = () => (
  <Ico d={<><polyline points="15 18 9 12 15 6"/></>}/>
);

// ── progress bar ──────────────────────────────────────────────────────────────
function Bar({ value }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: "#14b8a6" }}/>
    </div>
  );
}

// ── tag pill ─────────────────────────────────────────────────────────────────
function Tag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold"
      style={{ background: "rgba(49,175,234,0.13)", color: "#31AFEA" }}>
      {label}
    </span>
  );
}

// ── ContinueCard ─────────────────────────────────────────────────────────────
function ContinueCard({ p, onContinue, onView, isLoading }) {
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
      className="rounded-[16px] bg-white border border-slate-100 flex flex-col relative overflow-hidden cursor-pointer hover:shadow-lg transition"
      style={{ boxShadow: "0 4px 20px rgba(8,15,52,0.07)" }}
      dir="rtl"
    >
      {/* thumbnail */}
      <div className="relative overflow-hidden shrink-0 rounded-xl mx-3 mt-3"
        style={{ height: 140, background: "linear-gradient(135deg,#0a1628 0%,#0f2a4a 50%,#0d3a5c 100%)" }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize: "12px 12px" }}/>
        {p.videoUrl ? (
          <video src={p.videoUrl} className="absolute inset-0 w-full h-full object-cover" preload="metadata" muted playsInline/>
        ) : p.img ? (
          <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 transition">
            <IcoPlay size={15}/>
          </div>
        </div>
        {/* progress overlay bar at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="h-full" style={{ width: `${p.progress ?? 0}%`, background: "#14b8a6" }}/>
        </div>
        {/* fav button */}
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
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-2 flex-1">
        {(p.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.tags.slice(0, 2).map((t, i) => <Tag key={i} label={t}/>)}
          </div>
        )}

        <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">{p.title}</p>

        {/* progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">التقدم في البرنامج</span>
            <span className="text-[10px] font-bold" style={{ color: "#14b8a6" }}>{p.progress ?? 0}%</span>
          </div>
          <Bar value={p.progress ?? 0}/>
        </div>

        {/* sessions count */}
        {p.sessions > 0 && (
          <p className="text-[10px] text-slate-500">
            {p.completedSessions ?? 0}/{p.sessions} جلسة مكتملة
          </p>
        )}

        {/* trainer */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-2 mt-auto">
          {p.trainerImg ? (
            <img src={p.trainerImg} alt="" className="w-7 h-7 rounded-full object-cover shrink-0"/>
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background: "#31AFEA" }}>
              {p.trainerAvatar ?? "م"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 truncate">
              {typeof p.trainer === "object" ? p.trainer?.name : (p.trainer || "—")}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{p.trainerSub ?? ""}</p>
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!isLoading) onContinue?.(p); }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition disabled:opacity-60 mt-1"
          style={{ background: "#14b8a6" }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              جارٍ التحميل
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              استكمل المشاهدة
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-[16px] bg-white border border-slate-100 overflow-hidden animate-pulse">
      <div className="mx-3 mt-3 rounded-xl" style={{ height: 140, background: "#EEF2F6" }}/>
      <div className="px-3 pt-3 pb-3 space-y-2.5">
        <div className="h-3 rounded w-1/3" style={{ background: "#EEF2F6" }}/>
        <div className="h-4 rounded w-4/5" style={{ background: "#EEF2F6" }}/>
        <div className="h-3 rounded w-full" style={{ background: "#EEF2F6" }}/>
        <div className="h-1.5 rounded-full" style={{ background: "#EEF2F6" }}/>
        <div className="h-10 rounded-xl mt-2" style={{ background: "#EEF2F6" }}/>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ContinueWatchingPage({ role = "user", onViewProgram, onBack }) {
  const isEmployee = role === "employee";

  const [programs, setPrograms]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [continueLoading, setContinueLoading] = useState(null);

  const doFetchEnrollments   = (p) => isEmployee ? fetchEmployeeEnrollments(p)       : fetchMyEnrollments(p);
  const doFetchSessions      = (p) => isEmployee ? fetchEmployeeSessions(p)          : fetchMySessions(p);
  const doEnrollmentDetail   = (id) => isEmployee ? fetchEmployeeEnrollmentDetail(id) : fetchMyEnrollmentDetail(id);

  // fetch enrolled programs that have watch progress
  useEffect(() => {
    let on = true;
    Promise.all([
      doFetchEnrollments({ per_page: 100 }),
      doFetchSessions({ filter: "all", per_page: 100 }).catch(() => null),
    ])
      .then(([enrollRes, sessRes]) => {
        const list = enrollRes?.data?.programs ?? [];
        const rawSessions = sessRes?.data?.sessions ?? sessRes?.data ?? [];
        const byProgram = groupSessionsByProgram(rawSessions);

        const mapped = list.map(e => {
          const p = e.program ?? {};
          const trainerName = p.trainer?.name ?? null;
          const sessionList = sessionsForProgram(e, p, byProgram);
          return {
            id:            `c${e.enrollment_id ?? p.id}`,
            programId:     p.id,
            title:         p.name ?? "—",
            sessions:      e.progress?.total ?? p.sessions_count ?? 0,
            completedSessions: e.progress?.completed ?? null,
            hours:         parseFloat(p.hours_count) || 0,
            duration:      p.duration_weeks ?? 0,
            trainer:       trainerName ?? "—",
            trainerImg:    mediaUrl(p.trainer?.image ?? p.trainer?.profile_image ?? p.trainer?.avatar),
            trainerAvatar: trainerName ? trainerName[0] : (p.provider?.name ? p.provider.name[0] : "م"),
            trainerSub:    p.provider?.name ?? "—",
            progress:      Math.max(
              Number(e.progress?.progress_percent ?? p.progress_percent ?? 0) || 0,
              getProgramLocalPercent(p.id)
            ),
            tags:          (p.keywords ?? []).map(k => typeof k === "object" ? k.name : k),
            img:           programCover(p),
            videoUrl:      programVideoUrl(p, sessionList),
            isEnrolled:    true,
          };
        });

        // show only programs that have a genuinely incomplete local session
        const filtered = mapped.filter(p =>
          Boolean(getContinueSessionId(p.programId))
        );

        if (on) { setPrograms(filtered); setLoading(false); }

        // enrich with video URLs asynchronously
        attachProgramVideos(filtered, fetchMyProgramDetail).then(next => {
          if (on) setPrograms(next);
        });
      })
      .catch(() => { if (on) setLoading(false); });

    return () => { on = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  const handleContinue = useCallback(async (prog) => {
    const pid = resolveProgramId(prog);
    if (!pid) return;
    setContinueLoading(pid);
    try {
      const next = await resolveContinueSession(pid, {
        fetchEnrollmentDetail: doEnrollmentDetail,
        fetchSessions: doFetchSessions,
      });
      if (next?.id) {
        markAutoplaySession(next.id);
        onViewProgram?.({ ...prog, programId: pid, id: pid, autoOpenSessionId: next.id });
      } else {
        onViewProgram?.(prog);
      }
    } catch {
      onViewProgram?.(prog);
    } finally {
      setContinueLoading(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onViewProgram, isEmployee]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-5">

        {/* header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#14b8a6] hover:text-[#14b8a6] transition"
          >
            <IcoBack/>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.1)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold text-slate-800">استكمال المشاهدة</h1>
              {!loading && (
                <p className="text-[11px] text-slate-400">{programs.length} برنامج قيد التقدم</p>
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
              style={{ background: "rgba(20,184,166,0.08)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <p className="text-[15px] font-bold text-slate-700 mb-1">لا يوجد برامج قيد المشاهدة</p>
            <p className="text-[12px] text-slate-400">ابدأ مشاهدة أي برنامج وسيظهر هنا</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {programs.map(p => (
              <ContinueCard
                key={p.id}
                p={p}
                onView={onViewProgram}
                onContinue={handleContinue}
                isLoading={continueLoading === resolveProgramId(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
