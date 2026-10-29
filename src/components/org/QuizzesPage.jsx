import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPrograms, fetchSessions } from "../../services/api";
import { deleteQuiz, loadQuizzes, saveQuiz } from "../../services/quizzes";
import { useToast } from "../shared/ToastProvider";

const C = {
  primary: "#024677",
  text: "#1D293D",
  muted: "#64748B",
  border: "#E2E8F0",
  cardBorder: "#E2E8F0",
  bg: "#F8FAFC",
  card: "#FFFFFF",
};

const TYPES = [
  { id: "mcq", label: "اختيار من متعدد" },
  { id: "essay", label: "مقالي" },
  { id: "true_false", label: "صح أو خطأ" },
  { id: "short", label: "إجابة قصيرة" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function typeLabel(id) {
  return TYPES.find(t => t.id === id)?.label ?? id;
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.ar || value.en || value.name || "";
}

function blankQuestion(type = "mcq") {
  return {
    id: uid(),
    type,
    text: "",
    points: 1,
    multi: false,
    options: type === "mcq"
      ? [{ id: uid(), text: "", correct: true }, { id: uid(), text: "", correct: false }]
      : [],
    correct: true,
    modelAnswer: "",
  };
}

function validate(quiz, { sending } = {}) {
  if (!quiz.programId) return "اختر البرنامج من القائمة";
  if (sending && !quiz.sessionId) return "اختر الجلسة من القائمة";
  if (!quiz.title.trim()) return "اكتب اسم الاختبار";
  if (!quiz.questions.length) return "أضف سؤال واحد على الأقل";
  for (const [i, q] of quiz.questions.entries()) {
    if (!q.text.trim()) return `السؤال ${i + 1} فاضي`;
    if (q.type === "mcq") {
      const opts = q.options.filter(o => o.text.trim());
      if (opts.length < 2) return `السؤال ${i + 1} محتاج اختيارين على الأقل`;
      if (!opts.some(o => o.correct)) return `حدد الإجابة الصحيحة في السؤال ${i + 1}`;
    }
  }
  return "";
}

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-[13px] font-bold" style={{ color: C.text }}>{label}</span>
      {children}
      {hint && <span className="text-[11px]" style={{ color: C.muted }}>{hint}</span>}
    </label>
  );
}

