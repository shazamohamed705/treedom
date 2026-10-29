import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchTraineePrograms,
  fetchTraineeEnrollments,
  fetchTraineeEnrollmentDetail,
  fetchTraineeSessions,
  fetchTraineeFavourites,
  fetchMyEnrollments,
  fetchMyBrowsePrograms,
  fetchMyProgramDetail,
  fetchMySessionDetail,
  addMyFavourite,
  removeMyFavourite,
  fetchEmployeeEnrollments,
  fetchEmployeeSessions,
  fetchEmployeeFavourites,
  fetchEmployeeEnrollmentDetail,
} from "../../../services/api";
import { useFavStore, setFav, seedFavs } from "../../../services/favourites";
import { getUser } from "../../../services/auth";
import {
  resolveContinueSession,
  resolveProgramId,
  getProgramLocalPercent,
  getLastWatchForProgram,
  getContinueSessionId,
  markAutoplaySession,
} from "../../../services/watchProgress";

import Carousel        from "./Carousel.jsx";
import Sidebar         from "./Sidebar.jsx";
import HeroBanner      from "./HeroBanner.jsx";
import ContinueCard    from "./ContinueCard.jsx";
import DashProgramCard from "./DashProgramCard.jsx";
import { SecHeader }   from "./BadgesRibbons.jsx";
import { THUMB_BG } from "./mockData.js";
import {
  mediaUrl,
  programCover,
  programVideoUrl,
  groupSessionsByProgram,
  sessionsForProgram,
  attachProgramVideos,
  fetchSessionVideoUrl,
} from "../../../services/programMedia";

