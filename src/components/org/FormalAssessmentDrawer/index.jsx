import { useState, useRef, useEffect } from "react";
import { createProgramQuiz, updateProgramQuiz } from "../../../services/api";

const BRAND = "#024677";

// ─── Types ────────────────────────────────────────────────────────────────────
// امتحان رسمي  → category: 2, is_assignment: false
// واجب / تكليف → category: 1, is_assignment: true  (is_task: true اختياري)
const FORMAL_TYPES = [
  {
    key:           "exam",
    label:         "امتحان رسمي",
    sub:           "اختبار رسمي شامل للبرنامج",
    category:      2,
    is_assignment: false,
    is_task:       false,
  },
  {
    key:           "assignment",
    label:         "واجب / تكليف",
    sub:           "تكليف عملي مرتبط بوحدة أو جلسة",
    category:      1,
    is_assignment: true,
    is_task:       false,
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 14, sw = 1.8, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const IcoX      = ({ size = 13 }) => <Ico size={size} sw={2.2} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoPlus   = ({ size = 12 }) => <Ico size={size} sw={2.4} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoUpload = ({ size = 13 }) => <Ico size={size} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />;
const IcoSpinner = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round"
    style={{ display: "block", animation: "spin 0.8s linear infinite" }}>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

// ─── field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="space-y-1" dir="rtl">
      <label className="block text-[11px] font-semibold" style={{ color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = `w-full text-[12px] px-3 rounded-md border border-[#e5e7eb] bg-white
  focus:outline-none focus:ring-1 focus:ring-[#024677]/30 focus:border-[#024677]
  placeholder:text-slate-300 transition`;

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between" dir="rtl">
      <span className="text-[12px]" style={{ color: "#374151" }}>{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full relative transition-colors shrink-0"
        style={{ background: value ? BRAND : "#d1d5db" }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ right: value ? "2px" : "auto", left: value ? "auto" : "2px" }} />
      </button>
    </div>
  );
}

// ─── AnswerOption ─────────────────────────────────────────────────────────────
function AnswerOption({ value, correct, index, onChange, onCorrect, onRemove }) {
  return (
    <div className="flex items-center gap-2" dir="rtl">
      <button type="button" onClick={onCorrect}
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
        style={{ borderColor: correct ? BRAND : "#d1d5db", background: "transparent" }}>
        {correct && <span className="w-2 h-2 rounded-full block" style={{ background: BRAND }} />}
      </button>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={`الخيار ${index + 1}`}
        className={`${inputCls} flex-1 h-8`} dir="rtl" />
      {correct && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: "#dcfce7", color: "#16a34a" }}>صحيحة</span>
      )}
      <button type="button" onClick={onRemove}
        className="shrink-0 text-slate-300 hover:text-red-400 transition-colors">
        <IcoX size={11} />
      </button>
    </div>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onChange, onRemove }) {
  const [qType, setQType] = useState("اختيار");
  const TYPE_OPTS = ["اختيار", "صح/خطأ", "مقالي"];

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
    onChange({ ...question, answers: question.answers.filter((_, i) => i !== ai) });
  };
  const addAnswer = () => {
    if (question.answers.length >= 6) return;
    onChange({ ...question, answers: [...question.answers, { text: "", correct: false }] });
  };

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden" dir="rtl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#f1f5f9]"
        style={{ background: "#f8fafc" }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: BRAND }}>س {index + 1}</span>
          <button type="button" onClick={onRemove}
            className="text-slate-300 hover:text-red-400 transition-colors p-0.5">
            <IcoX size={13} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {TYPE_OPTS.map(t => (
            <button key={t} type="button" onClick={() => setQType(t)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all"
              style={{
                background:  qType === t ? BRAND : "#fff",
                color:       qType === t ? "#fff" : "#64748b",
                borderColor: qType === t ? BRAND : "#e5e7eb",
              }}>{t}</button>
          ))}
        </div>
      </div>
      <div className="px-3 py-2.5 space-y-2.5">
        <textarea value={question.text}
          onChange={e => onChange({ ...question, text: e.target.value })}
          placeholder="اكتب نص السؤال هنا..." rows={2}
          className={`${inputCls} resize-none py-2`} dir="rtl" />
        {qType !== "مقالي" && (
          <div className="space-y-2">
            {question.answers.map((ans, ai) => (
              <AnswerOption key={ai} index={ai} value={ans.text} correct={ans.correct}
                onChange={val => updateAnswer(ai, val)}
                onCorrect={() => setCorrect(ai)}
                onRemove={() => removeAnswer(ai)} />
            ))}
            {question.answers.length < 6 && (
              <button type="button" onClick={addAnswer}
                className="flex items-center gap-1 text-[11px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: BRAND }}>
                <IcoPlus size={10} /> إضافة خيار
              </button>
            )}
          </div>
        )}
        {qType === "مقالي" && (
          <p className="text-[10px] italic" style={{ color: "#94a3b8" }}>
            سؤال مقالي — التصحيح يدوي من المدرب
          </p>
        )}
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function makeBlankQuestion() {
  return {
    id: Date.now() + Math.random(),
    text: "",
    answers: [
      { text: "", correct: true  },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
    ],
  };
}

function questionToApi(q, idx) {
  return {
    body:       q.text,
    type:       0,
    sort_order: idx + 1,
    options: q.answers
      .filter(a => a.text.trim())   // شيل الخيارات الفاضية
      .map((a, i) => ({
        body:       a.text.trim(),
        is_correct: a.correct ? 1 : 0,
        sort_order: i + 1,
      })),
  };
}

const FILE_TYPES = ["PDF", "DOCX", "PPTX", "ZIP", "Figma URL", "GitHub URL"];

// ─── Main Drawer ──────────────────────────────────────────────────────────────
/**
 * Props:
 *   open       – boolean
 *   onClose    – fn
 *   programId  – number (required for API call)
 *   onSave     – fn(savedData)
 */
export default function FormalAssessmentDrawer({ open, onClose, programId, quiz = null, onSave }) {
  const isEditMode = !!quiz;
  const fileRef = useRef();

  // نوع التقييم
  const [typeKey,   setTypeKey]   = useState("exam");

  // basic info
  const [title,        setTitle]        = useState("");
  const [desc,         setDesc]         = useState("");
  const [duration,     setDuration]     = useState(60);
  const [startDate,    setStartDate]    = useState("");
  const [dueDate,      setDueDate]      = useState("");
  const [passMark,     setPassMark]     = useState("");
  const [weightPct,    setWeightPct]    = useState("");
  const [maxAttempts,  setMaxAttempts]  = useState(1);
  const [allowRetake,  setAllowRetake]  = useState(false);
  const [isPublished,  setIsPublished]  = useState(true);

  // عبّئ الـ form لما يُفتح في edit mode
  useEffect(() => {
    if (!open) return;
    if (quiz) {
      setTypeKey(quiz.is_assignment ? "assignment" : "exam");
      setTitle(quiz.title ?? "");
      setDesc(quiz.description ?? "");
      setDuration(quiz.duration_minutes ?? 60);
      setStartDate(quiz.starts_at ? quiz.starts_at.replace(" ", "T").slice(0, 16) : "");
      setDueDate(quiz.due_date   ? quiz.due_date.replace(" ", "T").slice(0, 16)   : "");
      setPassMark(quiz.pass_percent  != null ? String(quiz.pass_percent)  : "");
      setWeightPct(quiz.weight_percent != null ? String(quiz.weight_percent) : "");
      setMaxAttempts(quiz.max_attempts ?? 1);
      setAllowRetake(!!quiz.allow_retake);
      setIsPublished(!!quiz.is_published);

      // عبّئ الأسئلة لو موجودة
      const apiQuestions = quiz.questions ?? [];
      if (apiQuestions.length > 0) {
        setQuestions(apiQuestions.map(q => ({
          id:      q.id ?? (Date.now() + Math.random()),
          apiId:   q.id,
          text:    q.body ?? "",
          qType:   "اختيار",
          answers: (q.options ?? []).map(opt => ({
            id:      opt.id,
            text:    opt.body ?? "",
            correct: opt.is_correct === true || opt.is_correct === 1,
          })),
        })));
      } else {
        setQuestions([makeBlankQuestion()]);
      }
    } else {
      setTypeKey("exam"); setTitle(""); setDesc(""); setDuration(60);
      setStartDate(""); setDueDate(""); setPassMark(""); setWeightPct("");
      setMaxAttempts(1); setAllowRetake(false); setIsPublished(true);
      setQuestions([makeBlankQuestion()]);
    }
  }, [open, quiz]);

  // allowed types (للواجب)
  const [allowedTypes, setAllowedTypes] = useState(["PDF", "DOCX"]);
  const [uploadedFile, setUploadedFile] = useState(null);

  // questions (للامتحان الرسمي)
  const [questions, setQuestions] = useState([makeBlankQuestion()]);

  // API state
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const toggleType = (t) =>
    setAllowedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const addQuestion    = () => setQuestions(prev => [...prev, makeBlankQuestion()]);
  const removeQuestion = (id) => setQuestions(prev => prev.filter(q => q.id !== id));
  const updateQuestion = (id, upd) => setQuestions(prev => prev.map(q => q.id === id ? upd : q));

  const resetForm = () => {
    setTypeKey("exam");
    setTitle(""); setDesc(""); setDuration(60); setStartDate(""); setDueDate("");
    setPassMark(""); setWeightPct(""); setMaxAttempts(1);
    setAllowRetake(false); setIsPublished(true);
    setAllowedTypes(["PDF", "DOCX"]); setUploadedFile(null);
    setQuestions([makeBlankQuestion()]); setError(null);
  };

  const handleClose = () => { resetForm(); onClose?.(); };

  const handleSave = async () => {
    if (!title.trim())  { setError("عنوان التقييم مطلوب"); return; }
    if (!programId)     { setError("لا يوجد برنامج محدد"); return; }

    const conf = FORMAL_TYPES.find(t => t.key === typeKey) ?? FORMAL_TYPES[0];

    const fd = new FormData();
    fd.append("category",              String(conf.category));
    fd.append("is_assignment",         conf.is_assignment ? "1" : "0");
    fd.append("is_task", conf.is_assignment ? "1" : "0");
    fd.append("title[ar]",             title.trim());
    fd.append("title[en]",             title.trim());
    if (desc.trim()) {
      fd.append("description[ar]", desc.trim());
      fd.append("description[en]", desc.trim());
    }
    fd.append("duration_minutes",      String(duration));
    fd.append("pass_percent",          passMark  !== "" ? String(passMark)  : "0");
    fd.append("weight_percent",        weightPct !== "" ? String(weightPct) : "0");
    fd.append("max_attempts",          String(maxAttempts));
    fd.append("allow_retake",          allowRetake ? "1" : "0");
    fd.append("is_published",          isPublished ? "1" : "0");
    fd.append("is_optional",           "0");
    if (startDate) fd.append("starts_at", startDate);
    if (dueDate)   fd.append("due_date",  dueDate);
    fd.append("scope_sessions[]", "");
    fd.append("scope_units[]",    "");

    // أسئلة الامتحان الرسمي فقط
    if (typeKey === "exam") {
      questions
        .filter(q => q.text.trim())
        .filter(q => {
          // شيل أسئلة الاختيار المتعدد اللي عندها أقل من خيارين
          const filledOpts = q.answers.filter(a => a.text.trim());
          return filledOpts.length >= 2;
        })
        .map(questionToApi).forEach((q, qi) => {
        fd.append(`questions[${qi}][body][ar]`, q.body);
        fd.append(`questions[${qi}][body][en]`, q.body);
        fd.append(`questions[${qi}][type]`,       String(q.type));
        fd.append(`questions[${qi}][sort_order]`, String(q.sort_order));
        q.options.forEach((opt, oi) => {
          fd.append(`questions[${qi}][options][${oi}][body][ar]`, opt.body);
          fd.append(`questions[${qi}][options][${oi}][body][en]`, opt.body);
          fd.append(`questions[${qi}][options][${oi}][is_correct]`, String(opt.is_correct));
          fd.append(`questions[${qi}][options][${oi}][sort_order]`, String(opt.sort_order));
        });
      });
    }

    setSaving(true);
    setError(null);
    try {
      const res = isEditMode
        ? await updateProgramQuiz(programId, quiz.id, fd)
        : await createProgramQuiz(programId, fd);
      const saved = res?.data ?? res;
      onSave?.(saved);
      resetForm();
      onClose?.();
    } catch (e) {
      setError(e?.message || "تعذر حفظ التقييم، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isAssignment = typeKey === "assignment";

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="fixed inset-0 z-50 flex" dir="rtl">
        {/* overlay */}
        <div className="flex-1 bg-black/25" onClick={handleClose} />

        {/* panel */}
        <div className="flex flex-col bg-white h-full overflow-hidden"
          style={{ width: "clamp(480px, 55vw, 720px)", borderLeft: "1px solid #e5e7eb", boxShadow: "-4px 0 24px rgba(0,0,0,0.07)" }}>

          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0" dir="rtl">
            <h2 className="text-[14px] font-semibold" style={{ color: "#1f2937" }}>
              {isEditMode ? "تعديل التقييم" : "إضافة تقييم رسمي"}
            </h2>
            <button type="button" onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-slate-400">
              <IcoX size={13} />
            </button>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* ── نوع التقييم ── */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-right" style={{ color: "#374151" }}>نوع التقييم</p>
              <div className="flex rounded-lg p-1 gap-1" style={{ background: "#f1f5f9" }} dir="rtl">
                {FORMAL_TYPES.map(opt => (
                  <button key={opt.key} type="button"
                    onClick={() => setTypeKey(opt.key)}
                    className="flex-1 rounded-md px-3 py-2 text-right transition-all duration-150"
                    style={{
                      background: typeKey === opt.key ? "#fff" : "transparent",
                      boxShadow:  typeKey === opt.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}>
                    <p className="text-[12px] font-semibold"
                      style={{ color: typeKey === opt.key ? BRAND : "#94a3b8" }}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] mt-0.5"
                      style={{ color: typeKey === opt.key ? "#64748b" : "#cbd5e1" }}>
                      {opt.sub}
                    </p>
                  </button>
                ))}
              </div>

              {/* badge يوضح القيم */}
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9" }} />

            {/* ── basic info ── */}
            <Field label="العنوان" required>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder={isAssignment ? "مثال: واجب الوحدة الأولى" : "مثال: الامتحان النهائي الشامل"}
                className={`${inputCls} h-9`} dir="rtl" />
            </Field>

            <Field label="الوصف">
              <textarea value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="وصف مختصر..." rows={2}
                className={`${inputCls} resize-none py-2`} dir="rtl" />
            </Field>

            {/* row: مدة + وزن */}
            <div className="grid grid-cols-2 gap-3">
              {!isAssignment && (
                <Field label="المدة (دقيقة)">
                  <input type="number" min={1} value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
              )}
              <Field label="نسبة النجاح %">
                <input type="number" min={0} max={100} value={passMark}
                  onChange={e => setPassMark(e.target.value)}
                  placeholder="مثال: 60"
                  className={`${inputCls} h-9`} dir="ltr" />
              </Field>
              <Field label="الوزن في التقييم %">
                <input type="number" min={0} max={100} value={weightPct}
                  onChange={e => setWeightPct(e.target.value)}
                  placeholder="مثال: 40"
                  className={`${inputCls} h-9`} dir="ltr" />
              </Field>
              {!isAssignment && (
                <Field label="عدد المحاولات">
                  <input type="number" min={1} value={maxAttempts}
                    onChange={e => setMaxAttempts(Number(e.target.value))}
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
              )}
            </div>

            {/* تواريخ */}
            <div className="grid grid-cols-2 gap-3">
              <Field label={isAssignment ? "تاريخ الفتح" : "تاريخ بداية الامتحان"}>
                <input type="datetime-local" value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={`${inputCls} h-9`} dir="ltr" />
              </Field>
              <Field label="الموعد النهائي">
                <input type="datetime-local" value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={`${inputCls} h-9`} dir="ltr" />
              </Field>
            </div>

            {/* toggles */}
            <div className="space-y-2.5">
              {!isAssignment && (
                <Toggle label="السماح بالإعادة" value={allowRetake} onChange={setAllowRetake} />
              )}
              <Toggle label="منشور (مرئي للمتدربين)" value={isPublished} onChange={setIsPublished} />
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9" }} />

            {/* ── واجب: أنواع الملفات + مرفقات ── */}
            {isAssignment && (
              <>
                <div className="space-y-2" dir="rtl">
                  <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>
                    أنواع الملفات المقبولة للتسليم
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FILE_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => toggleType(t)}
                        className="px-3 py-1 rounded-full text-[11px] font-medium border transition-all"
                        style={{
                          background:  allowedTypes.includes(t) ? BRAND  : "#fff",
                          color:       allowedTypes.includes(t) ? "#fff" : "#374151",
                          borderColor: allowedTypes.includes(t) ? BRAND  : "#e5e7eb",
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5" dir="rtl">
                  <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>مرفقات المدرب</p>
                  <div
                    className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "#d1d5db" }}
                    onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" className="hidden"
                      onChange={e => setUploadedFile(e.target.files?.[0] ?? null)} />
                    <IcoUpload size={20} stroke="#94a3b8" />
                    {uploadedFile
                      ? <p className="text-[12px] font-medium" style={{ color: BRAND }}>{uploadedFile.name}</p>
                      : <>
                          <p className="text-[12px] font-medium" style={{ color: "#374151" }}>اسحب الملف هنا أو اضغط للاختيار</p>
                          <p className="text-[10px]" style={{ color: "#94a3b8" }}>PDF, DOC, ZIP, 20 ميغابايت</p>
                        </>
                    }
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9" }} />
              </>
            )}

            {/* ── امتحان رسمي: منشئ الأسئلة ── */}
            {!isAssignment && (
              <div className="space-y-3" dir="rtl">
                <p className="text-[13px] font-semibold text-right" style={{ color: "#374151" }}>
                  الأسئلة ({questions.length})
                </p>
                <button type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-medium border hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#e5e7eb", color: "#64748b" }}>
                  <IcoUpload size={13} />
                  رفع ملف أسئلة جاهز (Excel / CSV)
                </button>
                <p className="text-[11px] text-right" style={{ color: "#94a3b8" }}>
                  أو أضف الأسئلة يدوياً:
                </p>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} index={i}
                      onChange={upd => updateQuestion(q.id, upd)}
                      onRemove={() => removeQuestion(q.id)} />
                  ))}
                </div>
                <button type="button" onClick={addQuestion}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-medium border border-dashed hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#d1d5db", color: "#64748b" }}>
                  <IcoPlus size={11} /> + إضافة سؤال
                </button>
              </div>
            )}

          </div>

          {/* footer */}
          <div className="shrink-0 px-4 py-3 border-t border-[#f0f0f0] space-y-2" dir="rtl">
            {error && (
              <p className="text-[11px] text-red-500 text-right bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={handleClose}
                className="text-[12px] font-medium px-4 py-2 rounded-md border border-[#e5e7eb] hover:bg-slate-50 transition-colors"
                style={{ color: "#64748b" }}>
                إلغاء
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 text-[12px] font-bold px-5 py-2 rounded-md text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: BRAND }}>
                {saving && <IcoSpinner size={13} />}
                {saving ? "جارٍ الحفظ…" : isEditMode ? "حفظ التعديلات" : (isAssignment ? "حفظ الواجب" : "حفظ الامتحان")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
