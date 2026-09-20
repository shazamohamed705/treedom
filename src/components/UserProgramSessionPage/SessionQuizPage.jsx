import { useState, useEffect, useRef } from "react";

const NAVY = "#075A82";
const TEAL = "#36D5C4";
const GREEN = "#16A34A";

// ─── Mock quiz data ───────────────────────────────────────────────────────────
const MOCK_QUIZ = {
  title: "اختبار الجلسة",
  duration_minutes: 12,
  type_label: "اختيار من متعدد",
  questions: [
    {
      id: 1,
      text: "ما هي الخدمة المناسبة لتخزين ملفات ثابتة يتم الوصول إليها بشكل متكرر في AWS؟",
      type: "mcq",
      options: [
        { id: "a", text: "Amazon EBS" },
        { id: "b", text: "Amazon S3" },
        { id: "c", text: "Amazon EFS" },
        { id: "d", text: "تحسين أداء قواعد البيانات" },
      ],
    },
    {
      id: 2,
      text: "أي من الخيارات التالية يُعدّ نموذج مسؤولية مشتركة في الحوسبة السحابية؟",
      type: "mcq",
      options: [
        { id: "a", text: "المزود مسؤول عن كل شيء" },
        { id: "b", text: "العميل مسؤول عن البنية التحتية فقط" },
        { id: "c", text: "المزود يؤمّن البنية التحتية والعميل يؤمّن البيانات والتطبيقات" },
        { id: "d", text: "لا توجد مسؤولية مشتركة" },
      ],
    },
    {
      id: 3,
      text: "ما المقصود بـ Auto Scaling في AWS؟",
      type: "mcq",
      options: [
        { id: "a", text: "زيادة عدد الموظفين تلقائيًا" },
        { id: "b", text: "ضبط سعة الموارد تلقائيًا حسب الطلب" },
        { id: "c", text: "نسخ البيانات احتياطيًا بشكل تلقائي" },
        { id: "d", text: "تحديث النظام تلقائيًا" },
      ],
    },
    {
      id: 4,
      text: "هل يمكن نقل البيانات بين مناطق AWS المختلفة مجانًا؟",
      type: "true_false",
    },
    {
      id: 5,
      text: "اشرح بكلماتك الفرق بين IaaS و PaaS و SaaS.",
      type: "essay",
    },
  ],
};

