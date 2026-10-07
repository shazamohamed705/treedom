import { useState, useRef, useEffect } from "react";
import { checkInMySession, rememberSessionCheckIn } from "../../services/api";
import { IcoChevL, IcoStar, IcoUsers, IcoFile, IcoClock, IcoFilter, IcoHeart } from "./icons";
import VideoPlayer   from "./VideoPlayer";
import SessionRow from "./SessionRow";
import EnrolledClassroom from "./EnrolledClassroom";
import { visibleSessionVideo, sessionIsOver, sessionKind } from "./sessionHelpers";
import JoinSessionModal from "../JoinSessionModal";
import TrainerAvatar from "./TrainerAvatar";
import EnrollModal   from "./EnrollModal";
import { MOCK_PROGRAM, MOCK_SESSIONS } from "./mockData";

export default function UserProgramSessionPage({ program, onBack, onEnroll, initialSessionId }) {
  const p       = program ?? MOCK_PROGRAM;
  const rawList = Array.isArray(p?.curriculum) ? p.curriculum : [];

  // normalize كل جلسة — احتفظ بالرابط الخام للمعاينة، والبوابة للمشاهدة
  const curriculum = rawList.map((s, i) => {
    const rawVideo = s.previewVideoUrl ?? s.video_url ?? s.videoUrl ?? null;
    const mapped = {
      id:       s.id       ?? i + 1,
      num:      s.num      ?? i + 1,
      title:    s.title    ?? `جلسة ${i + 1}`,
      desc:     s.desc     ?? s.description ?? "",
      duration: s.duration ?? `${s.duration_minutes ?? 0} دقيقة`,
      duration_minutes: s.duration_minutes ?? 0,
      date:     s.date     ?? s.starts_at?.slice(0, 10) ?? "",
      time:     s.time     ?? s.starts_at  ?? "",
      starts_at: s.starts_at ?? s.time ?? "",
      ends_at:  s.ends_at ?? s.timeTo ?? "",
      timeTo:   s.timeTo ?? s.ends_at ?? "",
      type:     s.type ?? null,
      delivery_mode: s.delivery_mode ?? s.type?.delivery_mode ?? null,
      url:      s.url      ?? s.meeting_url ?? null,
      meeting_url: s.meeting_url ?? null,
      video_url: rawVideo,
      previewVideoUrl: rawVideo,
      is_completed: s.is_completed ?? false,
      is_live: s.is_live ?? false,
      has_ended: s.has_ended ?? s.timing?.has_ended ?? false,
      actual_ended_at: s.actual_ended_at ?? s.timing?.actual_ended_at ?? null,
      timing: s.timing ?? null,
      status:   s.status   ?? "upcoming",
      progress: s.progress ?? 0,
      can_check_in: s.can_check_in,
      coach:    typeof s.coach === "object" ? (s.coach?.name ?? null) : (s.coach ?? null),
      coachImg: s.coachImg ?? (typeof s.coach === "object" ? s.coach?.image : null) ?? null,
      sessionId: s.session_id ?? s.id ?? i + 1,
      attachments: s.attachments ?? s.files ?? s.attachment ?? [],
      files: s.files ?? s.attachments ?? [],
      attachments_count: s.attachments_count ?? s.files_count,
    };
    return { ...mapped, videoUrl: visibleSessionVideo(mapped) };
  });

  const [isEnrolled,      setIsEnrolled]      = useState(() => p?.isEnrolled  ?? false);
  const [typeFilter,      setTypeFilter]      = useState("all");
  const visibleCurriculum = (isEnrolled
    ? curriculum
    : curriculum.map(s => {
        const hadVideo = !!(s.video_url || s.videoUrl || s.previewVideoUrl);
        return {
          ...s,
          videoUrl: null,
          video_url: null,
          previewVideoUrl: null,
          videoLocked: hadVideo,
        };
      })
  ).filter(s => typeFilter === "all" || sessionKind(s) === typeFilter);
  const hasSessions = curriculum.length > 0;
  const TYPE_FILTERS = [
    { key: "all",      label: "الكل" },
    { key: "online",   label: "أونلاين" },
    { key: "offline",  label: "حضوري" },
    { key: "recorded", label: "مسجّل" },
  ];

  const playerRef = useRef(null);
  const [selectedSession, setSelected] = useState(() => {
    if (!(p?.isEnrolled ?? false)) return null;
    if (initialSessionId != null) {
      const hit = curriculum.find(s => String(s.id) === String(initialSessionId) || String(s.sessionId) === String(initialSessionId));
      if (hit) return hit;
    }
    return curriculum.find(s => s.videoUrl) ?? curriculum[0] ?? null;
  });
  const [videoKey, setVideoKey] = useState(0);

  // sync when initialSessionId prop changes (e.g. same component, new continue session)
  useEffect(() => {
    if (initialSessionId == null) return;
    if (!isEnrolled) return;
    const hit = curriculum.find(
      s => String(s.id) === String(initialSessionId) || String(s.sessionId) === String(initialSessionId)
    );
    if (!hit) return;
    setSelected(hit);
    setVideoKey(k => k + 1);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);
  const [wishlisted,      setWishlisted]      = useState(() => p?.isFavourite ?? false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [joinBusy,        setJoinBusy]        = useState(null);
  const [joinMsg,         setJoinMsg]         = useState(null);

  const askEnroll = () => setShowEnrollModal(true);

  // يفتح الفيديو + يعمل scroll للـ player — للمشترك فقط
  const selectSession = (s) => {
    if (!isEnrolled) { askEnroll(); return; }
    const isSame = selectedSession &&
      (String(selectedSession.id) === String(s.id) ||
       String(selectedSession.sessionId) === String(s.sessionId));
    setSelected(s);
    if (!visibleSessionVideo(s)) return;
    // reset الفيديو بس لو جلسة مختلفة — نفس الجلسة ما نعملش remount
    if (!isSame) setVideoKey(k => k + 1);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // إعادة المشاهدة: reset الفيديو من الأول
  const rewatch = (s) => {
    if (!isEnrolled) { askEnroll(); return; }
    setSelected(s);
    setVideoKey(k => k + 1);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const doJoin = async (s) => {
    if (!isEnrolled) { askEnroll(); return; }
    if (!s || joinBusy) return;
    const sid = s.sessionId ?? s.id;
    const fallbackUrl = s.meeting_url || s.url || null;
    setJoinBusy(sid);
    setJoinMsg(null);
    try {
      const res = await checkInMySession(sid);
      rememberSessionCheckIn(sid);
      const meeting = res?.data?.meeting_url ?? fallbackUrl;
      setJoinMsg({
        ok: true,
        text: res?.message ?? "تم تسجيل حضورك بنجاح.",
        meetUrl: meeting || null,
        sessionEnded: sessionIsOver(s),
        session: s,
      });
    } catch (err) {
      const apiMsg = err?.message ?? null;
      const alreadyCheckedIn = apiMsg && (
        apiMsg.includes("مسبقاً") || apiMsg.includes("سبق") || apiMsg.includes("already")
      );
      const sessionNotStarted = apiMsg && (
        apiMsg.includes("لم تبدأ") || apiMsg.includes("انتظر") || apiMsg.includes("not started")
      );
      const checkInClosed = apiMsg && apiMsg.includes("انتهى وقت");

      if (alreadyCheckedIn) {
        rememberSessionCheckIn(sid);
        setJoinMsg({
          ok: true,
          text: apiMsg || "تم تسجيل حضورك مسبقاً.",
          meetUrl: fallbackUrl,
          sessionEnded: sessionIsOver(s),
          session: s,
        });
      } else if (checkInClosed) {
        const over = sessionIsOver(s);
        setJoinMsg({
          ok: false,
          text: apiMsg,
          meetUrl: over ? null : fallbackUrl,
          sessionEnded: over,
          session: { ...s, is_completed: true },
        });
      } else if (sessionNotStarted && fallbackUrl) {
        setJoinMsg({
          ok: true,
          text: "انتظر بدء المدرب.",
          meetUrl: fallbackUrl,
          sessionEnded: false,
          session: s,
        });
      } else {
        setJoinMsg({
          ok: false,
          text: apiMsg ?? "الجلسة غير متاحة حالياً.",
          meetUrl: null,
          session: null,
        });
      }
    } finally {
      setJoinBusy(null);
    }
  };

  return (
    <>
      {showEnrollModal && (
        <EnrollModal
          program={p}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={(res) => {
            setShowEnrollModal(false);
            setIsEnrolled(true);
            onEnroll?.(p, res);
          }}
        />
      )}
      <JoinSessionModal
        joinMsg={joinMsg}
        onClose={() => setJoinMsg(null)}
        onViewRecording={(sess) => {
          const unlocked = visibleSessionVideo(sess);
          if (unlocked) selectSession({ ...sess, videoUrl: unlocked });
        }}
      />
      {isEnrolled ? (
        <EnrolledClassroom
          program={p}
          sessions={visibleCurriculum}
          selected={selectedSession}
          onSelect={selectSession}
          onRewatch={rewatch}
          onBack={onBack}
          videoKey={videoKey}
          playerRef={playerRef}
        />
      ) : (
        <div className="flex-1 overflow-y-auto bg-white min-h-0 flex flex-col" dir="ltr">
        <div className="flex-1 px-0 sm:px-4" dir="rtl">

          {/* breadcrumb */}
          <div className="flex items-center gap-2 px-3 sm:px-6 py-3 border-b border-slate-100" dir="rtl">
            <button onClick={onBack} className="text-[12px] font-semibold hover:underline shrink-0" style={{ color:"#31AFEA" }}>
              تفاصيل البرنامج
            </button>
            <IcoChevL/>
            <button onClick={onBack} className="text-[12px] text-slate-500 hover:underline truncate">جلساتي</button>
          </div>

          {/* video player — مشترك: تشغيل / غير مشترك: قفل ببلور */}
          {isEnrolled && selectedSession ? (
            <div ref={playerRef} className="px-3 sm:px-6 py-4">
              <div className="rounded-2xl overflow-hidden">
                <VideoPlayer
                  key={videoKey}
                  title={selectedSession.title ?? ""}
                  videoUrl={visibleSessionVideo(selectedSession)}
                  sessionId={selectedSession.sessionId ?? selectedSession.id}
                  programId={p.id ?? p.programId}
                />
              </div>
            </div>
          ) : !isEnrolled ? (
            <div className="px-3 sm:px-6 py-4">
              <button
                type="button"
                onClick={askEnroll}
                className="relative w-full rounded-2xl overflow-hidden text-right"
                style={{ aspectRatio: "16/9", background: "#0d1b2e" }}
              >
                {/* طبقة بلور بدون رابط فيديو حقيقي */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 40%, rgba(49,175,234,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(90,234,207,0.25), transparent 50%), #0d1b2e",
                    filter: "blur(18px)",
                    transform: "scale(1.15)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "rgba(8,15,32,0.55)", backdropFilter: "blur(10px)" }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.92)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <p className="text-[13px] font-extrabold text-white drop-shadow">الفيديو مقفول</p>
                  <p className="text-[11px] text-white/80 text-center">اشترك في البرنامج لمشاهدة تسجيلات الجلسات</p>
                  <span
                    className="mt-1 text-[11px] font-bold px-3 py-1.5 rounded-xl text-white"
                    style={{ background: "#31AFEA" }}
                  >
                    اشترك الآن
                  </span>
                </div>
              </button>
            </div>
          ) : null}

          {/* program title */}
          <div className="px-3 sm:px-6 py-4 border-b border-slate-100" dir="rtl">
            <h1 className="text-[14px] sm:text-[15px] font-extrabold text-slate-900 leading-snug mb-1">{p.title}</h1>
            {selectedSession && (
              <p className="text-[12px] text-slate-500">
                الجلسة {selectedSession.num}:{" "}
                {selectedSession.title?.replace(/^الجلسة \d+:\s*/, "")}
              </p>
            )}
          </div>

          {/* trainer + stats */}
          <div className="px-3 sm:px-6 py-3 border-b border-slate-100" dir="rtl">
            <div className="flex items-center gap-2.5 mb-2.5">
              {/* كوتش الجلسة المحددة فقط */}
              {(() => {
                const coachName   = selectedSession?.coach && selectedSession.coach !== "—"
                  ? selectedSession.coach : null;
                const coachImg    = selectedSession?.coachImg ?? null;
                const coachLetter = coachName ? coachName[0] : "م";
                // لو ما في كوتش للجلسة → ما نعرضش شيء
                if (!coachName) return null;
                return (
                  <>
                    <TrainerAvatar img={coachImg} letter={coachLetter} size={36}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{coachName}</p>
                      <p className="text-[11px] text-slate-400 truncate">مدرب الجلسة</p>
                    </div>
                  </>
                );
              })()}
              <div className="flex items-center gap-1 shrink-0">
                <IcoStar/>
                <span className="text-[12px] font-bold text-amber-500">{p.rating}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <IcoUsers/>
                <span className="text-[12px] text-slate-500">{p.students ?? p.enrolled ?? 0} طلاب</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IcoFile/>
                <span className="text-[12px] text-slate-500">{p.sessions ?? visibleCurriculum.length} جلسات</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IcoClock/>
                <span className="text-[12px] text-slate-500">{p.duration ?? p.hours ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* sessions list — directly, no tabs */}
          <div className="px-3 sm:px-4 py-4" dir="rtl">
            {hasSessions ? (
              <>
                <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TYPE_FILTERS.map(f => {
                      const active = typeFilter === f.key;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setTypeFilter(f.key)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition"
                          style={{
                            background: active ? "#024677" : "#fff",
                            color:      active ? "#fff" : "#64748b",
                            borderColor: active ? "#024677" : "#e2e8f0",
                          }}
                        >
                          {f.key === "all" && <IcoFilter/>}
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[13px] font-bold" style={{ color:"#024677" }}>الجلسات</span>
                </div>
                <div className="space-y-2.5">
                  {visibleCurriculum.length ? visibleCurriculum.map(s => (
                    <SessionRow
                      key={s.id}
                      s={s}
                      isEnrolled={isEnrolled}
                      onSelect={selectSession}
                      onAction={doJoin}
                      onRewatch={rewatch}
                      onAskEnroll={askEnroll}
                      isSelected={selectedSession?.id === s.id}
                      joinBusy={joinBusy}
                    />
                  )) : (
                    <p className="text-[13px] text-slate-400 text-center py-10">
                      لا توجد جلسات من هذا النوع
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background:"#EBF7FF" }}>
                  <IcoFile/>
                </div>
                <p className="text-[14px] font-bold text-slate-600 mb-1">لا توجد جلسات بعد</p>
                <p className="text-[12px] text-slate-400">سيتم إضافة الجلسات قريباً</p>
              </div>
            )}
          </div>

        </div>

        {/* sticky CTA */}
        {hasSessions && (
          <div className="shrink-0 px-4 py-4 border-t border-slate-100 bg-white" dir="rtl"
            style={{ boxShadow:"0 -2px 12px rgba(8,15,52,0.06)" }}>
            <div className="flex items-center gap-2 max-w-lg mx-auto">
              <button
                onClick={() => setWishlisted(w => !w)}
                className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition"
                style={{
                  borderColor: wishlisted ? "#ef4444" : "#e2e8f0",
                  color:       wishlisted ? "#ef4444" : "#94a3b8",
                  background:  wishlisted ? "#fef2f2" : "#fff",
                }}>
                <IcoHeart filled={wishlisted}/>
              </button>
              {isEnrolled ? (
                <button disabled
                  className="flex-1 py-3 rounded-xl text-[14px] font-extrabold text-white flex items-center justify-center gap-2"
                  style={{ background:"#22c55e", cursor:"default" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
                    strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  تم التسجيل
                </button>
              ) : (
                <button onClick={() => setShowEnrollModal(true)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-extrabold text-white hover:opacity-90 transition"
                  style={{ background:"#31AFEA" }}>
                  سجل الآن — {p.price} ر.س
                </button>
              )}
            </div>
          </div>
        )}

        </div>
      )}
    </>
  );
}
