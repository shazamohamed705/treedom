import { useState, useEffect } from "react";
import {
  fetchMyProgramDetail,
  fetchMyEnrollmentDetail,
  addMyFavourite,
  removeMyFavourite,
} from "../../services/api";
import { useFavStore, setFav, seedFavs } from "../../services/favourites";
import { getUser } from "../../services/auth";

// ── sub-components ────────────────────────────────────────────────────────────
import UserProgramSessionPage from "../UserProgramSessionPage";
import { CourseSideNav } from "../UserProgramSessionPage/EnrolledClassroom";
import CurriculumRow    from "../UserProgramSessionPage/CurriculumRow";
import RelatedCard      from "../UserProgramSessionPage/RelatedCard";
import ReviewsTab       from "../UserProgramSessionPage/ReviewsTab";
import TasksTab        from "../UserProgramSessionPage/TasksTab";
import RefundPolicy     from "../UserProgramSessionPage/RefundPolicy";
import ResultModal      from "../UserProgramSessionPage/ResultModal";
import EnrollModal      from "../UserProgramSessionPage/EnrollModal";
import EnrollingOverlay from "../UserProgramSessionPage/EnrollingOverlay";

// ── icons ─────────────────────────────────────────────────────────────────────
import {
  IcoChevL, IcoStar, IcoPlay, IcoClock,
  IcoUsers, IcoHeart, IcoCheck, IcoCalendar, IcoFile,
} from "../UserProgramSessionPage/icons";

// ── shared constants ──────────────────────────────────────────────────────────
import { THUMB_BG, SarIcon, fmtDate } from "../UserProgramSessionPage/constants.jsx";

// ── mock data ─────────────────────────────────────────────────────────────────
import { MOCK_VIEW_PROGRAM as MOCK } from "../UserProgramSessionPage/mockData";
import { previewSessionVideo, visibleSessionVideo } from "../UserProgramSessionPage/sessionHelpers";