// ─── Intro screen — السايدبارين لا يزالان ظاهرَين هنا ────────────────────────
function QuizIntro({ quiz, session, onStart, onCancel }) {
  const questionsCount = quiz?.questions?.length ?? 0;
  const duration       = quiz?.duration_minutes ?? quiz?.duration ?? null;
  const quizType       = quiz?.type_label ?? (questionsCount > 0 ? "اختيار من متعدد" : "");

  const tips = [
    "اقرأ كل سؤال بعناية قبل الإجابة",
    "يمكنك الرجوع لأي سؤال قبل التسليم",
    "بعد انتهاء الوقت يُسلَّم تلقائيًا",
  ];

  return (
    <div
      className="flex-1 min-h-0 flex flex-col overflow-y-auto"
      style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }}
      dir="rtl">

      <div className="w-full max-w-4xl mx-auto px-3 py-3 flex flex-col gap-4">

        {/* meta */}
        <div className="text-right">
          {session?.title && (
            <p className="text-[13px] font-semibold mb-1" style={{ color: TEAL }}>
              الجلسة {session?.num ? `${session.num}: ` : ""}{session.title}
            </p>
          )}
          <h1 className="text-[20px] font-extrabold" style={{ color: "#16324F" }}>
            {quiz?.title || "الاختبار"}
          </h1>
          {(questionsCount > 0 || duration || quizType) && (
            <p className="text-[13px] mt-1.5" style={{ color: "#64748B" }}>
              {[
                questionsCount > 0 && `${questionsCount} سؤال`,
                duration          && `${duration} دقيقة`,
                quizType          && quizType,
              ].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* tips card */}
        <div className="rounded-2xl border px-6 py-6 flex flex-col gap-4"
          style={{ background: "#EDF1F4", borderColor: "#DDE3E8" }}>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#D0F5F1" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span className="text-[14px]" style={{ color: "#334155" }}>{tip}</span>
            </div>
          ))}
        </div>

        {/* actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onStart}
            className="flex-1 h-12 rounded-xl text-white text-[15px] font-extrabold transition hover:opacity-90"
            style={{ background: NAVY }}>
            ابدأ الآن
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl text-[15px] font-bold border transition hover:bg-slate-50"
            style={{ borderColor: "#DDE3E8", color: "#64748B" }}>
            إلغاء
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Quiz form — مقفول بعد "ابدأ الآن" ───────────────────────────────────────
const ARABIC_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

function QuizForm({ quiz, session, onDone }) {
  const questions     = quiz?.questions ?? [];
  const [answers,    setAnswers]   = useState({});
  const [done,       setDone]      = useState(false);
  const [leaveCount, setLeaveCount] = useState(0);
  const [leaveWarn,  setLeaveWarn]  = useState(false);
  const [submitErr,  setSubmitErr]  = useState(false);
  const leaveCountRef = useRef(0);

  // تتبع مغادرة التاب / تصغير النافذة
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        leaveCountRef.current += 1;
        setLeaveCount(leaveCountRef.current);
        setLeaveWarn(true);
      }
    };
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "الاختبار قيد التقدم. هل أنت متأكد من المغادرة؟";
      return e.returnValue;
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const answered = Object.keys(answers).filter(k => {
    const v = answers[k];
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;

  const setAnswer = (qId, value) => setAnswers(prev => ({ ...prev, [qId]: value }));

  const MIN_ANSWERS = Math.min(2, questions.length);

  const handleSubmit = () => {
    if (answered < MIN_ANSWERS) {
      setSubmitErr(true);
      return;
    }
    setSubmitErr(false);
    // TODO: أرسل { answers, leaveCount: leaveCountRef.current } للـ API
    setDone(true);
  };

  // شاشة النجاح
  if (done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8"
        style={{ background: "#F5F8FA" }} dir="rtl">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "#DCFCE7" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[18px] font-extrabold" style={{ color: "#16324F" }}>تم إرسال إجاباتك</p>
          <p className="text-[13px] mt-2" style={{ color: "#94A3B8" }}>سيتم مراجعة إجاباتك قريبًا</p>
        </div>
        <button type="button" onClick={onDone}
          className="px-8 h-11 rounded-xl text-white text-[14px] font-extrabold transition hover:opacity-90"
          style={{ background: GREEN }}>
          العودة للجلسة
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
        style={{ background: "#F5F8FA" }} dir="rtl">
        <p className="text-[15px]" style={{ color: "#94A3B8" }}>لا توجد أسئلة في هذا الاختبار</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 flex flex-col overflow-hidden"
      style={{ background: "#F5F8FA", fontFamily: "'Cairo','IBM Plex Sans Arabic',sans-serif" }}
      dir="rtl">

      {/* شريط تحذير المغادرة */}
     {leaveWarn && (
  <div
    className="shrink-0 mx-6 mt-3 mb-1 flex items-center gap-2.5 px-3.5 py-2 rounded-lg"
    style={{
      background: "#ddeaf7",
      border: "1px solid #E2E8F0",
    }}
    dir="rtl"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>

    <span
      className="text-[12px] flex-1"
      style={{ color: "#475569" }}
    >
      تم مغادرة صفحة الاختبار {leaveCount}{" "}
      {leaveCount === 1 ? "مرة" : "مرات"}.
    </span>

    <button
      type="button"
      onClick={() => setLeaveWarn(false)}
      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition hover:bg-slate-100"
      style={{ color: "#473f3f" }}
      aria-label="إغلاق التنبيه"
    >
      ×
    </button>
  </div>
)}

      {/* قائمة الأسئلة — بدون card حول كل سؤال */}
      <div className="flex-1 overflow-y-auto px-6 py-3">
