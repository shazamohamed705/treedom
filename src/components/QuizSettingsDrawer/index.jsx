import { useState } from "react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = "#024677";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 14, sw = 1.8, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>
    {d}
  </svg>
);
const IcoX       = ({ size = 14 }) => <Ico size={size} sw={2.2} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoPlus    = ({ size = 12 }) => <Ico size={size} sw={2.4} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoTrash   = ({ size = 12 }) => <Ico size={size} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />;
const IcoCheck   = ({ size = 11 }) => <Ico size={size} sw={2.5} d={<polyline points="20 6 9 17 4 12"/>} />;
const IcoUpload  = ({ size = 12 }) => <Ico size={size} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />;
const IcoClip    = ({ size = 12 }) => <Ico size={size} d={<><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>} />;

// ─── mock question bank ───────────────────────────────────────────────────────
const MOCK_BANK = [
  {
    unit: "الوحدة الأولى: قواعد اللغة الإنجليزية",
    questions: [
      { id: 1, text: "مقدمة في اللغة الإنجليزية" },
      { id: 2, text: "أفعال اللغة الإنجليزية" },
      { id: 3, text: "قالب الأزمنة" },
    ],
  },
  {
    unit: "الوحدة الثانية: مهارات التواصل الإنجليزية",
    questions: [
      { id: 4, text: "التواصل الرسمي" },
      { id: 5, text: "الاستماع والفهم" },
    ],
  },
];

const COUNT_OPTIONS = [10, 12, 24];

