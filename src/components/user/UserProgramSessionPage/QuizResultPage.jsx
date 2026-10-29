import { useState, useEffect, useRef } from "react";
import { fetchTraineeQuizResult } from "../../../services/api";

/* ─── palette ─────────────────────────────────────────────────── */
const NAVY    = "#064B7A";
const GREEN   = "#16A34A";
const RED     = "#FF2020";
const BG      = "#F6F8FA";
const BORDER  = "#E3E8EF";
const FONT    = "'Cairo','IBM Plex Sans Arabic','Segoe UI',sans-serif";

/* ─── helpers ─────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-SA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtElapsed(startIso, endIso) {
  if (!startIso || !endIso) return null;
  try {
    const ms = new Date(endIso) - new Date(startIso);
    if (ms <= 0) return null;
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")} دقيقة`;
  } catch {
    return null;
  }
}

/* ─── CircleProgress ──────────────────────────────────────────── */
function CircleProgress({ pct, correct, total, passed }) {
  const r    = 68;
  const circ = 2 * Math.PI * r;
  const safe = Math.min(100, Math.max(0, pct ?? 0));
  const dash = (safe / 100) * circ;
  const color = passed ? GREEN : RED;

  return (
    <div className="relative mx-auto" style={{ width: 168, height: 168 }}>
      <svg width="168" height="168" viewBox="0 0 168 168" style={{ display: "block" }}>
        {/* track */}
        <circle cx="84" cy="84" r={r} fill="none" stroke="#E8EFF4" strokeWidth="12" />
        {/* progress */}
        <circle
          cx="84" cy="84" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 84 84)"
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ gap: 2 }}
      >
        <span style={{ fontSize: 32, fontWeight: 800, color: NAVY, lineHeight: "1" }}>
          {Math.round(safe)}%
        </span>
        <span style={{ fontSize: 12, color: "#8FA0AD", marginTop: 4 }}>
          {correct ?? "—"} من أصل {total ?? "—"} درجة
        </span>
      </div>
    </div>
  );
}

/* ─── BlockedBanner ───────────────────────────────────────────── */
function BlockedBanner({ retake }) {
  if (!retake || retake.allowed !== false) return null;

  const reason = retake.reason;

  // cooldown: بس نعرض الوقت المتبقي
  if (reason === "cooldown_active") {
    const mins = retake.remaining_minutes;
    return (
      <div
        className="rounded-xl px-4 py-3 mb-4"
        style={{
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          direction: "rtl",
          fontFamily: FONT,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>
          الإعادة متاحة بعد {mins ? `${mins} دقيقة` : "فترة الانتظار"}
        </p>
      </div>
    );
  }

  // no attempts left
  if (reason === "no_attempts_left" || retake.remaining_attempts === 0) {
    return (
      <div
        className="rounded-xl px-4 py-3 mb-4"
        style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          direction: "rtl",
          fontFamily: FONT,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: RED }}>
          لا تتوفر محاولات إضافية لهذا الكويز
        </p>
      </div>
    );
  }

  return null;
}

