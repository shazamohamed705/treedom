import { useState, useEffect, useRef } from "react";
import {
  submitTraineeQuizAnswers,
  fetchTraineeQuizResult,
} from "../../../services/api";
import QuizResultPage from "./QuizResultPage";

const NAVY  = "#024677";
const TEAL  = "#36D5C4";
const GREEN = "#16A34A";
const RED   = "#EF4444";

// ─── in-progress persistence (answers + start time) ──────────────────────────
function progressKey(programId, quizId) {
  return `treedom.quiz.${programId ?? "x"}.${quizId ?? "x"}.progress`;
}
function loadProgress(programId, quizId) {
  try {
    const raw = localStorage.getItem(progressKey(programId, quizId));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return { answers: obj.answers ?? {}, startTime: obj.startTime ?? null };
  } catch {
    return null;
  }
}
function saveProgress(programId, quizId, answers, startTime) {
  try {
    localStorage.setItem(
      progressKey(programId, quizId),
      JSON.stringify({ answers, startTime })
    );
  } catch {
    /* ignore */
  }
}
function clearProgress(programId, quizId) {
  try {
    localStorage.removeItem(progressKey(programId, quizId));
  } catch {
    /* ignore */
  }
}

// ─── normalize API question → internal shape ──────────────────────────────────
function normalizeQuestion(q) {
  const typeKey = q?.type?.key ?? q?.type ?? "mcq";
  return {
    id:      q.id,
    text:    q.body ?? q.text ?? "",
    type:    typeKey,
    multi:   q.multi ?? false,
    options: (q.options ?? []).map((o) => ({
      id:        o.id,
      text:      o.body ?? o.text ?? "",
      is_correct: o.is_correct ?? null,
    })),
  };
}

function fmtClock(ms) {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// build the submission payload from answers
function buildPayloadFrom(questions, answers) {
  return questions
    .map((q) => {
      const val = answers[q.id];
      if (q.type === "essay" || q.type === "short") {
        return { question_id: q.id, essay_answer: val ?? "" };
      }
      if (Array.isArray(val)) {
        return val.map((optId) => ({ question_id: q.id, option_id: optId }));
      }
      return { question_id: q.id, option_id: val ?? null };
    })
    .flat();
}

// ─── Blocked screen (attempts exhausted / cooldown) ──────────────────────────
function QuizBlocked({ retake, submission, quiz, onBack }) {
  const reason            = retake?.reason;
  const remainingMinutes  = retake?.remaining_minutes;
  const remainingAttempts = retake?.remaining_attempts;
  const maxAttempts       = retake?.max_attempts ?? quiz?.max_attempts;
  const lastScore         = submission?.final_percent ?? submission?.score;
  const lastPassed        = submission?.is_passed;

  let title = "لا يمكن بدء الاختبار حالياً";
  let desc  = "";
  let icon  = "⏳";
  let color = "#F59E0B";

  if (reason === "cooldown_active") {
    title = "بانتظار انتهاء فترة التبريد";
    desc  = remainingMinutes
      ? `يمكنك إعادة المحاولة بعد ${remainingMinutes} دقيقة.`
      : "يجب الانتظار قبل إعادة المحاولة.";
  } else if (reason === "no_attempts_left" || remainingAttempts === 0) {
    title = "استخدمت كل المحاولات المسموحة";
    desc  = `لقد استخدمت جميع محاولاتك (${maxAttempts ?? 0}) لهذا الاختبار.`;
    icon  = "🔒";
    color = "#EF4444";
  } else if (reason === "already_passed" || (quiz?.retake_only_if_failed && lastPassed)) {
    title = "اجتزت هذا الاختبار";
    desc  = "لقد اجتزت الاختبار بنجاح، ولا تحتاج لإعادة المحاولة.";
    icon  = "✓";
    color = GREEN;
  } else if (!retake && quiz?.allow_retake === false && submission) {
    title = "هذا الاختبار يُسمح بمحاولة واحدة فقط";
    desc  = "لقد أتممت المحاولة الوحيدة المسموح بها.";
    icon  = "🔒";
    color = "#EF4444";
  }

  return (
    <div
      className="flex-1 min-h-0 flex flex-col overflow-y-auto"
      style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }}
      dir="rtl"
    >
      <div className="w-full max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: color === GREEN ? "#DCFCE7" : color === RED ? "#FEF2F2" : "#FEF3C7", color }}
        >
          {icon}
        </div>
        <h1 className="text-[20px] font-extrabold text-center" style={{ color: "#16324F" }}>{title}</h1>
        <p className="text-[14px] text-center" style={{ color: "#64748B" }}>{desc}</p>

        {lastScore != null && (
          <div
            className="bg-white rounded-2xl border px-8 py-5 flex flex-col items-center gap-2"
            style={{ borderColor: "#E7EEF3" }}
          >
            <span className="text-[12px]" style={{ color: "#94A3B8" }}>نتيجة آخر محاولة</span>
            <span className="text-[26px] font-extrabold" style={{ color: lastPassed ? GREEN : RED }}>
              {Math.round(lastScore)}%
            </span>
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: lastPassed ? "#DCFCE7" : "#FEF2F2", color: lastPassed ? GREEN : RED }}
            >
              {lastPassed ? "ناجح" : "راسب"}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onBack}
          className="h-12 px-8 rounded-xl text-white text-[14px] font-extrabold transition hover:opacity-90"
          style={{ background: NAVY }}
        >
          العودة للجلسة
        </button>
      </div>
    </div>
  );
}