<div className="w-full max-w-6xl mx-auto flex flex-col pb-2" style={{ gap: 20 }}>
          {questions.map((q, qi) => {
            const isEssay = q.type === "essay" || q.type === "short";
            const isTF    = q.type === "true_false";
            const isMCQ   = q.type === "mcq" || (!isEssay && !isTF);
            const options  = q.options ?? [];

            return (
              <div key={q.id ?? qi} className="flex flex-col gap-3">

                {/* رقم + نص السؤال */}
                <div className="flex items-start gap-2" dir="rtl">
                  <span className="shrink-0 text-[12px] font-semibold mt-0.5"
                    style={{ color: "#94A3B8" }}>
                    {qi + 1}.
                  </span>
                  <p className="text-[15px] font-bold leading-relaxed flex-1"
                    style={{ color: "#16324F" }}>
                    {q.text}
                  </p>
                </div>

                {/* MCQ */}
                {isMCQ && (
                  <div className="flex flex-col gap-1.5">
                    {options.map((o, oi) => {
                      const checked = q.multi
                        ? (answers[q.id] || []).includes(o.id)
                        : answers[q.id] === o.id;
                      return (
                        <button
                          key={o.id ?? oi}
                          type="button"
                          onClick={() => setAnswer(q.id, q.multi
                            ? (checked
                                ? (answers[q.id] || []).filter(x => x !== o.id)
                                : [...(answers[q.id] || []), o.id])
                            : o.id)}
                          className="w-full flex items-center justify-between px-3 py-3 rounded-xl border transition"
                          dir="rtl"
                          style={{
                            background:  checked ? "#EEF4FB" : "#FFFFFF",
                            borderColor: checked ? NAVY      : "#E2E8EF",
                          }}>
                          {/* النص على اليمين */}
                          <span className="text-[14px] flex-1 text-right"
                            style={{ color: checked ? NAVY : "#334155", fontWeight: checked ? 600 : 400 }}>
                            {o.text}
                          </span>
                          {/* radio على أقصى الشمال */}
                          <span
                            className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center ms-3"
                            style={{
                              border:     checked ? `2px solid ${NAVY}` : "2px solid #CBD5E1",
                              background: "transparent",
                            }}>
                            {checked && (
                              <span className="w-2 h-2 rounded-full" style={{ background: NAVY }} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True / False */}
                {isTF && (
                  <div className="flex flex-col gap-1.5">
                    {["صح", "خطأ"].map((opt) => {
                      const checked = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer(q.id, opt)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border transition"
                          dir="rtl"
                          style={{
                            background:  checked ? "#EEF4FB" : "#FFFFFF",
                            borderColor: checked ? NAVY      : "#E2E8EF",
                          }}>
                          <span className="text-[14px] flex-1 text-right"
                            style={{ color: checked ? NAVY : "#334155", fontWeight: checked ? 600 : 400 }}>
                            {opt}
                          </span>
                          <span
                            className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center ms-3"
                            style={{
                              border:     checked ? `2px solid ${NAVY}` : "2px solid #CBD5E1",
                              background: "transparent",
                            }}>
                            {checked && (
                              <span className="w-2 h-2 rounded-full" style={{ background: NAVY }} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Essay */}
                {isEssay && (
                  <textarea
                    rows={q.type === "essay" ? 4 : 2}
                    value={answers[q.id] || ""}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full rounded-xl border px-4 py-3 text-[14px] outline-none resize-y bg-white"
                    style={{ borderColor: "#E2E8EF", color: "#1E3348" }}
                  />
                )}

                {/* فاصل بين الأسئلة */}
                {qi < questions.length - 1 && (
                  <div style={{ height: 1, background: "#E8EDF2", marginTop: 4 }} />
                )}
              </div>
            );
          })}

          {/* رسالة validation */}
          {submitErr && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA" }} dir="rtl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-[12px] font-semibold" style={{ color: "#DC2626" }}>
                يجب الإجابة على سؤالين على الأقل قبل التسليم
              </span>
            </div>
          )}

          {/* زر التسليم في نهاية القائمة */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-fit px-10 mr-auto h-10 rounded-xl text-white text-[14px] font-extrabold transition hover:opacity-90 flex items-center justify-left gap-2 mt-2"
            style={{ background: answered >= MIN_ANSWERS ? GREEN : "#94A3B8" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            تسليم الإجابات ({answered}/{questions.length})
          </button>

        </div>
      </div>

    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
// onEnterLock: يُستدعى عند "ابدأ الآن" لإخفاء السايدبارين
export default function SessionQuizPage({ quiz, session, onClose, onEnterLock }) {
  const [started, setStarted] = useState(false);

  const activeQuiz = (quiz?.questions?.length > 0) ? quiz : MOCK_QUIZ;

  const handleStart = () => {
    onEnterLock?.();   // إخفاء السايدبارين الآن
    setStarted(true);
  };

  if (!started) {
    return (
      <QuizIntro
        quiz={activeQuiz}
        session={session}
        onStart={handleStart}
        onCancel={onClose}
      />
    );
  }

  return (
    <QuizForm
      quiz={activeQuiz}
      session={session}
      onDone={onClose}
    />
  );
}