/* ─── StatCard ────────────────────────────────────────────────── */
function StatCard({ correct, wrong, elapsed }) {
  const items = [
    { label: "الإجابات الصحيحة", value: `${correct ?? 0} إجابات`, color: GREEN },
    { label: "الإجابات الخاطئة",  value: `${wrong  ?? 0} إجابات`, color: RED },
    { label: "الوقت المستغرق",    value: elapsed ?? "—",            color: "#334155" },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${BORDER}`, background: "#fff" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {items.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center py-5 px-2 text-center"
            style={{
              borderRight: i < items.length - 1 ? `1px solid ${BORDER}` : "none",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, color: "#8FA0AD", fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: "1" }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DetailCard ──────────────────────────────────────────────── */
function DetailCard({ quiz, session, submission, retake }) {
  const rows = [
    {
      label: "اسم الكويز",
      value: quiz?.title_translations?.ar ?? quiz?.title ?? "—",
      red: false,
    },
    {
      label: "الجلسة",
      value: session?.title ?? "—",
      red: false,
    },
    {
      label: "التاريخ والوقت",
      value: fmtDate(submission?.submitted_at),
      red: false,
    },
    {
      label: "رقم المحاولة",
      value: submission?.attempt_number != null
        ? `${submission.attempt_number} من ${retake?.max_attempts ?? quiz?.max_attempts ?? "?"} محاولات مسموحة`
        : "—",
      red: false,
    },
    retake?.allowed === false && retake?.remaining_minutes
      ? {
          label: "ملاحظة الإعادة",
          value: `يمكنك إعادة الكويز لتحسين النتيجة بعد ${retake.remaining_minutes} دقيقة`,
          red: true,
        }
      : retake?.allowed === false && retake?.reason === "no_attempts_left"
        ? { label: "ملاحظة الإعادة", value: "لا تتوفر محاولات إضافية لهذا الكويز.", red: true }
        : null,
  ].filter(Boolean);

  return (
    <div
      className="rounded-xl"
      style={{ border: `1px solid ${BORDER}`, background: "#fff" }}
    >
      {/* title */}
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: BORDER }}
      >
        <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, textAlign: "right" }}>
          تفاصيل المحاولة
        </p>
      </div>

      {/* rows */}
      <div className="px-5 py-1">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-start justify-between py-3"
            style={{
              borderBottom: i < rows.length - 1 ? `1px solid #F1F5F8` : "none",
              gap: 12,
              direction: "rtl",
            }}
          >
            <span style={{ fontSize: 13, color: "#8FA0AD", flexShrink: 0 }}>{row.label}</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: row.red ? 700 : 500,
                color: row.red ? RED : "#1E3348",
                textAlign: "left",
                maxWidth: "55%",
                wordBreak: "break-word",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ScoreCard ───────────────────────────────────────────────── */
function ScoreCard({ pct, passed, statusText, correct, total, quiz, isPending }) {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center py-8 px-5 text-center h-full"
      style={{
        border: `1px solid ${BORDER}`,
        background: "#fff",
        gap: 12,
        minHeight: 280,
      }}
    >
      <CircleProgress pct={pct} correct={correct} total={total} passed={passed} />

      {/* pass/fail badge */}
      <span
        className="px-5 py-1.5 rounded-full text-sm font-bold"
        style={{
          background: passed ? "#DCFCE7" : isPending ? "#FEF3C7" : "#FEE2E2",
          color:      passed ? GREEN     : isPending ? "#92400E" : RED,
          fontSize:   13,
          fontWeight: 700,
        }}
      >
        {isPending ? "في انتظار التصحيح" : (statusText ?? (passed ? "ناجح" : "راسب"))}
      </span>

      {/* weight note */}
      {quiz?.weight_percent === 0 && (
        <div
          className="rounded-xl px-4 py-3 text-center w-full"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>
            هذا الكويز لا يؤثر على المجموع النهائي للبرنامج
          </p>
          <p style={{ fontSize: 11, color: "#16A34A", opacity: 0.8, marginTop: 4, lineHeight: 1.5 }}>
            بعد اجتياز هذا الكويز إلزامياً فقط تفتح الجلسات والوحدات التالية وإصدار الشهادة النهائية
          </p>
        </div>
      )}

      {/* pass percent requirement */}
      {!passed && !isPending && (quiz?.pass_percent ?? 0) > 0 && (
        <p style={{ fontSize: 12, color: "#8FA0AD" }}>
          نسبة النجاح المطلوبة: {quiz.pass_percent}%
        </p>
      )}
    </div>
  );
}

/* ─── ReviewScreen ────────────────────────────────────────────── */
function normalizeQ(q) {
  const typeKey = q?.type?.key ?? q?.type ?? "mcq";
  return {
    id:      q.id,
    text:    q.body ?? q.text ?? "",
    type:    typeKey,
    options: (q.options ?? []).map((o) => ({
      id:        o.id,
      text:      o.body ?? o.text ?? "",
      is_correct: o.is_correct ?? null,
    })),
  };
}

