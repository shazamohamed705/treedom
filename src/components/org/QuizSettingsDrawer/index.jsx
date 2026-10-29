import { useState, useEffect } from "react";
import { createProgramQuiz, updateProgramQuiz, fetchProgramQuiz, deleteProgramQuiz, fetchProgramUnits, fetchProgramUnit } from "../../../services/api";
import { useToast } from "../../shared/ToastProvider";

const BRAND = "#024677";

// category: 0=تدريبي | 1=مقيّم
const QUIZ_TYPES = [
  { key: "practice",  label: "كويز تدريبي", sub: "كويز تدريبي بعد الدرس", category: 0, is_assignment: false },
  { key: "evaluated", label: "كويز مُقيَّم", sub: "كويز مراجعة موديول",    category: 1, is_assignment: false },
];

// MOCK_BANK حُذف — الوحدات والجلسات بتيجي من الـ API عبر programId

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 14, sw = 1.8, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const IcoX       = ({ size = 14 }) => <Ico size={size} sw={2.2} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoPlus    = ({ size = 12 }) => <Ico size={size} sw={2.4} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoTrash   = ({ size = 12 }) => <Ico size={size} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />;
const IcoUpload  = ({ size = 12 }) => <Ico size={size} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />;
const IcoSpinner = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round"
    style={{ display: "block", animation: "spin 0.8s linear infinite" }}>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

// ─── Field ────────────────────────────────────────────────────────────────────
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
function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="w-9 h-5 rounded-full relative transition-colors shrink-0"
      style={{ background: value ? BRAND : "#d1d5db" }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ right: value ? "2px" : "auto", left: value ? "auto" : "2px" }} />
    </button>
  );
}