// ── main page ─────────────────────────────────────────────────────────────────
export default function UserProgramViewPage({ program, programId, onBack, onEnroll, onGoPayments }) {
  const [apiProgram, setApiProgram] = useState(null);
  const [loading,    setLoading]    = useState(!!programId);
  const [showSessions,       setShowSessions]       = useState(!!(program?.autoOpenSessions));
  const [openSessionId,      setOpenSessionId]      = useState(null);
  const [lessonNavOpen,      setLessonNavOpen]      = useState(false);
  const [showEnroll,         setShowEnroll]         = useState(false);
  const [enrolled,           setEnrolled]           = useState(false);
  const [wishlisted,         setWishlisted]         = useState(false);
  const [favBusy,            setFavBusy]            = useState(false);
  const [enrolling,          setEnrolling]          = useState(false); // eslint-disable-line no-unused-vars
  const [resultMsg,          setResultMsg]          = useState(null);
  const [activeTab,          setActiveTab]          = useState("about");
  const [enrollmentSessions, setEnrollmentSessions] = useState([]);

  // derive user type
  const userType = (() => {
    const u = getUser();
    const t = u?.type ?? u?.role ?? null;
    if (t === "employee") return "employee";
    if (t === "staff")    return "staff";
    return "user";
  })();
  const isEmployee = userType === "employee" || userType === "staff";

  // ── fetch program detail ──────────────────────────────────────────────────
  useEffect(() => {
    if (!programId) return;
    fetchMyProgramDetail(programId)
      .then(res => {
        const d = res?.data ?? {};

        // trainer name — API might return null
        const trainerName = d.trainer?.name ?? null;

        // session_type — null | string | { value, text }
        const sessionTypeText =
          d.session_type == null       ? "" :
          typeof d.session_type === "object" ? (d.session_type?.text ?? "") :
          String(d.session_type);

        // status text — { value, text } or plain
        const statusText =
          typeof d.activity_status === "object"
            ? (d.activity_status?.text ?? "")
            : (d.activity_status ?? "");

        setApiProgram({
          id:               d.id,
          title:            d.name ?? "—",
          category:         d.category?.name ?? "—",
          rating:           d.rating ?? 0,
          reviews:          0,
          price:            parseFloat(d.price_amount) || 0,
          oldPrice:         null,
          sessions:         d.sessions_count ?? 0,
          modulesTotal:     d.sessions_count ?? 0,
          modulesCompleted: d.completed_sessions_count ?? 0,
          hours:            `${parseFloat(d.hours_count) || 0}h`,
          trainer:          trainerName ?? "—",
          trainerOrg:       d.provider?.name ?? "—",
          trainerAvatar:    trainerName ? trainerName[0] : "م",
          trainerImg:       d.trainer?.image ?? null,
          enrolled:         d.trainees_count ?? 0,
          startDate:        d.start_date ?? "",
          endDate:          d.end_date ?? "",
          tags:             (d.keywords ?? []).map(k => typeof k === "object" ? k.name : k),
          description:      d.description ?? "",
          // keyPoints = checklist items marked done
          keyPoints:        (d.checklist ?? []).filter(c => c.done).map(c => c.label),
          // full checklist for display
          checklist:        d.checklist ?? [],
          curriculum:       (d.sessions ?? []).map((s, i) => {
            const delivery = s.delivery_mode ?? s.type?.delivery_mode ?? d.session_type?.delivery_mode ?? null;
            const type     = s.type ?? d.session_type ?? null;
            const rawVideo = previewSessionVideo(s);
            const sessionForVideo = {
              ...s,
              delivery_mode: delivery,
              type,
              video_url: rawVideo,
              videoUrl:  rawVideo,
            };
            return {
            num:      i + 1,
            id:       s.id,
            title:    s.title ?? `جلسة ${i + 1}`,
            duration: `${s.duration_minutes ?? 0}m`,
            duration_minutes: s.duration_minutes ?? 0,
            date:     s.date ?? "",
            time:     s.starts_at ?? "",
            starts_at: s.starts_at ?? "",
            ends_at:  s.ends_at ?? "",
            timeTo:   s.ends_at ?? "",
            type,
            delivery_mode: delivery,
            location: s.location ?? null,
            url:      s.meeting_url ?? null,
            is_completed: s.is_completed ?? false,
            can_check_in: s.can_check_in,
            is_live: s.is_live ?? false,
            has_ended: s.has_ended ?? s.timing?.has_ended ?? false,
            actual_ended_at: s.actual_ended_at ?? s.timing?.actual_ended_at ?? null,
            timing: s.timing ?? null,
            // raw URL for outside preview; gated URL for actual watch
            video_url: rawVideo,
            previewVideoUrl: rawVideo,
            videoUrl: visibleSessionVideo(sessionForVideo),
            attachments: s.attachments ?? s.files ?? s.attachment ?? [],
            files: s.files ?? s.attachments ?? [],
            attachments_count: s.attachments_count ?? s.files_count,
            coach:    s.coach?.name  ?? null,
            coachImg: s.coach?.image ?? null,
          };
          }),
          tools:         [],
          related:       d.related ?? [],
          isEnrolled:    d.is_enrolled ?? false,
          isFavourite:   d.is_favourite ?? false,
          status:        statusText,
          sessionType:   sessionTypeText,
          duration:      d.duration_weeks ?? 0,
          capacity:      d.max_capacity ?? 0,
          capacityLabel: d.capacity_label ?? "",
          readiness:     d.readiness ?? null,
          progress:      d.progress ?? null,
        });
        if (d.is_favourite) seedFavs([programId]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId]);

  // sync enrolled/wishlisted from API response
  useEffect(() => {
    if (!apiProgram) return;
    if (apiProgram.isEnrolled)  setEnrolled(true);
    if (apiProgram.isFavourite) setWishlisted(true);
  }, [apiProgram]);

  // p is null while loading when programId is provided
  const p       = apiProgram ?? ((program && program.title) ? program : (programId ? null : MOCK));
  const realPid = programId ?? p?.programId ?? p?.id;

  const favStore  = useFavStore();
  const favActive = wishlisted || favStore.has(String(realPid));

  // derived values — all safe even when p is null (used only after guards below)
  const modulesTotal     = p?.modulesTotal     ?? p?.sessions ?? 5;
  const modulesCompleted = p?.modulesCompleted ?? 0;
  const progressPct      = modulesTotal > 0 ? (modulesCompleted / modulesTotal) * 100 : 0;
  const curriculum       = p?.curriculum ?? [];
  const tags             = p?.tags ?? [];
  const tools            = p?.tools ?? [];
  const related          = p?.related ?? [];
  const firstVideoSession = curriculum.find(s => previewSessionVideo(s)) ?? null;
  const firstVideoPreview = previewSessionVideo(firstVideoSession);
  const isEnrolledNow     = enrolled || Boolean(p?.isEnrolled);

  const openClassroom = (sessionId) => {
    setOpenSessionId(sessionId ?? null);
    setShowSessions(true);
  };

  const handlePlayFirst = () => {
    if (isEnrolledNow) {
      openClassroom(firstVideoSession?.id ?? null);
      return;
    }
    setResultMsg({
      ok: false,
      title: "غير مشترك",
      message: "يجب الاشتراك في البرنامج أولاً لمشاهدة فيديو الجلسة.",
    });
  };

  // ── favourite toggle ──────────────────────────────────────────────────────
  const toggleFav = () => {
    const pidNum = Number(realPid ?? p?.id ?? p?.programId);
    if (!Number.isFinite(pidNum) || pidNum <= 0) return;
    if (!favActive) {
      setWishlisted(true);
      setFav(String(pidNum), true);
      setFavBusy(true);
      addMyFavourite(pidNum)
        .catch(err => {
          setWishlisted(false);
          setFav(String(pidNum), false);
          setResultMsg({ ok: false, message: err?.message ?? "تعذر إضافة البرنامج إلى المفضلة." });
        })
        .finally(() => setFavBusy(false));
      return;
    }
    setWishlisted(false);
    setFav(String(pidNum), false);
    setFavBusy(true);
    removeMyFavourite(pidNum)
      .catch(err => {
        setWishlisted(true);
        setFav(String(pidNum), true);
        setResultMsg({ ok: false, message: err?.message ?? "تعذر إزالة البرنامج من المفضلة." });
      })
      .finally(() => setFavBusy(false));
  };

  // ── EnrollModal success callback ──────────────────────────────────────────
  const handleEnrollSuccess = (res) => {
    if (res?.company) {
      setResultMsg({ ok: true, message: "تم إرسال طلب التمويل إلى شركتك بنجاح." });
      return;
    }
    setEnrolled(true);
    onEnroll?.(p);
    setResultMsg({ ok: true, message: res?.message ?? "تم الاشتراك في البرنامج بنجاح." });
  };

  // ── loading skeleton — shown while API call is in flight ──────────────────
  if (loading || !p) {
    return (
      <div className="flex-1 overflow-y-auto bg-white min-h-0 p-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded w-40" />
          <div className="h-10 bg-slate-100 rounded-xl w-full sm:max-w-md" />
          <div className="flex flex-col lg:flex-row gap-6 mt-4">
            <div className="w-full lg:w-72 shrink-0 space-y-3">
              <div className="h-5 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-32 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="h-48 bg-slate-100 rounded-2xl" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
              <div className="h-4 bg-slate-100 rounded w-4/6" />
              <div className="h-4 bg-slate-100 rounded w-3/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── sessions view (p guaranteed non-null after this point) ────────────────
  if (showSessions) {
    return (
      <UserProgramSessionPage
        program={{
          ...p,
          isEnrolled: enrolled || p.isEnrolled,
          curriculum: enrollmentSessions.length > 0 ? enrollmentSessions : p.curriculum,
        }}
        initialSessionId={openSessionId}
        onBack={() => { setShowSessions(false); setOpenSessionId(null); }}
        onEnroll={(prog) => { setEnrolled(true); onEnroll?.(prog); setShowSessions(false); }}
      />
    );
  }

  // ── main view ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="ltr">
        <div dir="rtl">

          {/* breadcrumb */}
          <div className="flex items-center gap-2 px-3 sm:px-6 py-3 border-b border-slate-100 overflow-hidden" dir="rtl">
            <button onClick={onBack}
              className="text-[12px] font-semibold hover:underline transition shrink-0"
              style={{ color: "#31AFEA" }}>
              تفاصيل البرنامج
            </button>
            <IcoChevL />
            <button onClick={() => onGoPayments ? onGoPayments() : onBack?.()} className="text-[12px] text-slate-500 hover:underline truncate">
              المدفوعات
            </button>
          </div>

          {/* main layout */}
          <div className="flex flex-col lg:flex-row gap-0" dir="ltr">

            {isEnrolledNow && (
              <div className="hidden md:block w-[300px] lg:w-[320px] shrink-0 sticky top-0 self-start overflow-hidden border-r ms-3 lg:ms-4" style={{ height: "calc(100vh - 96px)", borderColor: "#EEF1F2", background: "#FBFCFC" }}>
                <CourseSideNav
                  title={p.title}
                  category={p.category && p.category !== "—" ? p.category : "محتوى البرنامج"}
                  lessons={curriculum}
                  activeId={openSessionId}
                  onSelect={(s) => openClassroom(s.id)}
                />
              </div>
            )}

            {isEnrolledNow && lessonNavOpen && (
              <div className="md:hidden fixed inset-0 z-40 flex">
                <div className="h-full overflow-hidden" style={{ width: 320, background: "#FBFCFC", borderLeft: "1px solid #EEF1F2" }}>
                  <CourseSideNav
                    title={p.title}
                    category={p.category && p.category !== "—" ? p.category : "محتوى البرنامج"}
                    lessons={curriculum}
                    activeId={openSessionId}
                    onSelect={(s) => { openClassroom(s.id); setLessonNavOpen(false); }}
                  />
                </div>
                <button type="button" className="flex-1 bg-black/30" onClick={() => setLessonNavOpen(false)} aria-label="إغلاق" />
              </div>
            )}

            {/* ── sidebar ── */}
            <div className={`w-full shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 p-3 sm:p-4 lg:sticky lg:top-0 lg:self-start ${isEnrolledNow ? "md:hidden" : "lg:w-72"}`} dir="rtl">

              <h2 className="text-[13px] font-extrabold text-slate-900 leading-snug mb-3 text-right">
                {p.title}
              </h2>

              {/* فيديو أول جلسة — للمشترك فقط */}
              {isEnrolledNow && firstVideoSession && firstVideoPreview && (
                <button
                  type="button"
                  onClick={handlePlayFirst}
                  className="relative w-full rounded-xl overflow-hidden mb-3 text-right"
                  style={{ height: 112, background: THUMB_BG }}
                >
                  <video
                    src={firstVideoPreview}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    preload="metadata"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.28)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.9)" }}>
                      <IcoPlay />
                    </div>
                  </div>
                  <span className="absolute bottom-1.5 right-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(0,0,0,0.55)" }}>
                    الجلسة {firstVideoSession.num}
                  </span>
                </button>
              )}

              {/* trainer */}
              <div className="flex items-center gap-2 mb-3" dir="rtl">
                {p.trainerImg ? (
                  <img src={p.trainerImg} alt={p.trainerAvatar}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                  />
                ) : null}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: "#31AFEA", display: p.trainerImg ? "none" : "flex" }}>
                  {p.trainerAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 truncate">
                    {(p.trainer && p.trainer !== "—")
                      ? (typeof p.trainer === "object" ? p.trainer?.name : p.trainer)
                      : p.trainerOrg}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{p.trainerOrg}</p>
                </div>
              </div>

              {/* rating + meta */}
              <div className="flex items-center gap-3 mb-3 flex-wrap" dir="rtl">
                <div className="flex items-center gap-1">
                  <IcoStar />
                  <span className="text-[12px] font-bold text-amber-500">{p.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <IcoUsers />
                  <span className="text-[11px] text-slate-500">{p.enrolled} متدرب</span>
                </div>
                <div className="flex items-center gap-1">
                  <IcoFile />
                  <span className="text-[11px] text-slate-500">{modulesTotal} جلسة</span>
                </div>
                <div className="flex items-center gap-1">
                  <IcoClock />
                  <span className="text-[11px] text-slate-500">{p.hours}</span>
                </div>
                {p.status && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#e8f5e9", color: "#16a34a" }}>
                    {p.status}
                  </span>
                )}
              </div>

              {isEnrolledNow ? (
                <button type="button" onClick={() => setLessonNavOpen(true)} className="md:hidden w-full mb-3 text-[11px] font-semibold py-2 rounded-md border" style={{ borderColor: "#EEF1F2", color: "#07577F" }}>
                  جلسات البرنامج
                </button>
              ) : (
              <div className="mb-3 border border-slate-200 rounded-xl p-3" dir="rtl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-extrabold text-slate-800">{modulesTotal} Module</span>
                  <span className="text-[11px] text-slate-400">{modulesCompleted}/{modulesTotal} مكتمل</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 mb-3">
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: `${progressPct}%`, background: "#31AFEA" }} />
                </div>
                <div className="divide-y divide-slate-100">
                  {curriculum.length > 0 ? curriculum.map(item => (
                    <div key={item.num} className="flex items-center justify-between py-2 text-right">
                      <span className="text-[11px] text-slate-400">{item.duration}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[12px] text-slate-700 truncate">{item.title}</span>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
                          style={{ background: "#EBF7FF", color: "#31AFEA" }}>
                          {item.num}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-[11px] text-slate-400 py-3">لا توجد جلسات</p>
                  )}
                </div>
              </div>
              )}

              {/* dates */}
              <div className="mb-3 border border-slate-200 rounded-xl px-3 py-3" dir="rtl">
                <p className="text-[12px] font-extrabold text-center mb-2" style={{ color: "#024677" }}>
                  مواعيد البرنامج
                </p>
                {p.startDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-1">
                    <IcoCalendar />
                    <span className="text-slate-400">البداية:</span>
                    <span>{fmtDate(p.startDate) || p.startDate}</span>
                  </div>
                )}
                {p.endDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-1">
                    <IcoCalendar />
                    <span className="text-slate-400">النهاية:</span>
                    <span>{fmtDate(p.endDate) || p.endDate}</span>
                  </div>
                )}
                {p.duration > 0 && (
                  <p className="text-[10px] text-center mt-1" style={{ color: "#31AFEA" }}>
                    المدة: {p.duration} أسبوع
                  </p>
                )}
                {p.sessionType && (
                  <p className="text-[10px] font-bold text-center mt-1" style={{ color: "#024677" }}>
                    {p.sessionType}
                  </p>
                )}
              </div>

              {/* price */}
              <div className="flex items-baseline gap-2 justify-center mb-3" dir="rtl">
                {p.oldPrice && (
                  <span className="text-[12px] text-slate-400 line-through">
                    <SarIcon /> {p.oldPrice}
                  </span>
                )}
                <span className="text-[22px] sm:text-[26px] font-extrabold leading-none flex items-center gap-1"
                  style={{ color: "#024677" }}>
                  <SarIcon /> {p.price}
                </span>
              </div>

              {/* enroll button */}
              <button
                onClick={() => { if (!enrolled) setShowEnroll(true); }}
                className="w-full py-3 rounded-xl text-[13px] font-extrabold text-white hover:opacity-90 transition mb-2"
                style={{ background: enrolled ? "#22c55e" : "#31AFEA" }}>
                {enrolled ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <IcoCheck /> تم التسجيل
                  </span>
                ) : "سجل الآن"}
              </button>

              {/* heart + company funding */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={toggleFav}
                  className="flex items-center justify-center w-10 h-10 rounded-xl border transition shrink-0"
                  style={{
                    borderColor: favActive ? "#ef4444" : "#e2e8f0",
                    color:       favActive ? "#ef4444" : "#64748b",
                    background:  favActive ? "#fef2f2" : "#fff",
                    opacity:     favBusy ? 0.6 : 1,
                    cursor:      "pointer",
                  }}>
                  <IcoHeart filled={favActive} />
                </button>
                {isEmployee && (
                  <button
                    onClick={() => setShowEnroll(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition">
                    اطلب من شركتك تمويله
                  </button>
                )}
              </div>

              <RefundPolicy />
            </div>

            {/* ── main content ── */}
            <div className="flex-1 min-w-0 px-3 sm:px-6 py-4 sm:py-5 space-y-5">

              {isEnrolledNow && (
                <div className="hidden md:flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2" dir="rtl">
                  <span className="text-[12px] font-bold" style={{ color: "#16A34A" }}>تم التسجيل</span>
                  <span className="text-[11px] text-slate-500 truncate">{fmtDate(p.startDate) || p.startDate}{p.endDate ? ` — ${fmtDate(p.endDate) || p.endDate}` : ""}</span>
                  <span className="text-[13px] font-extrabold shrink-0 flex items-center gap-1" style={{ color: "#024677" }}><SarIcon /> {p.price}</span>
                  <button type="button" onClick={toggleFav} className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0" style={{ borderColor: favActive ? "#ef4444" : "#e2e8f0", color: favActive ? "#ef4444" : "#64748b" }}>
                    <IcoHeart filled={favActive} />
                  </button>
                </div>
              )}
              {isEnrolledNow && (
                <div className="hidden md:block">
                  <RefundPolicy />
                </div>
              )}

              {/* فيديو أول جلسة — للمشترك فقط */}
              {isEnrolledNow && firstVideoSession && firstVideoPreview && (
                <button
                  type="button"
                  onClick={handlePlayFirst}
                  className="relative w-full rounded-2xl overflow-hidden text-right"
                  style={{ aspectRatio: "16/7.5", background: THUMB_BG }}
                >
                  <video
                    src={firstVideoPreview}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    preload="metadata"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                    style={{ background: "rgba(0,0,0,0.28)" }}>
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition">
                      <IcoPlay />
                    </div>
                    <span className="text-[12px] font-bold text-white drop-shadow">
                      الجلسة {firstVideoSession.num}: {firstVideoSession.title}
                    </span>
                  </div>
                </button>
              )}

              {/* tabs */}
              <div className="flex items-center border-b border-slate-200 -mx-3 sm:-mx-6 px-3 sm:px-6 mb-2 overflow-x-auto" dir="rtl"
                style={{ scrollbarWidth: "none" }}>
                {[
                  { key: "about",    label: "عن البرنامج" },
                  { key: "sessions", label: "الجلسات"     },
                  { key: "tasks",    label: "المهام"       },
                  { key: "reviews",  label: "التقييمات"   },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => {
                      if (t.key === "sessions") {
                        if (enrolled && p.id && enrollmentSessions.length === 0) {
                          fetchMyEnrollmentDetail(p.id)
                            .then(res => {
                              const d     = res?.data ?? {};
                              const slist = d.sessions ?? [];
                              const prog  = d.session_progress ?? [];
                              setEnrollmentSessions(slist.map((s, i) => {
                                const sp = prog.find(x => x.session_id === s.id) ?? {};
                                const rawVideo = previewSessionVideo(s);
                                return {
                                  id:       s.id,
                                  num:      i + 1,
                                  title:    s.title ?? `جلسة ${i + 1}`,
                                  duration: `${s.duration_minutes ?? 0}m`,
                                  date:     s.date ?? "",
                                  time:     s.starts_at ?? "",
                                  starts_at: s.starts_at ?? "",
                                  ends_at:  s.ends_at ?? "",
                                  timeTo:   s.ends_at ?? "",
                                  duration_minutes: s.duration_minutes ?? 0,
                                  type:     s.type ?? null,
                                  delivery_mode: s.delivery_mode ?? s.type?.delivery_mode ?? null,
                                  location: s.location ?? null,
                                  url:      s.meeting_url ?? null,
                                  is_completed: s.is_completed ?? false,
                                  can_check_in: s.can_check_in,
                                  is_live: s.is_live ?? false,
                                  has_ended: s.has_ended ?? s.timing?.has_ended ?? false,
                                  actual_ended_at: s.actual_ended_at ?? s.timing?.actual_ended_at ?? null,
                                  timing: s.timing ?? null,
                                  video_url: rawVideo,
                                  previewVideoUrl: rawVideo,
                                  videoUrl: visibleSessionVideo({ ...s, video_url: rawVideo, videoUrl: rawVideo }),
                                  // status: 0=لم يبدأ, 2=حاضر(مكتمل), نحول لـ string متوافق مع SessionRow
                                  status: (() => {
                                    const st = sp.status ?? 0;
                                    if (st === 2 || sp.status_label === "حاضر") return "completed";
                                    if (st === 1) return "current";
                                    // لو الجلسة بدأت فعلياً → current
                                    if (s.actual_started_at && !s.actual_ended_at) return "current";
                                    return "upcoming";
                                  })(),
                                  progress: sp.progress_percent ?? 0,
                                  attachments: s.attachments ?? s.files ?? s.attachment ?? [],
                                  files: s.files ?? s.attachments ?? [],
                                  attachments_count: s.attachments_count ?? s.files_count,
                                  coach:    s.coach?.name  ?? "—",
                                  coachImg: s.coach?.image ?? null,
                                };
                              }));
                            })
                            .catch(() => {})
                            .finally(() => { setOpenSessionId(null); setShowSessions(true); });
                        } else {
                          setOpenSessionId(null);
                          setShowSessions(true);
                        }
                        return;
                      }
                      setActiveTab(t.key);
                    }}
                    className="relative py-3 px-3 sm:px-4 text-[12px] sm:text-[13px] font-bold transition whitespace-nowrap shrink-0"
                    style={{ color: activeTab === t.key ? "#31AFEA" : "#64748b" }}>
                    {t.label}
                    {activeTab === t.key && t.key !== "sessions" && (
                      <span className="absolute bottom-0 right-0 left-0 h-0.5 rounded-full"
                        style={{ background: "#31AFEA" }} />
                    )}
                    {t.key === "tasks" && (
                      <span className="mr-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-extrabold text-white"
                        style={{ background: "#31AFEA", verticalAlign: "middle" }}>
                        6
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* reviews tab */}
              {activeTab === "reviews" && (
                <ReviewsTab rating={p.rating ?? 4.8} total={p.reviews ?? 15} />
              )}

              {/* tasks tab */}
              {activeTab === "tasks" && (
                <TasksTab />
              )}

              {/* about tab */}
              {activeTab !== "reviews" && activeTab !== "tasks" && (
                <>
                  {/* tags + title */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {tags.map((tag, i) => (
                        <span key={i}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "#EBF7FF", color: "#31AFEA" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h1 className="text-[16px] sm:text-[20px] font-extrabold text-slate-900 leading-snug mb-2 text-right">
                      {p.title}
                    </h1>
                    <div className="mt-2" dir="rtl">
                      <div className="flex items-center gap-2">
                        {p.trainerImg ? (
                          <img src={p.trainerImg} alt={p.trainerAvatar}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                            onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                          />
                        ) : null}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                          style={{ background: "#31AFEA", display: p.trainerImg ? "none" : "flex" }}>
                          {p.trainerAvatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-slate-800 truncate">
                            {typeof p.trainer === "object" ? p.trainer?.name : (p.trainer !== "—" ? p.trainer : p.trainerOrg)}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{p.trainerOrg}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <IcoStar />
                        <span className="text-[12px] font-bold text-amber-500">{p.rating}</span>
                        <span className="text-[11px] text-slate-400">({p.reviews} تقييم)</span>
                      </div>
                    </div>
                  </div>

                  {/* description */}
                  <div className="rounded-2xl border border-slate-200 px-4 sm:px-5 py-4" dir="rtl"
                    style={{ boxShadow: "0 2px 8px rgba(8,15,52,0.04)" }}>
                    <h2 className="text-[14px] font-extrabold text-slate-800 mb-3">وصف البرنامج</h2>
                    <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-line">
                      {p.description || "لا يوجد وصف متاح"}
                    </p>
                  </div>

                  {/* key points — premium style */}
                  {p.keyPoints?.length > 0 && (
                    <div dir="rtl"
                      className="rounded-2xl bg-white px-5 sm:px-6 py-5"
                      style={{ border: "1px solid #E8EEF4", boxShadow: "0 1px 4px rgba(8,15,52,0.05)" }}>

                      {/* title */}
                      <div className="flex items-center gap-2 mb-4 pb-3"
                        style={{ borderBottom: "1px solid #F0F4F8" }}>
                        <span className="w-1 h-5 rounded-full shrink-0" style={{ background: "#31AFEA" }} />
                        <h2 className="text-[15px] font-extrabold tracking-tight"
                          style={{ color: "#0B2A45" }}>
                          النقاط الرئيسية
                        </h2>
                      </div>

                      {/* items */}
                      <ul className="space-y-0">
                        {p.keyPoints.map((kp, i) => (
                          <li key={i}
                            className="flex items-start gap-3 py-3"
                            style={{
                              borderBottom: i < p.keyPoints.length - 1
                                ? "1px solid #F4F7FA"
                                : "none",
                            }}>
                            {/* check icon */}
                            <span className="shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                              style={{ background: "rgba(49,175,234,0.12)" }}>
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <polyline points="1.5 6 4.5 9 10.5 3"
                                  stroke="#31AFEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                            {/* text */}
                            <span className="text-[13px] leading-relaxed"
                              style={{ color: "#2D4A60" }}>
                              {kp}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* curriculum */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden"
                    style={{ boxShadow: "0 2px 8px rgba(8,15,52,0.04)" }}>
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[12px] text-slate-400">{p.sessions} جلسات</span>
                      <h2 className="text-[14px] font-extrabold text-slate-800">محتوى البرنامج</h2>
                    </div>
                    {curriculum.length > 0 ? curriculum.map((item, i) => (
                      <CurriculumRow
                        key={i}
                        item={item}
                        onOpen={isEnrolledNow ? () => openClassroom(item.id) : undefined}
                      />
                    )) : (
                      <p className="text-center text-[12px] text-slate-400 py-6">لا توجد جلسات متاحة بعد</p>
                    )}
                  </div>

                  {/* tools */}
                  {tools.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 px-4 sm:px-5 py-4"
                      style={{ boxShadow: "0 2px 8px rgba(8,15,52,0.04)" }}>
                      <h2 className="text-[14px] font-extrabold text-slate-800 mb-3 text-right">المحتوى</h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        {tools.map((tool, i) => (
                          <div key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700">
                            <IcoFile />{tool}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* related */}
                  {related.length > 0 && (
                    <div>
                      <h2 className="text-[14px] font-extrabold text-slate-800 mb-3 text-right">دورات ذات صلة</h2>
                      <div className="flex gap-3 overflow-x-auto pb-2" dir="rtl"
                        style={{ scrollbarWidth: "none" }}>
                        {related.map(r => (
                          <RelatedCard key={r.id} p={r} onView={() => {}} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EnrollModal */}
      {showEnroll && (
        <EnrollModal
          program={p}
          onClose={() => setShowEnroll(false)}
          onSuccess={handleEnrollSuccess}
        />
      )}

      {resultMsg && (
        <ResultModal
          ok={resultMsg.ok}
          title={resultMsg.title}
          message={resultMsg.message}
          onClose={() => setResultMsg(null)}
        />
      )}
    </>
  );
}