function ReviewScreen({ quiz, session, submission, onBack }) {
  const quizQuestions    = (quiz?.questions ?? []).map(normalizeQ);
  const submittedAnswers = submission?.answers ?? [];

  const ansMap = {};
  submittedAnswers.forEach((a) => {
    const qid = a.question_id ?? a.question?.id;
    if (qid != null) ansMap[qid] = a;
  });

  const displayQs = quizQuestions.length > 0
    ? quizQuestions
    : submittedAnswers.map((a) => normalizeQ(a.question ?? {}));

  return (
    <div
      style={{ background: BG, fontFamily: FONT, direction: "rtl", height: "100%", overflowY: "auto", overflowX: "hidden" }}
    >
      <div className="w-full px-4 py-6 flex flex-col gap-4">

        {/* header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p style={{ fontSize: 12, color: "#8FA0AD" }}>
              {quiz?.title_translations?.ar ?? quiz?.title ?? "الكويز"}
              {session?.title ? ` · ${session.title}` : ""}
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#16324F", marginTop: 2 }}>
              مراجعة الإجابات
            </h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-5 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
            style={{ background: NAVY, fontSize: 13 }}
          >
            العودة للنتيجة
          </button>
        </div>

        {displayQs.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: BORDER }}>
            <p style={{ fontSize: 13, color: "#8FA0AD" }}>لا توجد إجابات لعرضها.</p>
          </div>
        )}

        {displayQs.map((q, qi) => {
          const ans       = ansMap[q.id] ?? null;
          const chosenId  = ans?.option_id ?? ans?.chosen_option?.id ?? null;
          const isCorrect = ans?.is_correct ?? null;
          const essayAns  = ans?.essay_answer ?? null;
          const isEssay   = q.type === "essay" || q.type === "short";

          /* build correct options list */
          const correctOpts = (() => {
            if (ans?.correct_option) return [{ id: ans.correct_option.id, text: ans.correct_option.body ?? "" }];
            if (Array.isArray(ans?.correct_options) && ans.correct_options.length)
              return ans.correct_options.map((o) => ({ id: o.id, text: o.body ?? o.text ?? "" }));
            if (q.options.some((o) => o.is_correct === true))
              return q.options.filter((o) => o.is_correct).map((o) => ({ id: o.id, text: o.text }));
            if (Array.isArray(ans?.question?.options))
              return ans.question.options.filter((o) => o.is_correct).map((o) => ({ id: o.id, text: o.body ?? "" }));
            return [];
          })();

          return (
            <div
              key={q.id ?? qi}
              className="bg-white rounded-xl border px-6 py-5 flex flex-col gap-3"
              style={{ borderColor: BORDER }}
            >
              {/* question row */}
              <div className="flex items-start gap-2.5">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: "#EEF4FB", color: NAVY }}
                >{qi + 1}</span>
                <p className="flex-1 text-right" style={{ fontSize: 15, fontWeight: 700, color: "#16324F", lineHeight: 1.6 }}>
                  {q.text}
                </p>
                {isCorrect === true  && <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#DCFCE7" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>}
                {isCorrect === false && <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#FEE2E2" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
              </div>

              {/* essay */}
              {isEssay ? (
                <div className="rounded-xl px-4 py-3" style={{ background: "#F7FAFC", border: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 11, color: "#8FA0AD", marginBottom: 4 }}>إجابتك</p>
                  <p style={{ fontSize: 13, color: "#334155", whiteSpace: "pre-wrap" }}>
                    {essayAns ?? <span style={{ color: "#8FA0AD" }}>— لم تتم الإجابة —</span>}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {q.options.map((o) => {
                    const isChosen  = chosenId != null && String(o.id) === String(chosenId);
                    const isCrrct   = correctOpts.some((c) => String(c.id) === String(o.id));
                    let bg  = "#FAFBFC", bdr = "#E2E8EF", lbl = null, lblClr = "#8FA0AD";
                    if (isCrrct)              { bg = "#F0FDF4"; bdr = GREEN; lbl = "الإجابة الصحيحة"; lblClr = GREEN; }
                    if (isChosen && !isCrrct) { bg = "#FEF2F2"; bdr = RED;   lbl = "إجابتك";          lblClr = RED;   }
                    if (isChosen && isCrrct)  { bg = "#F0FDF4"; bdr = GREEN; lbl = "إجابتك الصحيحة";  lblClr = GREEN; }
                    return (
                      <div
                        key={o.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border"
                        style={{ background: bg, borderColor: bdr, direction: "rtl" }}
                      >
                        <span style={{ fontSize: 13, color: "#1E3348", fontWeight: isChosen || isCrrct ? 600 : 400, flex: 1, textAlign: "right" }}>
                          {o.text}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 mr-3">
                          {lbl && <span style={{ fontSize: 10, fontWeight: 700, color: lblClr }}>{lbl}</span>}
                          {isChosen && (
                            <span className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: isCrrct ? "#DCFCE7" : "#FEE2E2" }}>
                              {isCrrct
                                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={RED}   strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onBack}
          className="self-start h-11 px-6 rounded-xl text-white font-bold transition hover:opacity-90"
          style={{ background: NAVY, fontSize: 13 }}
        >
          العودة للنتيجة
        </button>
      </div>
    </div>
  );
}

/* ─── main ResultPage ─────────────────────────────────────────── */
/**
 * Props:
 *   quiz          — full quiz object (questions, settings)
 *   session       — { num, title }
 *   programId     — number
 *   submission    — pre-loaded submission object (from submit response) — optional
 *   retake        — pre-loaded retake object — optional
 *   onBack        — () => void  (العودة للجلسة)
 *
 * If submission is not provided the component fetches it from
 *   GET /trainee/programs/:programId/quizzes/:quizId/result
 */
export default function QuizResultPage({
  quiz,
  session,
  programId,
  submission: submissionProp,
  retake:     retakeProp,
  onBack,
  onViewChange,   // optional: (view: "result"|"review") => void — يعلم الـ parent بالتنقل
}) {
  const [submission, setSubmission] = useState(submissionProp ?? null);
  const [retake,     setRetake]     = useState(retakeProp     ?? null);
  const [loading,    setLoading]    = useState(!submissionProp);
  const [error,      setError]      = useState(null);
  const [view,       setView]       = useState("result"); // "result" | "review"
  const fetchedRef = useRef(false);

  /* fetch result if not pre-loaded */
  useEffect(() => {
    if (submissionProp) { setSubmission(submissionProp); setLoading(false); return; }
    const pid = programId;
    const qid = quiz?.id;
    if (!pid || !qid || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    fetchTraineeQuizResult(pid, qid)
      .then((res) => {
        const d = res?.data ?? {};
        setSubmission(d.submission ?? null);
        setRetake(d.retake ?? null);
      })
      .catch((err) => setError(err?.message ?? "تعذّر تحميل النتيجة."))
      .finally(() => setLoading(false));
  }, [programId, quiz?.id, submissionProp]);

  /* sync props when parent updates them */
  useEffect(() => { if (submissionProp) setSubmission(submissionProp); }, [submissionProp]);
  useEffect(() => { if (retakeProp)     setRetake(retakeProp); },       [retakeProp]);

  /* ── loading ── */
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20"
        style={{ background: BG, fontFamily: FONT }}>
        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="#8FA0AD" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <p style={{ fontSize: 13, color: "#8FA0AD" }}>جارِ تحميل النتيجة…</p>
      </div>
    );
  }

  /* ── error ── */
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20"
        style={{ background: BG, fontFamily: FONT, direction: "rtl" }}>
        <p style={{ fontSize: 14, color: RED, fontWeight: 600 }}>{error}</p>
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-6 rounded-xl text-white font-bold transition hover:opacity-90"
          style={{ background: NAVY, fontSize: 13 }}
        >
          العودة للجلسة
        </button>
      </div>
    );
  }

  /* ── review view ── */
  if (view === "review") {
    return (
      <ReviewScreen
        quiz={quiz}
        session={session}
        submission={submission}
        onBack={() => { setView("result"); onViewChange?.("result"); }}
      />
    );
  }

  /* ── result view ── */
  const pct           = submission?.final_percent ?? submission?.score ?? null;
  const passed        = submission?.is_passed ?? false;
  const statusKey     = submission?.status?.key ?? null;
  const statusText    = submission?.status?.text ?? null;
  const isPending     = statusKey === "submitted";
  const answers       = submission?.answers ?? [];
  const correctCount  = answers.filter((a) => a.is_correct === true).length;
  const wrongCount    = answers.filter((a) => a.is_correct === false).length;
  const total         = answers.length || (quiz?.questions?.length ?? null);

  /* elapsed time */
  const elapsed = fmtElapsed(
    submission?.started_at  ?? null,
    submission?.submitted_at ?? null,
  ) ?? (quiz?.duration_minutes ? `${quiz.duration_minutes}:00 دقيقة` : null);

  /* breadcrumb text */
  const breadcrumb = [
    "الكويز",
    quiz?.title_translations?.ar ?? quiz?.title,
    session?.title,
  ].filter(Boolean).join(" · ");

  const canReview = answers.length > 0;
  const canRetake = retake?.allowed === true;

  return (
    <div
      style={{ background: BG, fontFamily: FONT, direction: "rtl", height: "100%", overflowY: "auto", overflowX: "hidden" }}
    >
      <div className="w-full px-4 sm:px-6 py-6 flex flex-col gap-5">

        {/* breadcrumb */}
        <p style={{ fontSize: 12, color: "#8FA0AD", textAlign: "right" }}>{breadcrumb}</p>

        {/* page title */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#16324F", textAlign: "right", lineHeight: 1.4 }}>
          نتيجة كويز الجلسة{session?.num ? ` ${session.num}` : ""}
          {session?.title ? `: ${session.title}` : ""}
        </h1>

        {/* blocked banner */}
        <BlockedBanner retake={retake} />

        {/* pending banner */}
        {isPending && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
          >
            <span style={{ fontSize: 18 }}>⏳</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>
              تم تسليم إجاباتك بنجاح. الأسئلة المقالية في انتظار تصحيح المدرب، وستظهر النتيجة النهائية قريباً.
            </p>
          </div>
        )}

        {/* ── two-column grid — ScoreCard يمين، التفاصيل يسار (RTL) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start" dir="rtl">

          {/* العمود الأيمن: دائرة النتيجة */}
          <div>
            <ScoreCard
              pct={pct}
              passed={passed}
              statusText={statusText}
              isPending={isPending}
              correct={correctCount}
              total={total}
              quiz={quiz}
            />
          </div>

          {/* العمود الأيسر: إحصائيات + تفاصيل */}
          <div className="flex flex-col gap-4">
            <StatCard correct={correctCount} wrong={wrongCount} elapsed={elapsed} />
            <DetailCard
              quiz={quiz}
              session={session}
              submission={submission}
              retake={retake}
            />
          </div>
        </div>

        {/* ── أزرار — محاذاة يسار كما في التصميم ── */}
        <div className="flex flex-wrap gap-3" style={{ justifyContent: "flex-end" }}>
          {/* primary */}
          <button
            type="button"
            onClick={onBack}
            className="h-11 px-7 rounded-xl text-white font-bold transition"
            style={{
              background: NAVY,
              fontSize: 14,
              fontFamily: FONT,
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            العودة للجلسة
          </button>

          {/* review */}
          {canReview && (
            <button
              type="button"
              onClick={() => { setView("review"); onViewChange?.("review"); }}
              className="h-11 px-7 rounded-xl font-bold border transition bg-white"
              style={{
                borderColor: NAVY,
                color: NAVY,
                fontSize: 14,
                fontFamily: FONT,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#EEF4FB"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
            >
              مراجعة الإجابات
            </button>
          )}

          {/* retake */}
          {canRetake && (
            <button
              type="button"
              onClick={onBack}            /* caller decides routing */
              className="h-11 px-7 rounded-xl font-bold border transition bg-white"
              style={{
                borderColor: GREEN,
                color: GREEN,
                fontSize: 14,
                fontFamily: FONT,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F0FDF4"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
            >
              إعادة المحاولة
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