// ─── tiny input ───────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1" dir="rtl">
      <label className="block text-[11px] font-semibold" style={{ color: "#374151" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = `w-full text-[12px] px-3 rounded-md border border-[#e5e7eb] bg-white
  focus:outline-none focus:ring-1 focus:ring-[#024677]/30 focus:border-[#024677]
  placeholder:text-slate-300 transition`;

// ─── AnswerOption ─────────────────────────────────────────────────────────────
function AnswerOption({ value, correct, index, onChange, onCorrect, onRemove }) {
  return (
    <div className="flex items-center gap-2" dir="rtl">
      {/* radio — يمين */}
      <button
        type="button"
        onClick={onCorrect}
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
        style={{
          borderColor: correct ? BRAND : "#d1d5db",
          background:  correct ? BRAND : "#fff",
        }}
        title="اختر الإجابة الصحيحة"
      >
        {correct && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
      </button>

      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`الخيار ${index + 1}`}
        className={`${inputCls} flex-1 h-8`}
        dir="rtl"
      />

      {correct && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: "#dcfce7", color: "#16a34a" }}>
          صحيحة
        </span>
      )}

      {/* X — شمال */}
      <button type="button" onClick={onRemove}
        className="shrink-0 text-slate-300 hover:text-red-400 transition-colors">
        <IcoX size={11} />
      </button>
    </div>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onChange, onRemove }) {
  const updateAnswer = (ai, val) => {
    const answers = [...question.answers];
    answers[ai] = { ...answers[ai], text: val };
    onChange({ ...question, answers });
  };

  const setCorrect = (ai) => {
    const answers = question.answers.map((a, i) => ({ ...a, correct: i === ai }));
    onChange({ ...question, answers });
  };

  const removeAnswer = (ai) => {
    if (question.answers.length <= 2) return;
    const answers = question.answers.filter((_, i) => i !== ai);
    onChange({ ...question, answers });
  };

  const addAnswer = () => {
    if (question.answers.length >= 6) return;
    onChange({
      ...question,
      answers: [...question.answers, { text: "", correct: false }],
    });
  };

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden" dir="rtl">
      {/* card header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#f1f5f9]"
        style={{ background: "#f8fafc" }} dir="rtl">
        <span className="text-[12px] font-bold" style={{ color: BRAND }}>
          سؤال {index + 1}
        </span>
        <button type="button" onClick={onRemove}
          className="text-slate-300 hover:text-red-400 transition-colors p-0.5">
          <IcoTrash size={12} />
        </button>
      </div>

      {/* question text */}
      <div className="px-3 py-2.5 space-y-3">
        <textarea
          value={question.text}
          onChange={e => onChange({ ...question, text: e.target.value })}
          placeholder="اكتب نص السؤال هنا..."
          rows={2}
          className={`${inputCls} resize-none py-2`}
          dir="rtl"
        />

        {/* answers */}
        <div className="space-y-2">
          {question.answers.map((ans, ai) => (
            <AnswerOption
              key={ai}
              index={ai}
              value={ans.text}
              correct={ans.correct}
              onChange={val => updateAnswer(ai, val)}
              onCorrect={() => setCorrect(ai)}
              onRemove={() => removeAnswer(ai)}
            />
          ))}
        </div>

        {/* add answer */}
        {question.answers.length < 6 && (
          <button type="button" onClick={addAnswer}
            className="flex items-center gap-1 text-[11px] font-medium hover:opacity-70 transition-opacity"
            style={{ color: BRAND }}>
            <IcoPlus size={10} />
            إضافة خيار
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-9 h-5 rounded-full relative transition-colors shrink-0"
      style={{ background: value ? BRAND : "#d1d5db" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ right: value ? "2px" : "auto", left: value ? "auto" : "2px" }}
      />
    </button>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
/**
 * Props:
 *   open     – boolean
 *   onClose  – fn
 *   lessonTitle – string (اسم الدرس المرتبط)
 *   onSave   – fn(quizData)
 */
export default function QuizSettingsDrawer({ open, onClose, lessonTitle = "", onSave }) {

  // basic info
  const [title, setTitle]   = useState("");
  const [desc,  setDesc]    = useState("");

  // quiz type
  const [quizType, setQuizType] = useState("short"); // "short" | "final"

  // selected question unit + questions
  const [selectedUnit, setSelectedUnit] = useState(0);
  const [selectedQIds, setSelectedQIds] = useState([]);

  // count
  const [count, setCount] = useState(10);

  // rules
  const [rules, setRules] = useState({
    passMark:   70,
    duration:   20,
    attempts:   2,
    allowRetry: true,
    waitHours:  24,
  });

  // manual questions
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      text: "",
      answers: [
        { text: "", correct: true  },
        { text: "", correct: false },
        { text: "", correct: false },
        { text: "", correct: false },
      ],
    },
  ]);

  const toggleQId = (id) => {
    setSelectedQIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: Date.now(),
        text: "",
        answers: [
          { text: "", correct: true  },
          { text: "", correct: false },
          { text: "", correct: false },
          { text: "", correct: false },
        ],
      },
    ]);
  };

  const removeQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id, updated) => {
    setQuestions(prev => prev.map(q => q.id === id ? updated : q));
  };

  const handleSave = () => {
    onSave?.({
      title, desc, quizType, selectedUnit,
      selectedQIds, count, rules, questions,
    });
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* overlay */}
      <div
        className="flex-1 bg-black/25"
        onClick={onClose}
      />

      {/* drawer panel */}
      <div
        className="flex flex-col bg-white h-full overflow-hidden"
        style={{
          width: "clamp(480px, 55vw, 720px)",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.07)",
        }}
      >
        {/* ── header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0" dir="rtl">
          <h2 className="text-[14px] font-semibold" style={{ color: "#1f2937" }}>
            إعداد الكويز
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-slate-400"
          >
            <IcoX size={13} />
          </button>
        </div>

        {/* ── scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* lesson context */}
          {lessonTitle && (
            <p className="text-[11px] text-right" style={{ color: "#94a3b8" }}>
              درس: <span className="font-semibold" style={{ color: BRAND }}>{lessonTitle}</span>
            </p>
          )}

          {/* ── basic info ── */}
          <div className="space-y-3">
            <Field label="عنوان الكويز">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: اختبار الوحدة الأولى"
                className={`${inputCls} h-9`}
                dir="rtl"
              />
            </Field>
            <Field label="وصف الكويز">
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="وصف مختصر..."
                rows={2}
                className={`${inputCls} resize-none py-2`}
                dir="rtl"
              />
            </Field>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* ── quiz type ── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-right" style={{ color: "#374151" }}>نوع التقييم</p>
            <div
              className="flex rounded-lg p-1 gap-1"
              style={{ background: "#f1f5f9" }}
              dir="rtl"
            >
              {[
                { key: "evaluated", label: "كويز مُقيَّم",   sub: "كويز مراجعة موديول" },
                { key: "practice",  label: "كويز تدريبي",    sub: "كويز تدريبي بعد الدرس" },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setQuizType(opt.key)}
                  className="flex-1 rounded-md px-3 py-2 text-right transition-all duration-150"
                  style={{
                    background:  quizType === opt.key ? "#fff" : "transparent",
                    boxShadow:   quizType === opt.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <p className="text-[12px] font-semibold"
                    style={{ color: quizType === opt.key ? BRAND : "#94a3b8" }}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] mt-0.5"
                    style={{ color: quizType === opt.key ? "#64748b" : "#cbd5e1" }}>
                    {opt.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* ── question bank ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2" dir="rtl">
              <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>الجلسات المرتبطة</p>
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>(اختر درساً واحداً)</p>
            </div>

            {/* accordion units */}
            <div className="rounded-lg border border-[#e5e7eb] overflow-hidden divide-y divide-[#e5e7eb]">
              {MOCK_BANK.map((unit, ui) => {
                const isOpen = selectedUnit === ui;
                return (
                  <div key={ui}>
                    {/* unit header */}
                    <button
                      type="button"
                      onClick={() => setSelectedUnit(isOpen ? -1 : ui)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                      style={{ background: "#f8fafc" }}
                      dir="rtl"
                    >
                      <span className="text-[12px] font-semibold" style={{ color: "#1f2937" }}>
                        {unit.unit}
                      </span>
                      <span
                        className="text-slate-400 transition-transform duration-200"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </span>
                    </button>

                    {/* lessons */}
                    {isOpen && (
                      <div className="divide-y divide-[#f1f5f9]">
                        {unit.questions.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                            dir="rtl"
                            onClick={() => setSelectedQIds([q.id])}
                          >
                            {/* نص — يمين */}
                            <span className="text-[12px]" style={{ color: "#374151" }}>
                              {q.id}. {q.text}
                            </span>
                            {/* radio — شمال */}
                            <button
                              type="button"
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                              style={{
                                borderColor: selectedQIds.includes(q.id) ? BRAND : "#d1d5db",
                                background:  "transparent",
                              }}
                            >
                              {selectedQIds.includes(q.id) && (
                                <span className="w-2 h-2 rounded-full block" style={{ background: BRAND }} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* ── wait hours ── */}
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-right" style={{ color: "#374151" }}>
              عدد ساعات الانتظار قبل الإعادة عند الرسوب
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[6, 12, 24, 48].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setRules(r => ({ ...r, waitHours: h }))}
                  className="py-2.5 rounded-lg text-[13px] font-semibold border transition-all"
                  style={{
                    background:  rules.waitHours === h ? BRAND : "#fff",
                    color:       rules.waitHours === h ? "#fff" : "#374151",
                    borderColor: rules.waitHours === h ? BRAND : "#e5e7eb",
                  }}
                >
                  {h}س
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* ── content lock rules ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2" dir="rtl">
              <span style={{ color: "#f59e0b" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
              <p className="text-[13px] font-semibold" style={{ color: "#1f2937" }}>قواعد قفل المحتوى</p>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] overflow-hidden divide-y divide-[#f1f5f9]">
              {/* recorded sessions */}
              <div className="flex items-start gap-3 px-4 py-3" dir="rtl">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[12px] font-semibold" style={{ color: "#1f2937" }}>الدورات المسجلة</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#94a3b8" }}>
                    قفل صارم — لا تُفتح الجلسة التالية قبل اجتياز هذا الكويز
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#f1f5f9", color: "#64748b" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
              </div>

              {/* zoom sessions */}
              <div className="flex items-start gap-3 px-4 py-3" dir="rtl">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[12px] font-semibold" style={{ color: "#1f2937" }}>الجلسات الحضورية / Zoom</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#94a3b8" }}>
                    الحضور مفتوح دائماً — الريبلاي والمواد والتكليف تُقفل ناعماً حتى الاجتياز
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#f1f5f9", color: "#64748b" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
              </div>

              {/* certificate */}
              <div className="flex items-start gap-3 px-4 py-3" dir="rtl">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[12px] font-semibold" style={{ color: "#1f2937" }}>الشهادة</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#94a3b8" }}>
                    يُشترط اجتياز جميع كويزات تدريبية و كويزات مُقيَّمة لإصدار الشهادة
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#f1f5f9", color: "#64748b" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* ── question editor ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between" dir="rtl">
              <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>منشئ الأسئلة</p>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] font-medium border border-dashed rounded-md px-2.5 py-1 hover:bg-slate-50 transition-colors"
                style={{ borderColor: "#d1d5db", color: "#64748b" }}
              >
                <IcoUpload size={11} />
                رفع ملف أسئلة (Excel / CSV)
              </button>
            </div>
            <p className="text-[10px] text-right" style={{ color: "#94a3b8" }}>
              أو أضف الأسئلة يدويًا بالأسفل
            </p>

            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  onChange={updated => updateQuestion(q.id, updated)}
                  onRemove={() => removeQuestion(q.id)}
                />
              ))}
            </div>

            {/* add question */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium border border-dashed hover:bg-slate-50 transition-colors"
              style={{ borderColor: "#d1d5db", color: "#64748b" }}
            >
              <IcoPlus size={11} />
              إضافة سؤال
            </button>
          </div>

        </div>

        {/* ── footer ── */}
        <div className="shrink-0 px-4 py-3 border-t border-[#f0f0f0] flex items-center justify-between gap-3"
          style={{ background: "#fff" }}
          dir="rtl"
        >
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-medium px-4 py-2 rounded-md border border-[#e5e7eb] hover:bg-slate-50 transition-colors"
            style={{ color: "#64748b" }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-[12px] font-bold px-5 py-2 rounded-md text-white hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}
          >
            حفظ الكويز
          </button>
        </div>
      </div>
    </div>
  );
}