function Dropdown({ label, hint, value, onChange, options = [], placeholder = "اختر", disabled, compact }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  const list = options.filter(o => !query.trim() || o.label.includes(query.trim()));

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (next) => {
    onChange?.(next);
    setOpen(false);
    setQuery("");
  };

  const menu = open && (
    <div className="absolute z-50 top-full right-0 left-0 mt-1.5 rounded-xl border bg-white shadow-lg overflow-hidden" style={{ borderColor: C.cardBorder }}>
      {options.length > 5 && (
        <div className="p-2 border-b" style={{ borderColor: C.border }}>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="بحث..."
            className="w-full h-9 rounded-lg border px-3 text-sm outline-none"
            style={{ borderColor: C.cardBorder, color: C.text }}
          />
        </div>
      )}
      <div className="max-h-56 overflow-y-auto py-1">
        {list.length === 0 ? (
          <p className="px-3 py-3 text-xs text-center" style={{ color: C.muted }}>لا توجد نتائج</p>
        ) : list.map(o => {
          const on = String(o.value) === String(value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => pick(o.value)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-right hover:bg-slate-50"
              style={{ color: on ? C.primary : C.text, background: on ? "#F4F8FB" : undefined }}>
              <span className="truncate">{o.label}</span>
              {on && <span className="text-xs font-bold shrink-0">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(v => !v)}
      className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white text-right disabled:opacity-50 ${compact ? "h-9 px-2.5 text-xs font-bold" : "h-11 px-3.5 text-sm"}`}
      style={{ borderColor: open ? C.primary : C.cardBorder, color: selected ? C.text : C.muted }}>
      <span className="truncate">{selected?.label || placeholder}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  );

  if (compact) {
    return <div className="relative min-w-[140px]" ref={box}>{trigger}{menu}</div>;
  }

  return (
    <Field label={label} hint={hint}>
      <div className="relative" ref={box}>{trigger}{menu}</div>
    </Field>
  );
}

function QuizBuilder({ quiz, programs, sessions, onBack, onSaved }) {
  const showToast = useToast();
  const [form, setForm] = useState(quiz);
  const [error, setError] = useState("");
  const programSessions = sessions.filter(s => String(s.programId) === String(form.programId));

  const setQ = (id, patch) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...patch } : q),
    }));
  };

  const changeType = (q, type) => {
    const next = blankQuestion(type);
    setQ(q.id, { ...next, id: q.id, text: q.text, points: q.points });
  };

  const pickProgram = (id) => {
    const program = programs.find(p => String(p.id) === id);
    setForm(p => ({
      ...p,
      programId: id,
      programName: program?.name || "",
      sessionId: "",
      sessionName: "",
    }));
  };

  const pickSession = (id) => {
    const session = programSessions.find(s => String(s.id) === id);
    setForm(p => ({
      ...p,
      sessionId: id,
      sessionName: session?.title || "",
    }));
  };

  const persist = (status) => {
    const message = validate(form, { sending: status === "sent" });
    if (message) {
      setError(message);
      return;
    }
    saveQuiz({
      ...form,
      title: form.title.trim(),
      status,
      sentAt: status === "sent" ? new Date().toISOString() : form.sentAt || null,
      questions: form.questions.map(q => ({
        ...q,
        text: q.text.trim(),
        options: (q.options || []).filter(o => o.text.trim()),
      })),
    });
    showToast(status === "sent" ? "تم إرسال الاختبار على الجلسة" : "تم حفظ المسودة", "success");
    onSaved?.();
  };

  const points = form.questions.reduce((n, q) => n + (Number(q.points) || 0), 0);
  const inputCls = "w-full h-11 rounded-xl border bg-white px-3.5 text-sm outline-none focus:border-[#024677]";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="text-xs font-bold" style={{ color: C.primary }}>
            الاختبارات
          </button>
          <h2 className="text-xl font-extrabold mt-1" style={{ color: C.text }}>
            {form.title.trim() || "اختبار جديد"}
          </h2>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#EEF4FA", color: C.primary }}>
          {form.questions.length} سؤال · {points} درجة
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-3 lg:sticky lg:top-4">
        <aside className="rounded-2xl border-2 bg-white p-4 space-y-4" style={{ borderColor: C.cardBorder }}>
          <p className="text-sm font-extrabold" style={{ color: C.text }}>إعداد الاختبار</p>
          <Dropdown
            label="البرنامج"
            hint="تظهر جلسات البرنامج بعد الاختيار"
            value={form.programId || ""}
            onChange={pickProgram}
            placeholder="اختر البرنامج"
            options={programs.map(p => ({ value: p.id, label: p.name }))}
          />
          <Dropdown
            label="الجلسة"
            value={form.sessionId || ""}
            disabled={!form.programId}
            onChange={pickSession}
            placeholder={form.programId ? "اختر الجلسة" : "اختر البرنامج أولًا"}
            options={programSessions.map(s => ({ value: s.id, label: s.title }))}
          />
          <Field label="اسم الاختبار">
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="اختبار نهاية الوحدة"
              className={inputCls}
              style={{ borderColor: C.cardBorder, background: "#FFFFFF", color: C.text }}
            />
          </Field>
        </aside>
        <div className="rounded-2xl border-2 bg-white px-4 py-3" style={{ borderColor: C.cardBorder }}>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 gap-1">
            <button type="button" onClick={() => persist("draft")} className="h-11 rounded-xl border bg-white text-sm font-bold" style={{ borderColor: C.cardBorder, color: C.text }}>
              حفظ
            </button>
            <button type="button" onClick={() => persist("sent")} className="h-11 rounded-xl text-sm font-bold text-white" style={{ background: C.primary }}>
              إرسال
            </button>
          </div>
        </div>
        </div>

        <div className="space-y-3">
          {form.questions.map((q, i) => (
            <article key={q.id} className="rounded-2xl border-2 bg-white" style={{ borderColor: C.cardBorder }}>
              <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: C.border }}>
                <span className="w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0" style={{ background: "#EEF4FA", color: C.primary }}>
                  {i + 1}
                </span>
                <Dropdown
                  compact
                  value={q.type}
                  onChange={type => changeType(q, type)}
                  options={TYPES.map(t => ({ value: t.id, label: t.label }))}
                />
                <label className="mr-auto flex items-center gap-1.5 text-[11px] font-bold" style={{ color: C.muted }}>
                  درجة
                  <input
                    type="number"
                    min="0"
                    value={q.points}
                    onChange={e => setQ(q.id, { points: Number(e.target.value) || 0 })}
                    className="w-14 h-9 rounded-lg border px-2 text-sm outline-none"
                    style={{ borderColor: C.cardBorder, background: "#FFFFFF", color: C.text }}
                  />
                </label>
                {form.questions.length > 1 && (
                  <button type="button" className="text-[11px] font-bold text-red-500" onClick={() => setForm(p => ({ ...p, questions: p.questions.filter(x => x.id !== q.id) }))}>
                    حذف
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3">
                <textarea
                  value={q.text}
                  onChange={e => setQ(q.id, { text: e.target.value })}
                  rows={q.type === "essay" ? 4 : 2}
                  placeholder="نص السؤال"
                  className="w-full rounded-xl border px-3.5 py-3 text-sm outline-none resize-y focus:border-[#024677]"
                  style={{ borderColor: C.cardBorder, background: "#FFFFFF", color: C.text }}
                />

                {q.type === "mcq" && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: C.muted }}>
                      <input type="checkbox" checked={!!q.multi} onChange={e => setQ(q.id, { multi: e.target.checked })} />
                      أكثر من إجابة صحيحة
                    </label>
                    {q.options.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2 h-11 rounded-xl border px-2.5 bg-white" style={{ borderColor: opt.correct ? "#99E2D6" : C.cardBorder, background: opt.correct ? "#F0FDFA" : "#FFFFFF" }}>
                        <span className="w-6 h-6 rounded-md text-[11px] font-extrabold flex items-center justify-center shrink-0" style={{ background: opt.correct ? C.primary : "#F1F5F9", color: opt.correct ? "#fff" : C.muted }}>
                          {["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"][idx] || idx + 1}
                        </span>
                        <input
                          type={q.multi ? "checkbox" : "radio"}
                          name={`correct-${q.id}`}
                          checked={!!opt.correct}
                          onChange={() => setQ(q.id, {
                            options: q.options.map(o => ({
                              ...o,
                              correct: q.multi ? (o.id === opt.id ? !o.correct : o.correct) : o.id === opt.id,
                            })),
                          })}
                        />
                        <input
                          value={opt.text}
                          onChange={e => setQ(q.id, { options: q.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o) })}
                          placeholder="الاختيار"
                          className="flex-1 text-sm outline-none bg-transparent"
                          style={{ color: C.text }}
                        />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => setQ(q.id, { options: q.options.filter(o => o.id !== opt.id) })} className="text-slate-400 px-1">×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setQ(q.id, { options: [...q.options, { id: uid(), text: "", correct: false }] })}
                      className="text-xs font-bold" style={{ color: C.primary }}>
                      إضافة اختيار
                    </button>
                  </div>
                )}

                {q.type === "true_false" && (
                  <div className="grid grid-cols-2 gap-2">
                    {[true, false].map(v => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setQ(q.id, { correct: v })}
                        className="h-11 rounded-xl text-sm font-bold border"
                        style={{
                          borderColor: q.correct === v ? C.primary : C.cardBorder,
                          background: q.correct === v ? "#EEF6FB" : "#FFFFFF",
                          color: q.correct === v ? C.primary : C.text,
                        }}>
                        {v ? "صح" : "خطأ"}
                      </button>
                    ))}
                  </div>
                )}

                {(q.type === "essay" || q.type === "short") && (
                  <input
                    value={q.modelAnswer}
                    onChange={e => setQ(q.id, { modelAnswer: e.target.value })}
                    placeholder="نموذج الإجابة — اختياري"
                    className={inputCls}
                    style={{ borderColor: C.cardBorder, background: "#FFFFFF", color: C.text }}
                  />
                )}
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, questions: [...p.questions, blankQuestion("mcq")] }))}
            className="w-full h-12 rounded-2xl border-2 border-dashed bg-white text-sm font-bold"
            style={{ borderColor: C.cardBorder, color: C.primary }}>
            إضافة سؤال
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizzesPage() {
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [items, setItems] = useState(() => loadQuizzes());
  const [loading, setLoading] = useState(true);
  const [programId, setProgramId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [builder, setBuilder] = useState(null);

  useEffect(() => {
    let on = true;
    Promise.all([
      fetchPrograms({ per_page: 100, page: 1, search: "" }).catch(() => null),
      fetchSessions({ per_page: 100 }).catch(() => null),
    ]).then(([progRes, sessRes]) => {
      if (!on) return;
      const plist = progRes?.data?.programs ?? progRes?.data ?? [];
      setPrograms((Array.isArray(plist) ? plist : []).map(p => ({
        id: p.id,
        name: textOf(p.name) || "برنامج",
      })));
      const data = sessRes?.data ?? sessRes ?? {};
      const rows = data.all_sessions?.data ?? data.sessions?.data ?? data.sessions ?? data.data ?? [];
      setSessions((Array.isArray(rows) ? rows : []).map(s => ({
        id: s.id,
        title: textOf(s.title) || "جلسة",
        programId: s.program_id ?? s.program?.id ?? "",
      })));
    }).finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const program = programs.find(p => String(p.id) === String(programId));
  const programSessions = sessions.filter(s => String(s.programId) === String(programId));
  const session = programSessions.find(s => String(s.id) === String(sessionId));

  const visible = useMemo(() => items.filter(item => {
    if (programId && String(item.programId) !== String(programId)) return false;
    if (sessionId && String(item.sessionId) !== String(sessionId)) return false;
    return true;
  }), [items, programId, sessionId]);

  const startNew = () => setBuilder({
    id: uid(),
    title: "",
    programId,
    programName: program?.name || "",
    sessionId,
    sessionName: session?.title || "",
    status: "draft",
    questions: [blankQuestion("mcq")],
  });

  return (
    <main className="flex-1 overflow-y-auto min-h-0" style={{ background: C.bg }} dir="rtl">
      <div className="w-full max-w-[1180px] mx-auto px-3 sm:px-4 py-5 space-y-4">
        {!builder && (
          <>
            <header>
              <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>الاختبارات</h1>
              <p className="text-sm mt-1" style={{ color: C.muted }}>اختَر البرنامج، ثم الجلسة، وبعدها أضف الاختبار.</p>
            </header>

            <section className="rounded-2xl border-2 bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderColor: C.cardBorder }}>
              <Dropdown
                label="البرنامج"
                value={programId}
                onChange={id => { setProgramId(id); setSessionId(""); }}
                placeholder={loading ? "جاري تحميل البرامج..." : "اختر البرنامج"}
                options={programs.map(p => ({ value: p.id, label: p.name }))}
              />
              <Dropdown
                label="الجلسة"
                value={sessionId}
                disabled={!programId}
                onChange={setSessionId}
                placeholder={programId ? (programSessions.length ? "كل جلسات البرنامج" : "لا توجد جلسات") : "اختر البرنامج أولًا"}
                options={[
                  { value: "", label: "كل جلسات البرنامج" },
                  ...programSessions.map(s => ({ value: s.id, label: s.title })),
                ]}
              />
            </section>

            {program && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-extrabold" style={{ color: C.text }}>{program.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {session ? session.title : `${programSessions.length} جلسة`}
                  </p>
                </div>
                <button type="button" onClick={startNew} className="text-sm font-bold text-white px-4 py-2.5 rounded-xl" style={{ background: C.primary }}>
                  إضافة اختبار
                </button>
              </div>
            )}

            {!program && (
              <div className="rounded-2xl border-2 bg-white px-6 py-16 text-center" style={{ borderColor: C.cardBorder }}>
                <p className="font-extrabold" style={{ color: C.text }}>ابدأ باختيار البرنامج</p>
                <p className="text-sm mt-1" style={{ color: C.muted }}>القائمة فوق فيها برامج الهيئة. بعد الاختيار تظهر جلساته.</p>
              </div>
            )}

            {program && visible.length === 0 && (
              <div className="rounded-2xl border-2 bg-white px-6 py-12 text-center" style={{ borderColor: C.cardBorder }}>
                <p className="text-sm" style={{ color: C.muted }}>لا توجد اختبارات على هذا الاختيار.</p>
              </div>
            )}

            {visible.length > 0 && (
              <div className="rounded-2xl border-2 bg-white overflow-hidden" style={{ borderColor: C.cardBorder }}>
                {visible.map((item, i) => (
                  <div key={item.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderTop: i ? `1px solid ${C.border}` : undefined }}>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold" style={{ color: C.text }}>{item.title}</p>
                      <p className="text-xs mt-1" style={{ color: C.muted }}>
                        {item.programName || "بدون برنامج"} · {item.sessionName || "كل الجلسات"} · {item.questions.length} سؤال · {[...new Set(item.questions.map(q => typeLabel(q.type)))].join("، ")}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: item.status === "sent" ? "#E8F8F3" : "#EEF4FA", color: item.status === "sent" ? "#0F766E" : C.primary }}>
                      {item.status === "sent" ? "مُرسل" : "مسودة"}
                    </span>
                    <button type="button" onClick={() => setBuilder(item)} className="text-xs font-bold px-3 py-2 rounded-xl text-white" style={{ background: C.primary }}>فتح</button>
                    <button type="button" onClick={() => { deleteQuiz(item.id); setItems(loadQuizzes()); }} className="text-xs font-bold text-red-500">حذف</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {builder && (
          <QuizBuilder
            quiz={builder}
            programs={programs}
            sessions={sessions}
            onBack={() => setBuilder(null)}
            onSaved={() => { setBuilder(null); setItems(loadQuizzes()); }}
          />
        )}
      </div>
    </main>
  );
}
