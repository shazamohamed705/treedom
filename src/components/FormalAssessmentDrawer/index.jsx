import { useState, useRef } from "react";

const BRAND = "#024677";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 14, sw = 1.8, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const IcoX       = ({ size = 13 }) => <Ico size={size} sw={2.2} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoPlus    = ({ size = 12 }) => <Ico size={size} sw={2.4} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoTrash   = ({ size = 12 }) => <Ico size={size} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />;
const IcoUpload  = ({ size = 13 }) => <Ico size={size} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />;
const IcoCal     = ({ size = 13 }) => <Ico size={size} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;

// ─── allowed file types ───────────────────────────────────────────────────────
const FILE_TYPES = ["PDF", "DOCX", "PPTX", "ZIP", "Figma URL", "GitHub URL"];

// ─── field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1" dir="rtl">
      <label className="block text-[11px] font-semibold" style={{ color: "#374151" }}>{label}</label>
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

  const TYPE_OPTS = ["اختيار", "صح/خطأ", "مقالي"];

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden" dir="rtl">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#f1f5f9]"
        style={{ background: "#f8fafc" }}>
        {/* right: label + delete */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: BRAND }}>س {index + 1}</span>
          <button type="button" onClick={onRemove}
            className="text-slate-300 hover:text-red-400 transition-colors p-0.5">
            <IcoX size={13} />
          </button>
        </div>
        {/* left: type badges */}
        <div className="flex items-center gap-1">
          {TYPE_OPTS.map(t => (
            <button key={t} type="button" onClick={() => setQType(t)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all"
              style={{
                background:  qType === t ? BRAND : "#fff",
                color:       qType === t ? "#fff" : "#64748b",
                borderColor: qType === t ? BRAND : "#e5e7eb",
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* question text */}
        <textarea value={question.text}
          onChange={e => onChange({ ...question, text: e.target.value })}
          placeholder="اكتب نص السؤال هنا..."
          rows={2}
          className={`${inputCls} resize-none py-2`} dir="rtl" />

        {/* answers */}
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
                <IcoPlus size={10} />
                إضافة خيار
              </button>
            )}
          </div>
        )}

        <p className="text-[10px] text-right" style={{ color: "#94a3b8" }}>
          اضغط على الدائرة لتحديد الإجابة الصحيحة
        </p>
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function FormalAssessmentDrawer({ open, onClose, onSave }) {
  const fileRef = useRef();

  // basic info
  const [title,     setTitle]     = useState("");
  const [duration,  setDuration]  = useState(60);
  const [dueDate,   setDueDate]   = useState("");
  const [startDate, setStartDate] = useState("");
  const [instructions, setInstructions] = useState("");

  // allowed types
  const [allowedTypes, setAllowedTypes] = useState(["PDF", "DOCX"]);

  // uploaded file
  const [uploadedFile, setUploadedFile] = useState(null);

  // pass mark
  const [passMark, setPassMark] = useState(40);

  // questions
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

  const toggleType = (t) =>
    setAllowedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const addQuestion = () => setQuestions(prev => [
    ...prev,
    { id: Date.now(), text: "", answers: [
      { text: "", correct: true  },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
    ]},
  ]);

  const removeQuestion = (id) => setQuestions(prev => prev.filter(q => q.id !== id));
  const updateQuestion = (id, updated) =>
    setQuestions(prev => prev.map(q => q.id === id ? updated : q));

  const handleSave = () => {
    onSave?.({ title, duration, dueDate, startDate, instructions, allowedTypes, passMark, questions });
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* overlay */}
      <div className="flex-1 bg-black/25" onClick={onClose} />

      {/* panel */}
      <div className="flex flex-col bg-white h-full overflow-hidden"
        style={{
          width: "clamp(480px, 55vw, 720px)",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.07)",
        }}>

        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0" dir="rtl">
          <h2 className="text-[14px] font-semibold" style={{ color: "#1f2937" }}>
            إنشاء امتحان تقييمي
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-slate-400">
            <IcoX size={13} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* عنوان الامتحان */}
          <Field label="عنوان الامتحان">
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="مثال: الامتحان النهائي — الوحدة الثانية"
              className={`${inputCls} h-9`} dir="rtl" />
          </Field>

          {/* row: مدة + تاريخ */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="مدة الامتحان (دقيقة)">
              <div className="relative">
                <input type="number" value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className={`${inputCls} h-9 pl-10`} dir="rtl" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px]"
                  style={{ color: "#94a3b8" }}>دقيقة</span>
              </div>
              <p className="text-[10px] mt-0.5 text-right" style={{ color: "#94a3b8" }}>
                على المجموع الدرجة الكلية
              </p>
            </Field>
            <Field label="تاريخ وموعد بداية الامتحان">
              <div className="relative">
                <input type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={`${inputCls} h-9`} dir="rtl" />
              </div>
            </Field>
          </div>

          {/* تعليمات */}
          <Field label="تعليمات الامتحان">
            <textarea value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="اكتب التعليمات بالتفصيل..."
              rows={3}
              className={`${inputCls} resize-none py-2`} dir="rtl" />
          </Field>

          {/* أنواع الملفات */}
          <div className="space-y-2" dir="rtl">
            <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>
              أنواع الملفات المسموح بها
            </p>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPES.map(t => (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium border transition-all"
                  style={{
                    background:  allowedTypes.includes(t) ? BRAND      : "#fff",
                    color:       allowedTypes.includes(t) ? "#fff"     : "#374151",
                    borderColor: allowedTypes.includes(t) ? BRAND      : "#e5e7eb",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* مرفقات المدرب */}
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

          {/* منشئ الأسئلة */}
          <div className="space-y-3" dir="rtl">
            {/* header row */}
            <p className="text-[13px] font-semibold text-right" style={{ color: "#374151" }}>منشئ الأسئلة</p>

            {/* upload full-width button */}
            <button type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-medium border hover:bg-slate-50 transition-colors"
              style={{ borderColor: "#e5e7eb", color: "#64748b" }}>
              <IcoUpload size={13} />
              رفع ملف أسئلة جاهز (Excel / CSV)
            </button>

            <p className="text-[11px] text-right" style={{ color: "#94a3b8" }}>
              أو أضف الأسئلة يدوياً بالأسفل:
            </p>

            {/* question cards */}
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionCard key={q.id} question={q} index={i}
                  onChange={updated => updateQuestion(q.id, updated)}
                  onRemove={() => removeQuestion(q.id)} />
              ))}
            </div>

            {/* add question */}
            <button type="button" onClick={addQuestion}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-medium border border-dashed hover:bg-slate-50 transition-colors"
              style={{ borderColor: "#d1d5db", color: "#64748b" }}>
              <IcoPlus size={11} />
              + إضافة سؤال
            </button>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* الفوز في السكور النهائي */}
          <div className="space-y-2" dir="rtl">
            <p className="text-[13px] font-semibold text-right" style={{ color: "#374151" }}>
              الفوز في السكور النهائي
            </p>
            <div className="flex items-center gap-3" dir="rtl">
              <span className="text-[12px]" style={{ color: "#64748b" }}>
                % من مجموع الدرجة النهائية
              </span>
              <input
                type="number"
                value={passMark}
                onChange={e => setPassMark(Number(e.target.value))}
                className="w-16 text-[13px] font-bold text-center h-9 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#024677]"
                style={{ color: BRAND }}
              />
            </div>
          </div>

        </div>

        {/* footer */}
        <div className="shrink-0 px-4 py-3 border-t border-[#f0f0f0] flex items-center justify-between gap-3"
          dir="rtl">
          <button type="button" onClick={onClose}
            className="text-[12px] font-medium px-4 py-2 rounded-md border border-[#e5e7eb] hover:bg-slate-50 transition-colors"
            style={{ color: "#64748b" }}>
            إلغاء
          </button>
          <button type="button" onClick={handleSave}
            className="text-[12px] font-bold px-5 py-2 rounded-md text-white hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}>
            حفظ الامتحان
          </button>
        </div>
      </div>
    </div>
  );
}