// ─── Intro screen ─────────────────────────────────────────────────────────────
function QuizIntro({ quiz, session, onStart, onCancel, loading, retakeInfo, isFirstAttempt }) {
  const questionsCount = quiz?.questions?.length ?? quiz?.questions_count ?? 0;
  const duration        = quiz?.duration_minutes ?? null;
  const categoryLabel   = quiz?.category?.text ?? null;
  const allowRetake      = quiz?.allow_retake ?? false;
  const maxAttempts      = quiz?.max_attempts ?? null;
  const cooldown         = quiz?.cooldown_minutes ?? null;
  const passPercent      = quiz?.pass_percent ?? null;

  const remainingAttempts = retakeInfo?.remaining_attempts ?? null;
  const cooldownActive     = retakeInfo?.reason === "cooldown_active";
  const noAttemptsLeft     = remainingAttempts === 0;

  const tips = [
    "اقرأ كل سؤال بعناية قبل الإجابة",
    "يمكنك مراجعة إجاباتك قبل التسليم",
    duration ? `لديك ${duration} دقيقة لإكمال الاختبار` : "أجب على جميع الأسئلة",
  ];

  return (
    <div
      className="flex-1 min-h-0 flex flex-col overflow-y-auto"
      style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }}
      dir="rtl"
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* header card */}
        <div className="bg-white rounded-2xl border px-6 py-5 flex flex-col gap-2"
          style={{ borderColor: "#E7EEF3" }}>
          {session?.title && (
            <p className="text-[12px] font-semibold" style={{ color: TEAL }}>{session.title}</p>
          )}
          <h1 className="text-[20px] font-extrabold" style={{ color: "#16324F" }}>
            {quiz?.title_translations?.ar ?? quiz?.title ?? "الاختبار"}
          </h1>

          {/* stats row */}
          <div className="flex items-center gap-4 flex-wrap mt-1">
            {questionsCount > 0 && (
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#64748B" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {questionsCount} سؤال
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#64748B" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {duration} دقيقة
              </span>
            )}
            {passPercent > 0 && (
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#64748B" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                نسبة النجاح {passPercent}%
              </span>
            )}
            {categoryLabel && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#EEF4FB", color: NAVY }}>{categoryLabel}</span>
            )}
          </div>

          {/* retake info */}
          {!isFirstAttempt && remainingAttempts != null && (
            <p className="text-[12px] mt-1 font-semibold" style={{ color: cooldownActive ? "#F59E0B" : "#64748B" }}>
              المحاولات المتبقية: {remainingAttempts} من {maxAttempts ?? retakeInfo?.max_attempts ?? "?"}
            </p>
          )}
          {isFirstAttempt && allowRetake && maxAttempts > 1 && (
            <p className="text-[12px] mt-1" style={{ color: "#94A3B8" }}>
              يُسمح بـ {maxAttempts} محاولات{cooldown ? ` · انتظار ${cooldown} دقيقة بين كل محاولة` : ""}
            </p>
          )}
        </div>

        {/* loading skeleton */}
        {loading && (
          <div className="animate-pulse bg-white rounded-2xl border px-6 py-5 flex flex-col gap-3"
            style={{ borderColor: "#E7EEF3" }}>
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
          </div>
        )}

        {/* tips card */}
        {!loading && (
          <div className="bg-white rounded-2xl border px-6 py-5 flex flex-col gap-3"
            style={{ borderColor: "#E7EEF3" }}>
            <p className="text-[13px] font-bold" style={{ color: "#16324F" }}>تعليمات الاختبار</p>
            {tips.map((tip, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#D0F5F1" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span className="text-[13px]" style={{ color: "#475569" }}>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* actions */}
        <div className="flex gap-3">
          <button type="button" onClick={onStart} disabled={loading || cooldownActive || noAttemptsLeft}
            className="flex-1 h-12 rounded-xl text-white text-[15px] font-extrabold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: NAVY }}>
            {loading ? "جارِ التحميل..." : isFirstAttempt ? "ابدأ الاختبار" : "إعادة المحاولة"}
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 h-12 rounded-xl text-[15px] font-bold border transition hover:bg-slate-50"
            style={{ borderColor: "#DDE3E8", color: "#64748B" }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz form ────────────────────────────────────────────────────────────────
function QuizForm({ quiz, programId, onGraded, onQuestionChange, onExit }) {
  const questions = (quiz?.questions ?? []).map(normalizeQuestion);
  const durationMin = Number(quiz?.duration_minutes) || 0;

  // restore any in-progress answers + start time (handles app lock / re-open)
  const restored = loadProgress(programId, quiz?.id);
  const [answers,    setAnswers]    = useState(() => restored?.answers ?? {});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState(null);
  const [leaveCount, setLeaveCount] = useState(0);
  const [leaveWarn,  setLeaveWarn]  = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeUp,     setTimeUp]     = useState(false);

  // timer based on a fixed end-time (robust to app lock/unlock)
  const [endTime] = useState(() => {
    if (!durationMin) return null;
    if (restored?.startTime && Date.now() < restored.startTime + durationMin * 60000) {
      return restored.startTime + durationMin * 60000;
    }
    return Date.now() + durationMin * 60000;
  });
  const [now, setNow] = useState(() => Date.now());
  const submittedRef = useRef(false);
  const leaveCountRef = useRef(0);
  const submitRef     = useRef(null);

  const remaining = endTime ? endTime - now : null;

  // report first unanswered question to the navbar
  useEffect(() => {
    if (!onQuestionChange) return;
    const firstUnanswered = questions.findIndex((q) => {
      const v = answers[q.id];
      return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    });
    onQuestionChange(firstUnanswered >= 0 ? firstUnanswered + 1 : questions.length);
  }, [answers, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // persist answers + start time so a re-open restores them
  useEffect(() => {
    if (!durationMin) return;
    const start = endTime ? endTime - durationMin * 60000 : Date.now();
    saveProgress(programId, quiz?.id, answers, start);
  }, [answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ticking clock
  useEffect(() => {
    if (!endTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  // anti-cheat: track tab/app leave
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        leaveCountRef.current += 1;
        setLeaveCount(leaveCountRef.current);
        setLeaveWarn(true);
      }
    };
    const onUnload = (e) => { e.preventDefault(); e.returnValue = "الاختبار قيد التقدم."; return e.returnValue; };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const answered = Object.keys(answers).filter((k) => {
    const v = answers[k];
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;

  const setAnswer = (qId, value) => setAnswers((prev) => ({ ...prev, [qId]: value }));

  const handleSubmit = async (isAuto = false) => {
    // double-submit guard — only one submission ever goes through
    if (submittedRef.current) return;
    if (!isAuto && answered < 1) {
      setSubmitErr("يجب الإجابة على سؤال واحد على الأقل");
      return;
    }
    submittedRef.current = true;
    setSubmitErr(null);
    setSubmitting(true);
    try {
      const pid = programId ?? quiz?.program_id ?? null;
      const qid = quiz?.id;
      if (pid && qid) {
        await submitTraineeQuizAnswers(pid, qid, buildPayloadFrom(questions, answers));
        // fetch the graded result (the submit response itself isn't graded)
        let graded = null;
        try {
          const r = await fetchTraineeQuizResult(pid, qid);
          graded = r?.data ?? null;
        } catch {
          /* grading may be pending — graded stays null */
        }
        clearProgress(pid, qid);
        onGraded?.(graded);
      }
    } catch (err) {
      submittedRef.current = false; // allow retry on failure
      setSubmitErr(err?.message ?? "حدث خطأ أثناء التسليم، حاول مجدداً");
      setSubmitting(false);
    }
  };
  // keep a ref so the timeout effect can call the latest handler (updated after every render)
  useEffect(() => { submitRef.current = handleSubmit; });

  // auto-submit when the countdown reaches zero
  useEffect(() => {
    if (remaining == null || remaining > 0 || submittedRef.current) return;
    setTimeUp(true);
    submitRef.current?.(true);
  }, [remaining]);

  const handleExitClick = () => {
    if (answered < 1) { onExit?.(); return; }
    setShowExitConfirm(true);
  };

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: "#F5F8FA" }} dir="rtl">
        <p className="text-[14px]" style={{ color: "#94A3B8" }}>لا توجد أسئلة في هذا الاختبار</p>
      </div>
    );
  }

  const lowTime = remaining != null && remaining < 60000;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden"
      style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }}
      dir="rtl">

      {/* sticky header: timer + exit */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: "#fff", borderColor: "#E7EEF3" }}>
        <button type="button" onClick={handleExitClick}
          className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg border transition hover:bg-slate-50"
          style={{ borderColor: "#E2E8EF", color: "#64748B" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          خروج
        </button>
        {endTime ? (
          <div className="flex items-center gap-1.5 text-[13px] font-extrabold px-3 py-1.5 rounded-lg"
            style={{ background: lowTime ? "#FEF2F2" : "#EEF4FB", color: lowTime ? RED : NAVY }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {fmtClock(remaining)}
          </div>
        ) : (
          <span className="text-[11px] font-semibold" style={{ color: "#94A3B8" }}>بدون حد زمني</span>
        )}
      </div>

      {/* leave warning */}
      {leaveWarn && (
        <div className="shrink-0 mx-4 mt-3 mb-0 flex items-center gap-2.5 px-3.5 py-2 rounded-lg"
          style={{ background: "#ddeaf7", border: "1px solid #bfdbfe" }} dir="rtl">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span className="text-[12px] flex-1" style={{ color: "#1d4ed8" }}>
            تم مغادرة صفحة الاختبار {leaveCount} {leaveCount === 1 ? "مرة" : "مرات"}
          </span>
          <button type="button" onClick={() => setLeaveWarn(false)} style={{ color: "#64748b", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* exit confirmation */}
      {showExitConfirm && (
        <div className="shrink-0 mx-4 mt-3 p-4 rounded-xl bg-white border" style={{ borderColor: "#E7EEF3" }} dir="rtl">
          <p className="text-[13px] font-bold mb-1" style={{ color: "#16324F" }}>هل تريد الخروج من الاختبار؟</p>
          <p className="text-[12px] mb-3" style={{ color: "#64748B" }}>
            سيتم حفظ إجاباتك ويمكنك استئنافها لاحقاً ضمن الوقت المتبقي.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { onExit?.(); }}
              className="flex-1 h-9 rounded-lg text-white text-[12px] font-bold" style={{ background: NAVY }}>نعم، خروج</button>
            <button type="button" onClick={() => setShowExitConfirm(false)}
              className="flex-1 h-9 rounded-lg text-[12px] font-bold border" style={{ borderColor: "#E2E8EF", color: "#64748B" }}>متابعة الاختبار</button>
          </div>
        </div>
      )}

      {/* questions — each on a white card */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">

          {timeUp && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }} dir="rtl">
              <span className="text-[12px] font-semibold" style={{ color: "#DC2626" }}>انتهى الوقت — يتم تسليم إجاباتك تلقائياً.</span>
            </div>
          )}

          {questions.map((q, qi) => {
            const isEssay = q.type === "essay" || q.type === "short";
            const isTF    = q.type === "true_false";
            const isMCQ   = !isEssay && !isTF;
            const options  = q.options ?? [];

            return (
              <div key={q.id ?? qi}
                className="bg-white rounded-2xl border px-8 py-6 flex flex-col gap-4"
                style={{ borderColor: "#E7EEF3" }}>

                {/* question header */}
                <div className="flex items-start gap-2" dir="rtl">
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                    style={{ background: "#EEF4FB", color: NAVY }}>{qi + 1}</span>
                  <p className="text-[15px] font-bold leading-relaxed flex-1" style={{ color: "#16324F" }}>{q.text}</p>
                </div>

                {/* MCQ options */}
                {isMCQ && (
                  <div className="flex flex-col gap-2">
                    {options.map((o, oi) => {
                      const checked = q.multi
                        ? (answers[q.id] || []).includes(o.id)
                        : answers[q.id] === o.id;
                      return (
                        <button key={o.id ?? oi} type="button"
                          onClick={() => setAnswer(q.id, q.multi
                            ? (checked ? (answers[q.id] || []).filter((x) => x !== o.id) : [...(answers[q.id] || []), o.id])
                            : o.id)}
                          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition"
                          dir="rtl"
                          style={{ background: checked ? "#EEF4FB" : "#FAFBFC", borderColor: checked ? NAVY : "#E2E8EF" }}>
                          <span className="text-[14px] flex-1 text-right"
                            style={{ color: checked ? NAVY : "#334155", fontWeight: checked ? 600 : 400 }}>{o.text}</span>
                          <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center ms-3"
                            style={{ border: checked ? `2px solid ${NAVY}` : "2px solid #CBD5E1" }}>
                            {checked && <span className="w-2 h-2 rounded-full" style={{ background: NAVY }} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True / False */}
                {isTF && (
                  <div className="flex flex-col gap-2">
                    {(options.length > 0 ? options : [{ id: "true", text: "صح" }, { id: "false", text: "خطأ" }])
                      .filter((o, i, arr) => arr.findIndex((x) => x.text === o.text) === i)
                      .map((o) => {
                        const checked = answers[q.id] === o.id;
                        return (
                          <button key={o.id} type="button" onClick={() => setAnswer(q.id, o.id)}
                            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition"
                            dir="rtl"
                            style={{ background: checked ? "#EEF4FB" : "#FAFBFC", borderColor: checked ? NAVY : "#E2E8EF" }}>
                            <span className="text-[14px] flex-1 text-right"
                              style={{ color: checked ? NAVY : "#334155", fontWeight: checked ? 600 : 400 }}>{o.text}</span>
                            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center ms-3"
                              style={{ border: checked ? `2px solid ${NAVY}` : "2px solid #CBD5E1" }}>
                              {checked && <span className="w-2 h-2 rounded-full" style={{ background: NAVY }} />}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* Essay */}
                {isEssay && (
                  <textarea rows={4} value={answers[q.id] || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full rounded-xl border px-4 py-3 text-[13px] outline-none resize-y"
                    style={{ borderColor: "#E2E8EF", color: "#1E3348", background: "#FAFBFC" }}
                  />
                )}
              </div>
            );
          })}

          {/* error */}
          {submitErr && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA" }} dir="rtl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-[12px] font-semibold" style={{ color: "#DC2626" }}>{submitErr}</span>
            </div>
          )}

          {/* submit */}
          <button type="button" onClick={() => handleSubmit(false)} disabled={submitting}
            className="w-full h-12 rounded-xl text-white text-[14px] font-extrabold transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: answered >= 1 ? GREEN : "#94A3B8" }}>
            {submitting
              ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>جارِ التسليم...</>
              : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>تسليم الإجابات ({answered}/{questions.length})</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────
function QuizResult({ quiz, session, submission, retake, onBack, onReview, onRetake }) {
  const score           = submission?.final_percent ?? submission?.score ?? null;
  const passed          = submission?.is_passed ?? false;
  const statusKey       = submission?.status?.key ?? null;
  const statusText      = submission?.status?.text ?? null;
  const submittedAnswers = submission?.answers ?? [];
  const isPending       = statusKey === "submitted"; // essay questions awaiting grading
  const correctCount    = submittedAnswers.filter((a) => a.is_correct === true).length;
  const wrongCount      = submittedAnswers.filter((a) => a.is_correct === false).length;
  const ungradedCount   = submittedAnswers.filter((a) => a.is_correct === null).length;

  const pct = score != null ? Math.min(100, Math.max(0, score)) : null;
  const r   = 54;
  const circ = 2 * Math.PI * r;
  const dash = pct != null ? (pct / 100) * circ : 0;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto"
      style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }}
      dir="rtl">
      <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">

        <p className="text-[12px]" style={{ color: "#94A3B8" }}>
          {quiz?.title_translations?.ar ?? quiz?.title ?? "الكويز"}
          {session?.title ? ` · ${session.title}` : ""}
        </p>

        <h1 className="text-[22px] font-extrabold" style={{ color: "#16324F" }}>
          نتيجة كويز الجلسة{session?.num ? ` ${session.num}` : ""}{session?.title ? `: ${session.title}` : ""}
        </h1>

        {isPending && (
          <div className="rounded-xl px-4 py-3" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }} dir="rtl">
            <p className="text-[12px] font-semibold" style={{ color: "#92400E" }}>
              تم تسليم إجاباتك بنجاح. الأسئلة المقالية في انتظار تصحيح المدرب، وستظهر النتيجة النهائية لاحقاً.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          {/* left — answer counts */}
          <div className="flex-1 bg-white rounded-2xl border p-5" style={{ borderColor: "#E7EEF3" }}>
            <div className="grid grid-cols-3 divide-x divide-x-reverse gap-0 mb-5"
              style={{ borderBottom: "1px solid #F0F4F8", paddingBottom: 16 }}>
              {[
                { label: "الإجابات الصحيحة", val: correctCount, color: GREEN, suffix: " إجابات" },
                { label: "الإجابات الخاطئة", val: wrongCount, color: RED, suffix: " إجابات" },
                { label: "الوقت المحدد", val: quiz?.duration_minutes ? `${quiz.duration_minutes} د` : "—", color: "#475569", suffix: "" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 px-3">
                  <span className="text-[11px]" style={{ color: "#94A3B8" }}>{item.label}</span>
                  <span className="text-[20px] font-extrabold" style={{ color: item.color }}>
                    {item.val}{item.suffix}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[13px] font-bold mb-3 text-right" style={{ color: "#16324F" }}>تفاصيل المحاولة</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "اسم الكويز", val: quiz?.title_translations?.ar ?? quiz?.title },
                { label: "الجلسة", val: session?.title },
                { label: "التاريخ والوقت", val: submission?.submitted_at
                    ? new Date(submission.submitted_at).toLocaleString("ar-SA", { dateStyle: "long", timeStyle: "short" })
                    : null },
                { label: "رقم المحاولة", val: submission?.attempt_number != null
                    ? `${submission.attempt_number} من ${retake?.max_attempts ?? quiz?.max_attempts ?? "?"} محاولات مسموحة`
                    : null },
                ungradedCount > 0 ? { label: "أسئلة بانتظار التصحيح", val: `${ungradedCount} سؤال مقالي`, red: true } : null,
                retake?.allowed === false && retake?.remaining_minutes
                  ? { label: "ملاحظة الإعادة", val: `يمكنك إعادة الكويز بعد ${retake.remaining_minutes} دقيقة`, red: true }
                  : null,
              ].filter(Boolean).map((row, i) => row.val ? (
                <div key={i} className="flex items-start justify-between gap-2 py-1"
                  style={{ borderBottom: "1px solid #F5F8FA" }}>
                  <span className="text-[12px]" style={{ color: row.red ? RED : "#94A3B8" }}>{row.label}</span>
                  <span className="text-[12px] font-semibold text-right" style={{ color: row.red ? RED : "#334155" }}>{row.val}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* right — score circle */}
          <div className="lg:w-72 bg-white rounded-2xl border p-6 flex flex-col items-center justify-center gap-3"
            style={{ borderColor: "#E7EEF3" }}>
            {pct != null ? (
              <>
                <div className="relative" style={{ width: 136, height: 136 }}>
                  <svg width="136" height="136" viewBox="0 0 136 136">
                    <circle cx="68" cy="68" r={r} fill="none" stroke="#F0F4F8" strokeWidth="10"/>
                    <circle cx="68" cy="68" r={r} fill="none"
                      stroke={passed ? GREEN : RED}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${dash} ${circ}`}
                      transform="rotate(-90 68 68)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[28px] font-extrabold" style={{ color: passed ? GREEN : RED }}>{Math.round(pct)}%</span>
                    <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                      {correctCount} من أصل {submittedAnswers.length} درجة
                    </span>
                  </div>
                </div>
                <span className="text-[13px] font-bold px-4 py-1.5 rounded-full"
                  style={{ background: passed ? "#DCFCE7" : "#FEF2F2", color: passed ? GREEN : RED }}>
                  {isPending ? "في انتظار التصحيح" : (statusText ?? (passed ? "ناجح" : "راسب"))}
                </span>
                {!passed && !isPending && quiz?.pass_percent > 0 && (
                  <p className="text-[11px] text-center" style={{ color: "#94A3B8" }}>نسبة النجاح المطلوبة {quiz.pass_percent}%</p>
                )}
                {quiz?.weight_percent === 0 && (
                  <div className="mt-1 rounded-xl px-3 py-2 text-center" style={{ background: "#EEF4FB" }}>
                    <p className="text-[11px] font-bold" style={{ color: NAVY }}>هذا الكويز لا يؤثر على المجموع النهائي للبرنامج</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px]" style={{ color: "#94A3B8" }}>جارِ المراجعة...</p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={onBack}
            className="h-11 px-6 rounded-xl text-white text-[13px] font-extrabold transition hover:opacity-90"
            style={{ background: NAVY }}>العودة للجلسة</button>
          {submittedAnswers.length > 0 && (
            <button type="button" onClick={onReview}
              className="h-11 px-6 rounded-xl text-[13px] font-bold border transition hover:bg-slate-50"
              style={{ borderColor: "#E2E8EF", color: "#475569" }}>مراجعة الإجابات</button>
          )}
          {retake?.allowed && (
            <button type="button" onClick={onRetake}
              className="h-11 px-6 rounded-xl text-[13px] font-bold border transition hover:bg-slate-50"
              style={{ borderColor: "#E2E8EF", color: NAVY }}>إعادة المحاولة</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Review screen ────────────────────────────────────────────────────────────
function QuizReview({ quiz, session, submission, onBack }) {
  const quizQuestions  = (quiz?.questions ?? []).map(normalizeQuestion);
  const submittedAnswers = submission?.answers ?? [];

  // map answers by question_id for quick lookup
  const answersByQ = {};
  submittedAnswers.forEach((a) => {
    const qid = a.question_id ?? a.question?.id;
    if (qid != null) answersByQ[qid] = a;
  });

  // pick the questions to display: prefer the quiz's own questions (have options),
  // fall back to the questions embedded in the submission answers
  const displayQuestions = quizQuestions.length > 0
    ? quizQuestions
    : submittedAnswers.map((a) => normalizeQuestion(a.question));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto"
      style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }}
      dir="rtl">
      <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">

        {/* header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-[12px]" style={{ color: "#94A3B8" }}>
              {quiz?.title_translations?.ar ?? quiz?.title ?? "الكويز"}{session?.title ? ` · ${session.title}` : ""}
            </p>
            <h1 className="text-[20px] font-extrabold" style={{ color: "#16324F" }}>مراجعة الإجابات</h1>
          </div>
          <button type="button" onClick={onBack}
            className="h-10 px-5 rounded-xl text-white text-[13px] font-extrabold transition hover:opacity-90"
            style={{ background: NAVY }}>العودة للنتيجة</button>
        </div>

        {displayQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: "#E7EEF3" }}>
            <p className="text-[13px]" style={{ color: "#94A3B8" }}>لا توجد إجابات لعرضها.</p>
          </div>
        ) : (
          displayQuestions.map((q, qi) => {
            const ans       = answersByQ[q.id] ?? null;
            const chosenOpt = ans?.chosen_option ?? null;
            const chosenId  = ans?.option_id ?? chosenOpt?.id ?? null;
            const isCorrect = ans?.is_correct ?? null;

            // try to find the correct option(s) from various possible API fields
            const correctOptions = (() => {
              if (ans?.correct_option) return [ans.correct_option];
              if (Array.isArray(ans?.correct_options) && ans.correct_options.length) return ans.correct_options;
              if (Array.isArray(q.options) && q.options.some((o) => o.is_correct === true)) {
                return q.options.filter((o) => o.is_correct === true).map((o) => ({ id: o.id, body: o.text ?? o.body }));
              }
              // some APIs nest correct options under the question object in the answer
              if (Array.isArray(ans?.question?.options)) {
                const correct = ans.question.options.filter((o) => o.is_correct === true).map((o) => ({ id: o.id, body: o.body ?? o.text }));
                if (correct.length) return correct;
              }
              return [];
            })();
            const correctBodies = correctOptions.map((o) => o.body ?? o.text).filter(Boolean);
            const essayAnswer    = ans?.essay_answer ?? null;

            const isEssay = q.type === "essay" || q.type === "short";

            return (
              <div key={q.id ?? qi} className="bg-white rounded-2xl border px-6 py-5 flex flex-col gap-3"
                style={{ borderColor: "#E7EEF3" }}>

                {/* question header */}
                <div className="flex items-start gap-2" dir="rtl">
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                    style={{ background: "#EEF4FB", color: NAVY }}>{qi + 1}</span>
                  <p className="text-[15px] font-bold leading-relaxed flex-1" style={{ color: "#16324F" }}>{q.text}</p>
                  {isCorrect === true && (
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#DCFCE7" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  )}
                  {isCorrect === false && (
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                  )}
                </div>

                {/* essay answer */}
                {isEssay ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl px-4 py-3" style={{ background: "#F7FAFC", border: "1px solid #E7EEF3" }}>
                      <p className="text-[11px] mb-1" style={{ color: "#94A3B8" }}>إجابتك</p>
                      <p className="text-[13px] whitespace-pre-line" style={{ color: "#334155" }}>
                        {essayAnswer ? essayAnswer : <span style={{ color: "#94A3B8" }}>— لم تتم الإجابة —</span>}
                      </p>
                    </div>
                    {ans?.essay_score != null && (
                      <p className="text-[12px] font-semibold" style={{ color: NAVY }}>الدرجة: {ans.essay_score}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* all options with chosen + correct markers */}
                    {(q.options ?? []).map((o) => {
                      const isChosen  = chosenId != null && String(o.id) === String(chosenId);
                      const isCorrectOpt = correctOptions.some((c) => String(c.id) === String(o.id));
                      let bg   = "#FAFBFC";
                      let border = "#E2E8EF";
                      let label = null;
                      let labelColor = "#94A3B8";
                      if (isCorrectOpt) {
                        bg = "#F0FDF4"; border = GREEN; label = "الإجابة الصحيحة"; labelColor = GREEN;
                      }
                      if (isChosen && !isCorrectOpt) {
                        bg = "#FEF2F2"; border = RED; label = "إجابتك"; labelColor = RED;
                      }
                      if (isChosen && isCorrectOpt) {
                        bg = "#F0FDF4"; border = GREEN; label = "إجابتك الصحيحة"; labelColor = GREEN;
                      }
                      return (
                        <div key={o.id} className="flex items-center justify-between px-4 py-3 rounded-xl border"
                          dir="rtl" style={{ background: bg, borderColor: border }}>
                          <span className="text-[13px] flex-1 text-right" style={{ color: isChosen || isCorrectOpt ? "#1E3348" : "#475569", fontWeight: isChosen || isCorrectOpt ? 600 : 400 }}>
                            {o.text}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {label && <span className="text-[10px] font-bold" style={{ color: labelColor }}>{label}</span>}
                            {isChosen && (
                              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: isCorrectOpt ? "#DCFCE7" : "#FEE2E2" }}>
                                {isCorrectOpt
                                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* chosen answer not among options (defensive) */}
                    {chosenOpt && (q.options ?? []).length === 0 && (
                      <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: isCorrect ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${isCorrect ? GREEN : RED}` }} dir="rtl">
                        <span className="text-[13px]" style={{ color: "#1E3348" }}>{chosenOpt.body}</span>
                        <span className="text-[10px] font-bold" style={{ color: isCorrect ? GREEN : RED }}>{isCorrect ? "صحيحة" : "خاطئة"}</span>
                      </div>
                    )}

                    {/* correct answer text (when options not exposed in review data) */}
                    {correctBodies.length > 0 && (q.options ?? []).length === 0 && (
                      <div className="rounded-xl px-4 py-3" style={{ background: "#F0FDF4", border: `1px solid ${GREEN}` }} dir="rtl">
                        <p className="text-[10px] mb-0.5" style={{ color: GREEN }}>الإجابة الصحيحة</p>
                        <p className="text-[13px] font-semibold" style={{ color: "#1E3348" }}>{correctBodies.join("، ")}</p>
                      </div>
                    )}

                    {/* no answer submitted */}
                    {chosenId == null && !essayAnswer && (
                      <p className="text-[12px]" style={{ color: "#94A3B8" }}>— لم تتم الإجابة على هذا السؤال —</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <button type="button" onClick={onBack}
          className="h-11 px-6 rounded-xl text-white text-[13px] font-extrabold transition hover:opacity-90 self-start"
          style={{ background: NAVY }}>العودة للنتيجة</button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SessionQuizPage({
  quiz,
  quizLoading = false,
  programId,
  session,
  onClose,
  onEnterLock,
  onQuestionChange,
}) {
  // phase: checking | blocked | intro | form | result | review
  const [phase,        setPhase]        = useState("checking");
  const [retakeInfo,   setRetakeInfo]   = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [resultData,   setResultData]   = useState(null); // graded result after submit

  const pid = programId ?? quiz?.program_id ?? null;
  const qid = quiz?.id ?? null;

  // pre-check: fetch the result endpoint to learn the retake status BEFORE starting.
  // This is the backend's source of truth for attempts/cooldown — the UI mirrors it,
  // but the backend also enforces it on submit (so a tampered UI is still rejected).
  useEffect(() => {
    if (!qid || !pid) return;
    let cancelled = false;
    setPhase("checking");
    fetchTraineeQuizResult(pid, qid)
      .then((res) => {
        if (cancelled) return;
        const data       = res?.data ?? null;
        const submission = data?.submission ?? null;
        const retake     = data?.retake ?? null;
        setLastSubmission(submission);
        setRetakeInfo(retake);
        // block only when there's a prior submission AND retake is explicitly disallowed
        if (submission && retake && retake.allowed === false) {
          setPhase("blocked");
        } else {
          setPhase("intro");
        }
      })
      .catch(() => {
        if (cancelled) return;
        // no prior submission (or endpoint unavailable) → first attempt is allowed
        setRetakeInfo(null);
        setLastSubmission(null);
        setPhase("intro");
      });
    return () => { cancelled = true; };
  }, [pid, qid]);

  const isFirstAttempt = !lastSubmission;

  const handleStart = () => {
    onEnterLock?.();
    setPhase("form");
  };

  const handleGraded = (graded) => {
    setResultData(graded);
    setRetakeInfo(graded?.retake ?? retakeInfo);
    setLastSubmission(graded?.submission ?? lastSubmission);
    setPhase("result");
  };

  const handleRetake = () => {
    // re-check retake eligibility before allowing another attempt
    setResultData(null);
    setPhase("checking");
    if (!pid || !qid) { setPhase("intro"); return; }
    fetchTraineeQuizResult(pid, qid)
      .then((res) => {
        const data       = res?.data ?? null;
        const submission = data?.submission ?? null;
        const retake     = data?.retake ?? null;
        setLastSubmission(submission);
        setRetakeInfo(retake);
        if (submission && retake && retake.allowed === false) setPhase("blocked");
        else setPhase("intro");
      })
      .catch(() => { setRetakeInfo(null); setLastSubmission(null); setPhase("intro"); });
  };

  // loading / no quiz
  if (quizLoading || !quiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8"
        style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }} dir="rtl">
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <p className="text-[13px] mt-3" style={{ color: "#94A3B8" }}>جارِ تحميل الاختبار...</p>
      </div>
    );
  }

  if (phase === "checking") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8"
        style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }} dir="rtl">
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <p className="text-[13px] mt-3" style={{ color: "#94A3B8" }}>جارِ التحقق من المحاولات السابقة...</p>
      </div>
    );
  }

  if (phase === "blocked") {
    return (
      <QuizBlocked
        retake={retakeInfo}
        submission={lastSubmission}
        quiz={quiz}
        onBack={onClose}
      />
    );
  }

  if (phase === "form") {
    return (
      <QuizForm
        quiz={quiz}
        session={session}
        programId={pid}
        onGraded={handleGraded}
        onQuestionChange={onQuestionChange}
        onExit={onClose}
      />
    );
  }

  if (phase === "review") {
    const submission = resultData?.submission ?? lastSubmission ?? null;
    const retake     = resultData?.retake ?? retakeInfo ?? null;
    return (
      <QuizResultPage
        quiz={quiz}
        session={session}
        programId={pid}
        submission={submission}
        retake={retake}
        onBack={onClose}
      />
    );
  }

  if (phase === "result") {
    const submission = resultData?.submission ?? lastSubmission ?? null;
    const retake     = resultData?.retake ?? retakeInfo ?? null;
    return (
      <QuizResultPage
        quiz={quiz}
        session={session}
        programId={pid}
        submission={submission}
        retake={retake}
        onBack={onClose}
      />
    );
  }

  // default: intro
  return (
    <QuizIntro
      quiz={quiz}
      session={session}
      loading={quizLoading}
      retakeInfo={retakeInfo}
      isFirstAttempt={isFirstAttempt}
      onStart={handleStart}
      onCancel={onClose}
    />
  );
}