export default function UserDashboardPage({ role = "user", onViewProgram, onViewSession }) {
  const isEmployee = role === "employee";
  const navigate   = useNavigate();

  // derive userType from stored auth for conditional card rendering
  const userType = (() => {
    const u = getUser();
    const t = u?.type ?? u?.role ?? null;
    if (t === "employee") return "employee";
    if (t === "user" || t === "trainee") return "user";
    if (t === "staff") return "staff";
    // also fall back to the role prop
    if (role === "employee") return "employee";
    return "user";
  })();

  const [upcomingIdx,       setUpcomingIdx]       = useState(0);
  const [continueApi,       setContinueApi]       = useState(null);
  const [myProgramsApi,     setMyProgramsApi]     = useState(null);
  const [suggestedApi,      setSuggestedApi]      = useState(null);
  const [suggestedPrograms, setSuggestedPrograms] = useState([]);
  const [continuePrograms,  setContinuePrograms]  = useState([]);
  const [myPrograms,        setMyPrograms]        = useState([]);
  const [upcomingSessions,  setUpcomingSessions]  = useState([]);

  const favStore = useFavStore();
  const [favBusy, setFavBusy] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);

  // لما فيديو يخلص أو يتحدث → اعمل re-filter للـ continuePrograms
  useEffect(() => {
    const handler = (e) => {
      const { programId, completed } = e.detail ?? {};
      if (!completed) return; // بس لو اكتمل
      const pid = String(programId ?? "");
      if (!pid) return;
      // لو مفيش جلسة ناقصة تانية → اشيل الكارت فوراً
      if (!getContinueSessionId(pid)) {
        setContinuePrograms(prev => prev.filter(p => String(p.programId) !== pid));
      }
    };
    window.addEventListener("treedom:watch", handler);
    return () => window.removeEventListener("treedom:watch", handler);
  }, []);

  // helper: pick endpoint based on role
  const doFetchEnrollments  = (p) => isEmployee ? fetchMyEnrollments(p)         : fetchTraineeEnrollments(p);
  const doFetchSessions     = (p) => isEmployee ? fetchEmployeeSessions(p)      : fetchTraineeSessions(p);
  const doFetchPrograms     = (p) => fetchMyBrowsePrograms(p);
  const doFetchFavourites   = (p) => isEmployee ? fetchEmployeeFavourites(p)    : fetchTraineeFavourites(p);
  const doAddFav            = (id) => addMyFavourite(id);
  const doRemoveFav         = (id) => removeMyFavourite(id);
  const doEnrollmentDetail  = (id) => isEmployee ? fetchEmployeeEnrollmentDetail(id) : fetchTraineeEnrollmentDetail(id);

  // ── استكمال المشاهدة: افتح صفحة تفاصيل البرنامج مع auto-open على الجلسة ──
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
        // روح لصفحة تفاصيل البرنامج مع فتح الجلسة مباشرة
        onViewProgram?.({
          ...prog,
          programId:         pid,
          id:                pid,
          autoOpenSessionId: next.id,
        });
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

  // ── toggle favourite ────────────────────────────────────────────────────────
  const toggleFav = async (p) => {
    if (favBusy) return;
    const pid = Number(p.programId ?? p.id);
    if (!Number.isFinite(pid) || pid <= 0) return;
    const isFav = favStore.has(String(pid));
    setFav(String(pid), !isFav);
    setFavBusy(true);
    try {
      if (!isFav) await doAddFav(pid);
      else        await doRemoveFav(pid);
    } catch {
      setFav(String(pid), isFav);
    } finally {
      setFavBusy(false);
    }
  };

  // ── seed favourites on mount ────────────────────────────────────────────────
  useEffect(() => {
    let on = true;
    doFetchFavourites({ per_page: 100 })
      .then(res => { if (on) seedFavs((res?.data?.favourites ?? []).map(f => f.id)); })
      .catch(() => {});
    return () => { on = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  // ── fetch enrolled + suggested programs ────────────────────────────────────
  useEffect(() => {
    let on = true;
    Promise.all([
      doFetchEnrollments({ per_page: 20 }),
      doFetchSessions({ filter: "all", per_page: 100 }).catch(() => null),
    ])
      .then(([enrollRes, sessRes]) => {
        const list = enrollRes?.data?.programs ?? [];
        if (!list.length) return;

        const rawSessions = sessRes?.data?.sessions ?? sessRes?.data ?? [];
        const byProgram = groupSessionsByProgram(rawSessions);

        const applyEnrolled = (mapped) => {
          if (!on) return;
          setContinuePrograms(mapped.filter(p =>
            Boolean(getContinueSessionId(p.programId))
          ));
          setMyPrograms(mapped);
        };

        const mapped = list.map(e => {
          const p = e.program ?? {};
          const trainerName = p.trainer?.name ?? null;
          const sessionList = sessionsForProgram(e, p, byProgram);
          return {
            id:           `c${e.enrollment_id ?? p.id}`,
            programId:    p.id,
            title:        p.name ?? "—",
            hours:        parseFloat(p.hours_count) || 0,
            sessions:     e.progress?.total ?? p.sessions_count ?? 0,
            trainees:     p.trainees_count ?? 0,
            trainer:      trainerName ?? "—",
            trainerImg:   mediaUrl(p.trainer?.image ?? p.trainer?.profile_image ?? p.trainer?.avatar),
            trainerAvatar: trainerName ? trainerName[0] : (p.provider?.name ? p.provider.name[0] : "م"),
            trainerSub:   p.provider?.name ?? "—",
            org:          p.provider?.name ?? "",
            progress:     Math.max(
              Number(e.progress?.progress_percent ?? p.progress_percent ?? 0) || 0,
              getProgramLocalPercent(p.id)
            ),
            price:        parseFloat(p.price_amount) || 0,
            oldPrice:     null,
            rating:       p.rating ?? 0,
            type:         typeof p.session_type === "object"
                            ? (p.session_type?.text ?? "أونلاين")
                            : (p.session_type ?? "أونلاين"),
            tags:         (p.keywords ?? []).map(k => typeof k === "object" ? k.name : k),
            img:          programCover(p),
            videoUrl:     programVideoUrl(p, sessionList),
            date:         p.start_date ?? "",
            endDate:      p.end_date ?? "",
            duration:     p.duration_weeks ?? 0,
            state:        "enrolled",
            isEnrolled:   true,
            ownership:    "own",
            best:         false,
            enrolledNum:  p.trainees_count ?? 0,
            totalSeats:   p.max_capacity ?? 0,
          };
        });
        applyEnrolled(mapped);
        attachProgramVideos(mapped, fetchMyProgramDetail).then(applyEnrolled);
      })
      .catch(() => {});

    doFetchSessions({ filter: "upcoming", per_page: 10 })
      .then(res => {
        const list = res?.data?.sessions ?? res?.data ?? [];
        const mapped = (Array.isArray(list) ? list : []).map(s => ({
          id:        s.id,
          program:   s.program_name ?? s.program?.name ?? "—",
          title:     typeof s.title === "object" ? (s.title?.ar ?? s.title?.en ?? "—") : (s.title ?? "—"),
          trainer:   s.coach_name ?? s.trainer?.name ?? "—",
          date:      s.date ?? "",
          timeFrom:  s.starts_at ?? "",
          timeTo:    s.ends_at   ?? "",
          time:      s.starts_at ? `${s.starts_at} — ${s.ends_at ?? ""}` : "",
          duration:  s.duration_minutes ?? 0,
          isLive:    s.status === "live" || s.is_live === true,
          programId: s.program_id ?? s.program?.id ?? null,
          videoUrl:  mediaUrl(s.video_url ?? s.videoUrl),
          img:       mediaUrl(s.image),
        }));
        if (on) setUpcomingSessions(mapped);
        Promise.all(mapped.map(async s => {
          if (s.videoUrl) return s;
          try {
            const detail = await fetchMySessionDetail(s.id);
            const d = detail?.data ?? {};
            const fromSession = mediaUrl(d.video_url ?? d.videoUrl);
            if (fromSession) return { ...s, videoUrl: fromSession };
            const pid = d.program_id ?? s.programId;
            if (!pid) return s;
            const fromProgram = await fetchSessionVideoUrl(pid, fetchMyProgramDetail);
            return fromProgram ? { ...s, videoUrl: fromProgram } : s;
          } catch {
            if (!s.programId) return s;
            const fromProgram = await fetchSessionVideoUrl(s.programId, fetchMyProgramDetail);
            return fromProgram ? { ...s, videoUrl: fromProgram } : s;
          }
        })).then(next => { if (on) setUpcomingSessions(next); });
      })
      .catch(() => {});

    doFetchPrograms()
      .then(res => {
        const cats = res?.data?.categories ?? [];
        const all  = cats.flatMap(c => c.programs ?? []);
        if (!all.length) return;
        // seed favourites from suggested programs
        const suggestedFavIds = all
          .filter(p => p.is_favourite)
          .map(p => String(p.id));
        if (suggestedFavIds.length) seedFavs(suggestedFavIds);
        const suggested = all.slice(0, 8).map(p => ({
          id:           p.id,
          title:        p.name ?? "—",
          hours:        parseFloat(p.hours_count) || 0,
          sessions:     p.sessions_count ?? 0,
          duration:     p.duration_weeks ?? 0,
          trainees:     p.trainees_count ?? 0,
          trainer:      p.trainer?.name ?? null,
          trainerImg:   mediaUrl(p.trainer?.image ?? p.trainer?.profile_image ?? p.trainer?.avatar),
          trainerSub:   p.provider?.name ?? "—",
          trainerAvatar: p.trainer?.name ? p.trainer.name[0] : (p.provider?.name ? p.provider.name[0] : "م"),
          date:         p.start_date ?? "",
          enroll:       p.registration_deadline ?? "",
          price:        parseFloat(p.price_amount) || 0,
          oldPrice:     null,
          rating:       p.rating ?? 0,
          type:         typeof p.session_type === "object"
                          ? (p.session_type?.text ?? "أونلاين")
                          : (p.session_type ?? "أونلاين"),
          badges:       [],
          state:        p.activity_status?.value ?? "active",
          enrolledNum:  p.trainees_count ?? 0,
          totalSeats:   p.max_capacity ?? 0,
          best:         false,
          img:          programCover(p),
          videoUrl:     programVideoUrl(p),
          tags:         (p.keywords ?? []).map(k => typeof k === "object" ? k.name : k),
          isEnrolled:   p.is_enrolled ?? false,
        }));
        if (on) setSuggestedPrograms(suggested);
        attachProgramVideos(suggested, fetchMyProgramDetail).then(next => {
          if (on) setSuggestedPrograms(next);
        });
      })
      .catch(() => {});
    return () => { on = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  return (
    <div className="flex-1 flex flex-row-reverse overflow-hidden bg-white" dir="rtl">

      {/* ── sidebar ── */}
      <Sidebar
        isEmployee={isEmployee}
        upcomingIdx={upcomingIdx}
        setUpcomingIdx={setUpcomingIdx}
        user={getUser()}
        upcomingSessions={upcomingSessions}
        avgProgress={
          continuePrograms.length > 0
            ? Math.round(continuePrograms.reduce((s, p) => s + (p.progress ?? 0), 0) / continuePrograms.length)
            : 0
        }
      />

      {/* ── main content ── */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-4 pt-5 pb-3 min-w-0"
        style={{ direction: "ltr", scrollbarGutter: "stable" }}
      >
        <div className="space-y-4" dir="rtl">

          {/* hero */}
          <HeroBanner/>

          {/* استكمال المشاهدة — أول قسم، بنفس شكل برامجي */}
          {continuePrograms.length > 0 && (
            <div>
              <SecHeader
                title="استكمال المشاهدة"
                onNext={() => continueApi?.scrollNext()}
                onPrev={() => continueApi?.scrollPrev()}
                onViewAll={() => navigate("/dashboard/continue-watching")}
              />
              <Carousel onApi={setContinueApi}>
                {continuePrograms.map(p => (
                  <ContinueCard
                    key={p.id}
                    p={p}
                    fav={favStore.has(String(p.programId ?? p.id))}
                    onFav={toggleFav}
                    onView={onViewProgram}
                    onContinue={handleContinue}
                    isLoading={continueLoading === resolveProgramId(p)}
                  />
                ))}
              </Carousel>
            </div>
          )}

          {/* من المشاهدة — نفس الصف القديم، تحت استكمال المشاهدة */}
          {continuePrograms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {continuePrograms.slice(0, 3).map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-200 px-3 py-3 flex items-center gap-2" dir="rtl">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(2,70,119,0.08)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="#024677" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.progress ?? 0}% من المشاهدة
                    </p>
                    <p className="text-[12px] font-bold text-slate-800 mt-0.5 truncate">{p.title}</p>
                  </div>
                  <button
                    onClick={() => onViewProgram?.(p)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition px-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* my programs — hide entirely when empty */}
          {myPrograms.length > 0 && (
            <div>
              <SecHeader
                title="برامجي"
                onNext={() => myProgramsApi?.scrollNext()}
                onPrev={() => myProgramsApi?.scrollPrev()}
                onViewAll={() => navigate("/dashboard/my-enrolled")}
              />
              <Carousel onApi={setMyProgramsApi}>
                {myPrograms.map(p => (
                  <DashProgramCard key={p.id} p={p} onView={onViewProgram} userType={userType}/>
                ))}
              </Carousel>
            </div>
          )}

          {/* suggested — hide when empty */}
          {suggestedPrograms.length > 0 && (
            <div className="pb-4">
              <SecHeader
                title="برامج مقترحة"
                onNext={() => suggestedApi?.scrollNext()}
                onPrev={() => suggestedApi?.scrollPrev()}
                onViewAll={() => navigate("/dashboard/suggested-programs")}
              />
              <Carousel onApi={setSuggestedApi}>
                {suggestedPrograms.map(p => (
                  <DashProgramCard key={p.id} p={p} onView={onViewProgram} showButton/>
                ))}
              </Carousel>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