// ─── AnswerOption ─────────────────────────────────────────────────────────────
function AnswerOption({ value, correct, index, onChange, onCorrect, onRemove }) {
  return (
    <div className="flex items-center gap-2" dir="rtl">
      <button type="button" onClick={onCorrect}
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
        style={{ borderColor: correct ? BRAND : "#d1d5db", background: correct ? BRAND : "#fff" }}
        title="اختر الإجابة الصحيحة">
        {correct && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
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
function QuestionCard({ question, index, onChange, onRemove, editMode = false }) {
  const qType = question.qType ?? 0;

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

  const trueFalseAnswers = [
    { text: "صح",  correct: question.answers[0]?.correct ?? true  },
    { text: "خطأ", correct: question.answers[1]?.correct ?? false },
  ];

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden" dir="rtl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#f1f5f9]"
        style={{ background: "#f8fafc" }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: BRAND }}>سؤال {index + 1}</span>
          <div className="flex items-center gap-1">
            {[{ v: 0, label: "اختيار" }, { v: 1, label: "صح/خطأ" }, { v: 2, label: "مقالي" }].map(t => (
              <button key={t.v} type="button"
                onClick={() => onChange({
                  ...question, qType: t.v,
                  answers: t.v === 1
                    ? [{ text: "صح", correct: true }, { text: "خطأ", correct: false }]
                    : question.answers,
                })}
                className="text-[10px] px-2 py-0.5 rounded border transition-all"
                style={{
                  background:  qType === t.v ? BRAND : "#fff",
                  color:       qType === t.v ? "#fff" : "#94a3b8",
                  borderColor: qType === t.v ? BRAND : "#e5e7eb",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {!editMode && (
          <button type="button" onClick={onRemove}
            className="text-slate-300 hover:text-red-400 transition-colors p-0.5">
            <IcoTrash size={12} />
          </button>
        )}
      </div>

      <div className="px-3 py-2.5 space-y-3">
        <textarea value={question.text}
          onChange={e => onChange({ ...question, text: e.target.value })}
          placeholder="اكتب نص السؤال هنا..." rows={2}
          className={`${inputCls} resize-none py-2`} dir="rtl" />

        {qType === 0 && (
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

        {qType === 1 && (
          <div className="flex gap-3">
            {trueFalseAnswers.map((ans, ai) => (
              <button key={ai} type="button"
                onClick={() => onChange({
                  ...question,
                  answers: trueFalseAnswers.map((a, i) => ({ ...a, correct: i === ai })),
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all"
                style={{
                  background:  ans.correct ? BRAND : "#fff",
                  color:       ans.correct ? "#fff" : "#374151",
                  borderColor: ans.correct ? BRAND : "#e5e7eb",
                }}>
                {ans.text}
              </button>
            ))}
          </div>
        )}

        {qType === 2 && (
          <p className="text-[11px] italic" style={{ color: "#94a3b8" }}>
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
    id:      Date.now() + Math.random(),
    text:    "",
    qType:   0,
    answers: [
      { text: "", correct: true  },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
    ],
  };
}

function questionToApi(q, idx) {
  const type = q.type ?? q.qType ?? 0;  // 0=MCQ | 1=True/False | 2=Essay
  let options = [];
  if (type === 0) {
    options = q.answers
      .filter(a => a.text.trim())
      .map((a, i) => ({
        ...(a.id ? { id: a.id } : {}),   // أبعت الـ id لو موجود (تعديل)
        body:       a.text.trim(),
        is_correct: a.correct ? 1 : 0,
        sort_order: i + 1,
      }));
  } else if (type === 1) {
    options = [
      { ...(q.answers[0]?.id ? { id: q.answers[0].id } : {}), body: "صح",  is_correct: (q.answers[0]?.correct ?? true)  ? 1 : 0, sort_order: 1 },
      { ...(q.answers[1]?.id ? { id: q.answers[1].id } : {}), body: "خطأ", is_correct: (q.answers[1]?.correct ?? false) ? 1 : 0, sort_order: 2 },
    ];
  }
  return {
    ...(q.apiId ? { id: q.apiId } : {}),   // أبعت الـ id للسؤال لو موجود (تعديل)
    body:       q.text.trim(),
    type,
    sort_order: idx + 1,
    options,
  };
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function QuizSettingsDrawer({
  open,
  onClose,
  programId,
  lessonTitle     = "",
  scopeSessionIds = [],
  scopeUnitIds    = [],
  quiz            = null,
  onSave,
  onDelete,
}) {
  const isEditMode = !!quiz;
  const showToast  = useToast();

  const [title,        setTitle]        = useState("");
  const [desc,         setDesc]         = useState("");
  const [typeKey,      setTypeKey]      = useState("practice");
  const [durationMin,  setDurationMin]  = useState(30);
  const [passPct,      setPassPct]      = useState(60);
  const [maxAttempts,  setMaxAttempts]  = useState(3);
  const [cooldownMin,  setCooldownMin]  = useState(120);
  const [allowRetake,  setAllowRetake]  = useState(true);
  const [retakeOnFail, setRetakeOnFail] = useState(true);
  const [isPublished,  setIsPublished]  = useState(true);
  const [weightPct,    setWeightPct]    = useState("");
  const [startsAt,     setStartsAt]     = useState("");
  const [dueDate,      setDueDate]      = useState("");
  const [questions,         setQuestions]         = useState([makeBlankQuestion()]);
  const [questionsModified, setQuestionsModified] = useState(false); // لتتبع لو المستخدم عدّل الأسئلة

  // ── وحدات وجلسات البرنامج (للكويز المُقيَّم)
  const [unitBank,        setUnitBank]        = useState([]);
  const [bankLoading,     setBankLoading]     = useState(false);
  const [openUnits,       setOpenUnits]       = useState(new Set());
  const [selectedUnitId,  setSelectedUnitId]  = useState(null);
  const [selectedSessIds, setSelectedSessIds] = useState(new Set());

  // عبّئ الـ form لما يتغير الـ quiz prop (edit mode)
  useEffect(() => {
    if (!open) return;
    if (quiz) {
      // map category → typeKey
      const cat = quiz.category?.value ?? quiz.category;
      const tk = cat === 1 ? "evaluated" : "practice";
      setTypeKey(tk);
      setTitle(quiz.title ?? "");
      setDesc(quiz.description ?? "");
      setDurationMin(quiz.duration_minutes ?? 30);
      setPassPct(quiz.pass_percent ?? 60);
      setMaxAttempts(quiz.max_attempts ?? 3);
      setCooldownMin(quiz.cooldown_minutes ?? 120);
      setAllowRetake(!!quiz.allow_retake);
      setRetakeOnFail(!!quiz.retake_only_if_failed);
      setIsPublished(!!quiz.is_published);
      setWeightPct(quiz.weight_percent != null ? String(quiz.weight_percent) : "");
      setStartsAt(quiz.starts_at ? quiz.starts_at.replace(" ", "T").slice(0, 16) : "");
      setDueDate(quiz.due_date   ? quiz.due_date.replace(" ", "T").slice(0, 16)   : "");
      // scope
      const sessIds = quiz.scope_sessions?.map(s => s.id ?? s) ?? [];
      const unitIds = quiz.scope_units?.map(u => u.id ?? u) ?? [];
      setSelectedSessIds(new Set(sessIds));
      setSelectedUnitId(unitIds[0] ?? null);

      // اجلب الأسئلة من الـ quiz object مباشرة لو موجودة
      const apiQuestions = quiz.questions ?? [];
      if (apiQuestions.length === 0) {
        setQuestions([makeBlankQuestion()]);
      } else {
        setQuestions(apiQuestions.map(q => {
          const qType = q.type?.value ?? q.type ?? 0;
          const answers = (q.options ?? []).map(opt => ({
            id:      opt.id,
            text:    opt.body ?? "",
            correct: opt.is_correct === true || opt.is_correct === 1,
          }));
          const finalAnswers = answers.length > 0 ? answers : [
            { text: "", correct: true  },
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
          ];
          return {
            id:      q.id ?? (Date.now() + Math.random()),
            apiId:   q.id,
            text:    q.body ?? "",
            qType,
            answers: finalAnswers,
          };
        }));
      }
      setQuestionsModified(false);
    } else {
      // new mode — reset
      setTitle(""); setDesc(""); setTypeKey("practice");
      setDurationMin(30); setPassPct(60); setMaxAttempts(3);
      setCooldownMin(120); setAllowRetake(true); setRetakeOnFail(true);
      setIsPublished(true); setWeightPct(""); setStartsAt(""); setDueDate("");
      setQuestions([makeBlankQuestion()]);
      setOpenUnits(new Set()); setSelectedUnitId(null); setSelectedSessIds(new Set());
    }
  }, [open, quiz]);

  // reset unitBank لما يتغير البرنامج
  useEffect(() => {
    setUnitBank([]);
    setOpenUnits(new Set());
    setSelectedUnitId(null);
    setSelectedSessIds(new Set());
  }, [programId]);

  // اجلب الوحدات لما يتغير programId أو يُفتح الـ drawer
  useEffect(() => {
    if (!open || !programId || typeKey !== "evaluated") return;
    if (unitBank.length > 0) return; // already loaded
    let alive = true;
    setBankLoading(true);
    (async () => {
      try {
        const res  = await fetchProgramUnits(programId);
        let list   = res?.data?.units ?? res?.data?.data?.units ?? res?.data?.data ?? res?.data ?? [];
        if (!Array.isArray(list)) list = [];
        // اجلب جلسات كل وحدة لو مش موجودة
        list = await Promise.all(list.map(async (u) => {
          if (Array.isArray(u.sessions) && u.sessions.length > 0) return u;
          try {
            const r = await fetchProgramUnit(programId, u.id);
            return { ...u, sessions: r?.data?.unit?.sessions ?? r?.data?.sessions ?? [] };
          } catch { return { ...u, sessions: [] }; }
        }));
        if (!alive) return;
        setUnitBank(list.map(u => ({
          id:       u.id,
          title:    u.title?.ar || u.title?.en || `وحدة ${u.id}`,
          sessions: (u.sessions || []).map(s => ({
            id:    s.id,
            title: s.title?.ar || s.title?.en || `جلسة ${s.id}`,
          })),
        })));
      } catch { /* fail silently */ }
      finally { if (alive) setBankLoading(false); }
    })();
    return () => { alive = false; };
  }, [open, programId, typeKey]);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const addQuestion    = () => { setQuestionsModified(true); setQuestions(prev => [...prev, makeBlankQuestion()]); };
  const removeQuestion = (id) => { setQuestionsModified(true); setQuestions(prev => prev.filter(q => q.id !== id)); };
  const updateQuestion = (id, upd) => { setQuestionsModified(true); setQuestions(prev => prev.map(q => q.id === id ? upd : q)); };

  const resetForm = () => {
    setTitle(""); setDesc(""); setTypeKey("practice");
    setDurationMin(30); setPassPct(60); setMaxAttempts(3);
    setCooldownMin(120); setAllowRetake(true); setRetakeOnFail(true);
    setIsPublished(true); setWeightPct(""); setStartsAt(""); setDueDate("");
    setQuestions([makeBlankQuestion()]); setQuestionsModified(false);
    setOpenUnits(new Set()); setSelectedUnitId(null); setSelectedSessIds(new Set());
    setError(null);
  };

  const handleClose = () => { resetForm(); onClose?.(); };

  const handleDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف كويز "${quiz?.title}"؟ لا يمكن التراجع.`)) return;
    setSaving(true); setError(null);
    try {
      await deleteProgramQuiz(programId, quiz.id);
      showToast("تم حذف الكويز بنجاح", "success");
      onDelete?.(quiz);
      resetForm(); onClose?.();
    } catch (e) {
      setError(e?.message || "تعذر حذف الكويز");
      showToast(e?.message || "تعذر حذف الكويز", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("عنوان الكويز مطلوب"); return; }
    if (!programId)    { setError("لا يوجد برنامج محدد"); return; }

    const typeConf = QUIZ_TYPES.find(t => t.key === typeKey) ?? QUIZ_TYPES[0];

    // scope_sessions — جلسات محددة أو كل جلسات الوحدة
    const scopeSessArr = (() => {
      if (selectedSessIds.size > 0) return [...selectedSessIds];
      const unit = unitBank.find(u => u.id === selectedUnitId);
      return unit ? unit.sessions.map(s => s.id) : scopeSessionIds;
    })();
    const scopeUnitsArr = selectedUnitId ? [selectedUnitId] : scopeUnitIds;

    // بناء الـ payload كـ FormData (form-data)
    const fd = new FormData();
    fd.append("category",              String(typeConf.category));
    fd.append("is_assignment",         typeConf.is_assignment ? "1" : "0");
    fd.append("title[ar]",             title.trim());
    fd.append("title[en]",             title.trim());
    if (desc.trim()) {
      fd.append("description[ar]", desc.trim());
      fd.append("description[en]", desc.trim());
    }
    fd.append("duration_minutes",      String(durationMin));
    fd.append("pass_percent",          String(passPct));
    fd.append("weight_percent", weightPct !== "" ? String(weightPct) : "0");
    fd.append("max_attempts",          String(maxAttempts));
    fd.append("cooldown_minutes",      String(cooldownMin));
    fd.append("allow_retake",          allowRetake  ? "1" : "0");
    fd.append("retake_only_if_failed", retakeOnFail ? "1" : "0");
    fd.append("is_published",          isPublished  ? "1" : "0");
    fd.append("is_optional",           "0");
    if (startsAt) fd.append("starts_at", startsAt);
    if (dueDate)  fd.append("due_date",  dueDate);

    scopeSessArr.forEach((id, i) => fd.append(`session_ids[${i}]`, String(id)));
    scopeUnitsArr.forEach((id, i) => fd.append(`unit_ids[${i}]`,   String(id)));

    // الأسئلة — في edit mode نبعتها بس لو المستخدم عدّل فيها
    const shouldSendQuestions = !isEditMode || questionsModified;
    if (shouldSendQuestions) {
      questions
        .filter(q => q.text.trim())
        .filter(q => {
          const type = q.qType ?? 0;
          if (type === 2) return true; // essay — لا خيارات
          if (type === 1) return true; // true/false — خيارين ثابتين
          // mcq — لازم فيه 2 خيارات مكتوبة على الأقل
          return q.answers.filter(a => a.text.trim()).length >= 2;
        })
        .map(questionToApi).forEach((q, qi) => {
        if (q.id)  fd.append(`questions[${qi}][id]`,         String(q.id));
        fd.append(`questions[${qi}][body][ar]`, q.body);
        fd.append(`questions[${qi}][body][en]`, q.body);
        fd.append(`questions[${qi}][type]`,       String(q.type));
        fd.append(`questions[${qi}][sort_order]`, String(q.sort_order));
        q.options.forEach((opt, oi) => {
          if (opt.id) fd.append(`questions[${qi}][options][${oi}][id]`, String(opt.id));
          fd.append(`questions[${qi}][options][${oi}][body][ar]`, opt.body);
          fd.append(`questions[${qi}][options][${oi}][body][en]`, opt.body);
          fd.append(`questions[${qi}][options][${oi}][is_correct]`, String(opt.is_correct));
          fd.append(`questions[${qi}][options][${oi}][sort_order]`, String(opt.sort_order));
        });
      });
    }

    setSaving(true); setError(null);
    try {
      const res = isEditMode
        ? await updateProgramQuiz(programId, quiz.id, fd)
        : await createProgramQuiz(programId, fd);
      const saved = res?.data ?? res;
      showToast(isEditMode ? "تم تعديل الكويز بنجاح" : "تم إنشاء الكويز بنجاح", "success");
      onSave?.(saved);
      resetForm(); onClose?.();
    } catch (e) {
      setError(e?.message || "تعذر حفظ الكويز، حاول مرة أخرى");
      showToast(e?.message || "تعذر حفظ الكويز", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="fixed inset-0 z-50 flex" dir="rtl">
        <div className="flex-1 bg-black/25" onClick={handleClose} />

        <div className="flex flex-col bg-white h-full overflow-hidden"
          style={{ width: "clamp(480px, 55vw, 720px)", borderLeft: "1px solid #e5e7eb", boxShadow: "-4px 0 24px rgba(0,0,0,0.07)" }}>

          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0" dir="rtl">
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "#1f2937" }}>
                {isEditMode ? "تعديل الكويز" : "إعداد الكويز"}
              </h2>
              {lessonTitle && !isEditMode && (
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  درس: <span className="font-semibold" style={{ color: BRAND }}>{lessonTitle}</span>
                </p>
              )}
              {isEditMode && (
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  تعديل: <span className="font-semibold" style={{ color: BRAND }}>{quiz.title}</span>
                </p>
              )}
            </div>
            <button type="button" onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-slate-400">
              <IcoX size={13} />
            </button>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

            {/* basic info */}
            <div className="space-y-3">
              <Field label="عنوان الكويز" required>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: اختبار الوحدة الأولى"
                  className={`${inputCls} h-9`} dir="rtl" />
              </Field>
              <Field label="وصف الكويز">
                <textarea value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="وصف مختصر..." rows={2}
                  className={`${inputCls} resize-none py-2`} dir="rtl" />
              </Field>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9" }} />

            {/* نوع التقييم */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-right" style={{ color: "#374151" }}>نوع التقييم</p>
              <div className="flex rounded-lg p-1 gap-1" style={{ background: "#f1f5f9" }} dir="rtl">
                {QUIZ_TYPES.map(opt => {
                  const active = typeKey === opt.key;
                  return (
                    <button key={opt.key} type="button"
                      onClick={() => setTypeKey(opt.key)}
                      className="flex-1 rounded-md px-3 py-2 text-right transition-all duration-150"
                      style={{
                        background: active ? "#fff" : "transparent",
                        boxShadow:  active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      }}>
                      <p className="text-[12px] font-semibold"
                        style={{ color: active ? BRAND : "#94a3b8" }}>{opt.label}</p>
                      <p className="text-[10px] mt-0.5"
                        style={{ color: active ? "#64748b" : "#cbd5e1" }}>{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9" }} />

            {/* الجلسات المرتبطة — فقط للكويز المُقيَّم */}
            {typeKey === "evaluated" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2" dir="rtl">
                    <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>الجلسات المرتبطة</p>
                    <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                      (حدد وحدة كاملة أو جلسات معينة)
                    </p>
                  </div>

                  {bankLoading ? (
                    <p className="text-[11px] text-center py-4" style={{ color: "#94a3b8" }}>
                      جارٍ تحميل الوحدات…
                    </p>
                  ) : unitBank.length === 0 ? (
                    <p className="text-[11px] text-center py-4" style={{ color: "#94a3b8" }}>
                      لا توجد وحدات أو جلسات مرتبطة بهذا البرنامج
                    </p>
                  ) : (
                    <div className="rounded-lg border border-[#e5e7eb] overflow-hidden divide-y divide-[#e5e7eb]">
                      {unitBank.map((unit, ui) => {
                        const isOpen  = openUnits.has(ui);
                        const unitSel = selectedUnitId === unit.id;

                        const toggleOpen = () => setOpenUnits(prev => {
                          const n = new Set(prev); n.has(ui) ? n.delete(ui) : n.add(ui); return n;
                        });
                        const selectUnit = (e) => {
                          e.stopPropagation();
                          if (unitSel) {
                            setSelectedUnitId(null);
                            setSelectedSessIds(new Set());
                          } else {
                            setSelectedUnitId(unit.id);
                            setSelectedSessIds(new Set()); // reset جلسات الوحدة الجديدة
                            // افتح الوحدة تلقائياً
                            setOpenUnits(prev => { const n = new Set(prev); n.add(ui); return n; });
                          }
                        };

                        return (
                          <div key={unit.id}>
                            <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                              style={{ background: unitSel ? "#f0f6ff" : "#f8fafc" }}
                              dir="rtl" onClick={toggleOpen}>

                              {/* radio */}
                              <span onClick={selectUnit}
                                className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                                style={{ borderColor: unitSel ? BRAND : "#d1d5db" }}>
                                {unitSel && <span className="w-2 h-2 rounded-full block" style={{ background: BRAND }} />}
                              </span>

                              <span className="flex-1 text-[12px] font-semibold text-right"
                                style={{ color: unitSel ? BRAND : "#1f2937" }}>
                                {unit.title}
                              </span>

                              {unitSel && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                                  style={{ background: "#dbeafe", color: BRAND }}>
                                  {selectedSessIds.size > 0
                                    ? `${selectedSessIds.size} / ${unit.sessions.length} جلسة`
                                    : `${unit.sessions.length} جلسة`}
                                </span>
                              )}

                              <span className="text-slate-400 transition-transform duration-200 shrink-0"
                                style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              </span>
                            </div>

                            {/* sessions — checkboxes لو الوحدة محددة */}
                            {isOpen && (
                              <div className="divide-y divide-[#f1f5f9]">
                                {unit.sessions.length === 0 ? (
                                  <p className="px-4 py-3 text-[11px]" style={{ color: "#94a3b8" }}>لا توجد جلسات</p>
                                ) : unit.sessions.map(s => {
                                  const sessSel = unitSel && selectedSessIds.has(s.id);
                                  const toggleSess = () => {
                                    if (!unitSel) return;
                                    setSelectedSessIds(prev => {
                                      const n = new Set(prev);
                                      n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                                      return n;
                                    });
                                  };
                                  return (
                                    <div key={s.id}
                                      className="flex items-center gap-3 px-6 py-2.5 transition-colors"
                                      style={{
                                        background: sessSel ? "#f0f6ff" : unitSel ? "#fff" : "#fafafa",
                                        cursor: unitSel ? "pointer" : "default",
                                      }}
                                      dir="rtl"
                                      onClick={toggleSess}>
                                      {unitSel ? (
                                        <span className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                                          style={{
                                            borderColor: sessSel ? BRAND : "#d1d5db",
                                            background:  sessSel ? BRAND : "transparent",
                                          }}>
                                          {sessSel && (
                                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                              <polyline points="2 6 5 9 10 3"/>
                                            </svg>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#d1d5db" }} />
                                      )}
                                      <span className="text-[12px]" style={{ color: sessSel ? BRAND : unitSel ? "#374151" : "#94a3b8" }}>
                                        {s.title}
                                      </span>
                                    </div>
                                  );
                                })}
                                {unitSel && selectedSessIds.size === 0 && (
                                  <p className="px-6 py-2 text-[10px] italic" style={{ color: "#94a3b8" }}>
                                    لم تحدد جلسات — سيُطبق على كل جلسات الوحدة
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9" }} />
              </>
            )}

            {/* إعدادات */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-right" style={{ color: "#374151" }}>إعدادات الاختبار</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="المدة (دقيقة)">
                  <input type="number" min={1} value={durationMin}
                    onChange={e => setDurationMin(Number(e.target.value))}
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
                <Field label="نسبة النجاح %">
                  <input type="number" min={0} max={100} value={passPct}
                    onChange={e => setPassPct(Number(e.target.value))}
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
                <Field label="عدد المحاولات">
                  <input type="number" min={1} value={maxAttempts}
                    onChange={e => setMaxAttempts(Number(e.target.value))}
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
                <Field label="نسبة مساهمته في الدرجة النهائية %">
                  <input type="number" min={0} max={100}
                    value={weightPct}
                    onChange={e => setWeightPct(e.target.value)}
                    placeholder="مثال: 40"
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
                <Field label="تاريخ الفتح">
                  <input type="datetime-local" value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
                <Field label="تاريخ الإغلاق">
                  <input type="datetime-local" value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={`${inputCls} h-9`} dir="ltr" />
                </Field>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "السماح بالإعادة",        val: allowRetake,  set: setAllowRetake  },
                  { label: "الإعادة فقط عند الرسوب", val: retakeOnFail, set: setRetakeOnFail },
                  { label: "منشور (مرئي للمتدربين)",  val: isPublished,  set: setIsPublished  },
                ].map(({ label, val, set }) => (
                  <div key={label} className="flex items-center justify-between" dir="rtl">
                    <span className="text-[12px]" style={{ color: "#374151" }}>{label}</span>
                    <Toggle value={val} onChange={set} />
                  </div>
                ))}
              </div>

              {allowRetake && (
                <Field label="انتظار قبل الإعادة (دقيقة)">
                  <div className="flex gap-2">
                    {[60, 120, 360, 720].map(m => (
                      <button key={m} type="button"
                        onClick={() => setCooldownMin(m)}
                        className="flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all"
                        style={{
                          background:  cooldownMin === m ? BRAND : "#fff",
                          color:       cooldownMin === m ? "#fff" : "#374151",
                          borderColor: cooldownMin === m ? BRAND : "#e5e7eb",
                        }}>
                        {m < 60 ? `${m}د` : `${m / 60}س`}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9" }} />

            {/* منشئ الأسئلة */}
            <div className="space-y-3">
              <div className="flex items-center justify-between" dir="rtl">
                <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>
                  الأسئلة ({questions.length})
                </p>
                <button type="button"
                  className="flex items-center gap-1 text-[11px] font-medium border border-dashed rounded-md px-2.5 py-1 hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#d1d5db", color: "#64748b" }}>
                  <IcoUpload size={11} />
                  رفع ملف (Excel / CSV)
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionCard key={q.id} question={q} index={i}
                    onChange={upd => updateQuestion(q.id, upd)}
                    onRemove={() => removeQuestion(q.id)}
                    editMode={isEditMode} />
                ))}
              </div>

              {!isEditMode && (
                <button type="button" onClick={addQuestion}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium border border-dashed hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#d1d5db", color: "#64748b" }}>
                  <IcoPlus size={11} />
                  إضافة سؤال
                </button>
              )}
            </div>

          </div>

          {/* footer */}
          <div className="shrink-0 px-4 py-3 border-t border-[#f0f0f0] space-y-2"
            style={{ background: "#fff" }} dir="rtl">
            {error && (
              <p className="text-[11px] text-red-500 text-right bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleClose}
                  className="text-[12px] font-medium px-4 py-2 rounded-md border border-[#e5e7eb] hover:bg-slate-50 transition-colors"
                  style={{ color: "#64748b" }}>
                  إلغاء
                </button>
                {isEditMode && (
                  <button type="button" onClick={handleDelete} disabled={saving}
                    className="text-[12px] font-medium px-4 py-2 rounded-md border hover:bg-red-50 transition-colors disabled:opacity-60"
                    style={{ borderColor: "#fca5a5", color: "#ef4444" }}>
                    حذف الكويز
                  </button>
                )}
              </div>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 text-[12px] font-bold px-5 py-2 rounded-md text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: BRAND }}>
                {saving && <IcoSpinner size={13} />}
                {saving ? "جارٍ الحفظ…" : isEditMode ? "حفظ التعديلات" : "حفظ الكويز"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
