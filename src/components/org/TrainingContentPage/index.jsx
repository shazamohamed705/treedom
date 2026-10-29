import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuizSettingsDrawer from "../QuizSettingsDrawer";
import FormalAssessmentDrawer from "../FormalAssessmentDrawer";
import { fetchProgramUnits, fetchProgramUnit, createProgramUnit, fetchProgramQuizzes, fetchProgramQuiz, deleteProgramQuiz } from "../../../services/api";
import { useToast } from "../../shared/ToastProvider";

// ─── Brand colours (matches #024677 primary used across project) ──────────────
const BRAND = "#024677";

// ─── Tiny SVG icon helper (same pattern as UserProgramSessionPage/icons.jsx) ──
const Ico = ({ d, size = 14, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}
  >{d}</svg>
);

// content-type icons
const IcoLesson     = ({ size = 14 }) => <Ico size={size} d={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>} />;
const IcoVideo      = ({ size = 14 }) => <Ico size={size} d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>} />;
const IcoDocument   = ({ size = 14 }) => <Ico size={size} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>} />;
const IcoQuiz       = ({ size = 14 }) => <Ico size={size} d={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3}/></>} />;
const IcoAssignment = ({ size = 14 }) => <Ico size={size} d={<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>} />;
const IcoFolder     = ({ size = 14 }) => <Ico size={size} d={<><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>} />;
const IcoChevDown   = ({ size = 14 }) => <Ico size={size} sw={2.2} d={<polyline points="6 9 12 15 18 9"/>} />;
const IcoPlus       = ({ size = 12 }) => <Ico size={size} sw={2.4} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoCheck      = ({ size = 13 }) => <Ico size={size} sw={2.5} stroke="#16a34a" d={<polyline points="20 6 9 17 4 12"/>} />;
const IcoClock      = ({ size = 12 }) => <Ico size={size} stroke="#64748b" d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const IcoEdit       = ({ size = 12 }) => <Ico size={size} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;

// icon map by content type
const TYPE_ICON = {
  lesson:     <IcoLesson />,
  video:      <IcoVideo />,
  document:   <IcoDocument />,
  quiz:       <IcoQuiz />,
  assignment: <IcoAssignment />,
};

// ─── Mock data (replace with API data when connected) ────────────────────────
const MODULES = [
  {
    id: 1,
    title: "أساسيات اللغة الإنجليزية",
    meta: "3 دروس • 2 اختبار",
    open: true,
    lessons: [
      {
        id: 11, title: "مقدمة في اللغة الإنجليزية", type: "lesson", status: "completed",
        quizzes: [],
      },
      {
        id: 12, title: "مقدمة في اللغة الإنجليزية", type: "video", status: "completed",
        quizzes: [
          { title: "كويز مراجعة (1،2)", type: "كويز مُقيَّم", pending: 8, canEdit: false },
        ],
      },
      {
        id: 13, title: "مقدمة في اللغة الإنجليزية", type: "lesson", status: "incomplete",
        quizzes: [
          { title: "كويز مراجعة (1،2)", type: "كويز تدريبي", pending: 8, canEdit: true },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "قواعد اللغة الإنجليزية",
    meta: "5 دروس • 2 اختبار",
    open: false,
    lessons: [
      { id: 21, title: "مقدمة في اللغة الإنجليزية", type: "lesson", status: "completed", quizzes: [] },
      { id: 22, title: "قراءة مراجعة (1،2)",          type: "document", status: "incomplete", quizzes: [] },
    ],
  },
];

const ASSESSMENTS = [
  {
    id: 1,
    title: "اختبار قصير قبل البدء",
    type: "quiz",
    meta: [
      { icon: <IcoQuiz size={11} />, label: "10 أسئلة" },
      { icon: <IcoClock size={11} />, label: "مدة الاختبار: 10 دقائق" },
      { icon: <IcoCheck size={11} />, label: "النجاح: 70%" },
    ],
  },
  {
    id: 2,
    title: "واجب تطبيقي بعد الفصل الأول",
    type: "assignment",
    meta: [
      { icon: <IcoClock size={11} />, label: "الموعد النهائي" },
      { icon: null,                   label: "30%" },
    ],
  },
  {
    id: 3,
    title: "الاختبار النهائي للمحتوى",
    type: "quiz",
    meta: [
      { icon: <IcoQuiz size={11} />,  label: "20 سؤال" },
      { icon: <IcoCheck size={11} />, label: "النجاح: 40%" },
    ],
  },
];

// ─── category → label helper ──────────────────────────────────────────────────
function quizCategoryLabel(q) {
  if (q.is_assignment) return "تكليف / واجب";
  const cat = q.category?.value ?? q.category;
  if (cat === 0) return "كويز تدريبي";
  if (cat === 1) return "كويز مُقيَّم";
  if (cat === 2) return "اختبار رسمي";
  return q.category?.text ?? "كويز";
}
function quizCategoryStyle(q) {
  if (q.is_assignment) return { background: "#fef3c7", color: "#d97706" };
  const cat = q.category?.value ?? q.category;
  if (cat === 1) return { background: "#dcfce7", color: "#16a34a" };
  if (cat === 2) return { background: "#ede9fe", color: "#7c3aed" };
  return { background: "#f1f5f9", color: "#64748b" };
}

// ─── LessonRow ────────────────────────────────────────────────────────────────
function LessonRow({ lesson, index, onAddQuiz, onEditQuiz, onDeleteQuiz, quizzes = [] }) {
  const done = lesson.status === "completed";

  return (
    <div dir="rtl">
      <div className="rounded-lg bg-white mb-2" style={{ border: "1px solid #e5e7eb" }}>
        {/* lesson row */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{ background: "#f0f6ff", color: BRAND }}>{index}</span>
          <span className="shrink-0" style={{ color: "#64748b" }}>
            {TYPE_ICON[lesson.type] ?? <IcoLesson />}
          </span>
          <span className="flex-1 min-w-0 text-[12px] leading-snug truncate font-medium"
            style={{ color: done ? "#64748b" : "#1f2937" }}>
            {lesson.title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={quizzes.length > 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors"
              style={{
                borderColor: quizzes.length > 0 ? "#e5e7eb" : "#e5e7eb",
                color:        quizzes.length > 0 ? "#cbd5e1" : "#64748b",
                cursor:       quizzes.length > 0 ? "not-allowed" : "pointer",
                background:   quizzes.length > 0 ? "#f8fafc" : "#fff",
              }}
              onClick={() => quizzes.length === 0 && onAddQuiz?.(lesson.title, lesson.id)}>
              <IcoQuiz size={11} />
              إضافة كويز
            </button>
          </div>
        </div>

        {/* كويزات من الـ API مرتبطة بهذه الجلسة */}
        {quizzes.map((q) => (
          <div key={q.id} className="mx-2 mb-2 rounded-lg px-3 py-2"
            style={{ border: "1px solid #e5e7eb", background: "#fafafa" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ color: "#f59e0b" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                </span>
                <span className="text-[12px] font-semibold truncate" style={{ color: "#1f2937" }}>
                  {q.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={quizCategoryStyle(q)}>
                  {quizCategoryLabel(q)}
                </span>
                {q.questions_count != null && (
                  <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                    {q.questions_count} سؤال
                  </span>
                )}
                {q.pending_grading_count > 0 && (
                  <span className="text-[10px] font-semibold" style={{ color: "#ef4444" }}>
                    {q.pending_grading_count} بانتظار التصحيح
                  </span>
                )}
                <button
                  onClick={() => onEditQuiz?.(q)}
                  className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50 transition-colors flex items-center gap-1"
                  style={{ borderColor: "#e5e7eb", color: BRAND }}>
                  <IcoEdit size={11} />
                  تعديل
                </button>
                <button
                  onClick={() => onDeleteQuiz?.(q)}
                  className="text-[11px] px-2 py-1 rounded border hover:bg-red-50 transition-colors"
                  style={{ borderColor: "#e5e7eb", color: "#ef4444" }}>
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* mock quizzes (بيانات محلية لو مفيش API data) */}
        {lesson.quizzes?.map((q, qi) => (
          <div key={`mock-${qi}`} className="mx-2 mb-2 rounded-lg px-3 py-2"
            style={{ border: "1px solid #e5e7eb", background: "#fafafa" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ color: "#f59e0b" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                </span>
                <span className="text-[12px] font-semibold truncate" style={{ color: "#1f2937" }}>
                  {q.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {q.type && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={q.type === "كويز مُقيَّم"
                      ? { background: "#dcfce7", color: "#16a34a" }
                      : { background: "#f1f5f9", color: "#64748b" }}>
                    {q.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainingModule({ module: mod, onAddQuiz, onEditQuiz, onDeleteQuiz, onAddItem, quizzesMap = {} }) {
  const [open, setOpen] = useState(mod.open ?? false);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors"
        dir="rtl">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: BRAND }}><IcoFolder size={14} /></span>
          <span className="text-[13px] font-semibold truncate" style={{ color: "#1f2937" }}>{mod.title}</span>
          <span className="text-[11px] shrink-0" style={{ color: "#94a3b8" }}>{mod.meta}</span>
        </div>
        <span className="shrink-0 transition-transform duration-200"
          style={{ color: "#94a3b8", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <IcoChevDown size={14} />
        </span>
      </button>

      {open && (
        <div className="bg-white px-2 pb-1 pt-1.5" dir="rtl">
          {mod.lessons.map((l, i) => (
            <LessonRow key={l.id} lesson={l} index={i + 1}
              onAddQuiz={onAddQuiz} onEditQuiz={onEditQuiz} onDeleteQuiz={onDeleteQuiz}
              quizzes={quizzesMap[l.id] ?? []} />
          ))}
          <button
            onClick={() => onAddItem?.(mod.unitId ?? mod.id)}
            className="w-full flex items-center justify-center gap-1.5 mt-1.5 mb-1 py-2 rounded-lg text-[11px] font-medium
              border border-dashed hover:bg-slate-50 transition-colors"
            style={{ borderColor: "#d1d5db", color: "#64748b" }}>
            <IcoPlus size={11} />
            إضافة عنصر
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AssessmentItem ───────────────────────────────────────────────────────────
function AssessmentItem({ item }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ border: "1px solid #e5e7eb", background: "#fff" }}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold leading-snug" style={{ color: "#1f2937" }}>
            {item.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
            {item.meta.map((m, i) => (
              <span key={i} className="flex items-center gap-1 text-[11px]" style={{ color: "#64748b" }}>
                {m.icon}
                {m.label}
              </span>
            ))}
          </div>
        </div>
        <button
          className="shrink-0 text-[11px] px-2.5 py-1 rounded-md border hover:bg-slate-50 transition-colors"
          style={{ borderColor: "#e5e7eb", color: "#64748b" }}
        >
          <span className="flex items-center gap-1">
            <IcoEdit size={11} />
            تعديل
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── TrainingSidebar ──────────────────────────────────────────────────────────
function TrainingSidebar({ programId, onQuizSaved, formalQuizzes = [], onEditQuiz, onDeleteQuiz }) {
  const progress = 70;
  const [assessDrawer,   setAssessDrawer]   = useState(false);
  const [editingFormal,  setEditingFormal]  = useState(null); // quiz للتعديل في FormalAssessmentDrawer

  const handleFormalEdit = (q) => {
    setEditingFormal(q);
    setAssessDrawer(true);
  };

  const handleFormalClose = () => {
    setAssessDrawer(false);
    setEditingFormal(null);
  };

  return (
    <div className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5e7eb" }} dir="rtl">
      {/* header */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold" style={{ color: "#1f2937" }}>
            الاختبارات والواجبات
          </h2>
          <button onClick={() => setAssessDrawer(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}>
            <IcoPlus size={11} />
            إضافة تقييم رسمي
          </button>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
          تقييم مستوى المتدرب في البرنامج
        </p>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", marginBottom: "12px" }} />

      {/* الاختبارات الرسمية والتكاليف من الـ API */}
      {formalQuizzes.length === 0 ? (
        <p className="text-[11px] text-center py-4" style={{ color: "#94a3b8" }}>
          لا توجد اختبارات أو تكاليف رسمية بعد
        </p>
      ) : (
        <div className="space-y-2">
          {formalQuizzes.map(q => {
            const cat = q.category?.value ?? q.category;
            const isAssignment = q.is_assignment;
            const label = isAssignment ? "تكليف / واجب" : cat === 2 ? "امتحان رسمي" : "مُقيَّم";
            return (
              <div key={q.id} className="rounded-lg px-3 py-2.5"
                style={{ border: "1px solid #e5e7eb", background: "#fff" }} dir="rtl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold leading-snug" style={{ color: "#1f2937" }}>
                      {q.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      {q.questions_count != null && (
                        <span className="text-[11px]" style={{ color: "#64748b" }}>
                          {q.questions_count} سؤال
                        </span>
                      )}
                      {q.pass_percent != null && (
                        <span className="text-[11px]" style={{ color: "#64748b" }}>
                          النجاح: {q.pass_percent}%
                        </span>
                      )}
                      <span className="text-[11px]" style={{ color: "#64748b" }}>
                        {label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleFormalEdit(q)}
                      className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50 transition-colors"
                      style={{ borderColor: "#e5e7eb", color: BRAND }}>
                      تعديل
                    </button>
                    <button onClick={() => onDeleteQuiz?.(q)}
                      className="text-[11px] px-2 py-1 rounded border hover:bg-red-50 transition-colors"
                      style={{ borderColor: "#e5e7eb", color: "#ef4444" }}>
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FormalAssessmentDrawer — إضافة أو تعديل */}
      <FormalAssessmentDrawer
        open={assessDrawer}
        onClose={handleFormalClose}
        programId={programId}
        quiz={editingFormal}
        onSave={(saved) => { onQuizSaved?.(saved); handleFormalClose(); }}
      />
    </div>
  );
}

// ─── map an API unit (with its sessions) to the module shape used by the UI ──
function unitToModule(unit) {
  const sessions = Array.isArray(unit.sessions) ? unit.sessions : [];
  return {
    id:     unit.id,
    unitId: unit.id,          // kept separately for add-item navigation
    title:  unit.title?.ar || unit.title?.en || `وحدة ${unit.id}`,
    meta:   `${unit.sessions_count ?? sessions.length} دروس`,
    open:   false,
    lessons: sessions.map(s => ({
      id:     s.id,
      title:  s.title?.ar || s.title?.en || "جلسة",
      type:   s.type === 1 ? "video" : "lesson",
      status: s.actual_ended_at ? "completed" : "incomplete",
      quizzes: [],
    })),
  };
}

// ─── TrainingContentView — embeddable (no outer <main>) ──────────────────────
export function TrainingContentView({ programId, units: unitsProp, sessions = [] }) {
  const navigate   = useNavigate();
  const showToast  = useToast();
  const [units,        setUnits]        = useState(unitsProp ?? null);
  const [modules,      setModules]      = useState(unitsProp ? unitsProp.map(unitToModule) : (programId ? [] : MODULES));
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [drawerOpen,         setDrawerOpen]         = useState(false);
  const [drawerLesson,       setDrawerLesson]       = useState("");
  const [drawerScopeSession, setDrawerScopeSession] = useState([]);
  const [editingQuiz,        setEditingQuiz]        = useState(null);
  const [formalEditQuiz,     setFormalEditQuiz]     = useState(null); // للـ FormalAssessmentDrawer
  const [formalDrawerOpen,   setFormalDrawerOpen]   = useState(false);

  // quizzes map: sessionId → quizzes[]
  const [quizzesMap,    setQuizzesMap]    = useState({});
  const [formalQuizzes, setFormalQuizzes] = useState([]);
  // add-unit inline form
  const [adding,     setAdding]     = useState(false);
  const [newAr,      setNewAr]      = useState("");
  const [newDescAr,  setNewDescAr]  = useState("");
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitError,  setUnitError]  = useState(null);
  const realMode = !!programId;

  // لو اتبعتت الوحدات جاهزة مباشرة (units prop) استخدمها
  useEffect(() => {
    if (unitsProp) { setUnits(unitsProp); setModules(unitsProp.map(unitToModule)); }
  }, [unitsProp]);

  // اجلب الوحدات (وجلسات كل وحدة) لما يبقى في programId
  useEffect(() => {
    if (!programId) return;
    let alive = true;
    setLoading(true); setError(null);
    (async () => {
      try {
        const res = await fetchProgramUnits(programId);
        let list = res?.data?.units ?? res?.data?.data?.units ?? res?.data?.data ?? res?.data ?? [];
        if (!Array.isArray(list)) list = [];
        list = await Promise.all(list.map(async (u) => {
          if (Array.isArray(u.sessions)) return u;
          try {
            const r = await fetchProgramUnit(programId, u.id);
            return { ...u, sessions: r?.data?.unit?.sessions ?? r?.data?.sessions ?? [] };
          } catch { return { ...u, sessions: [] }; }
        }));
        if (!alive) return;
        setUnits(list);
        setModules(list.map(unitToModule));
      } catch (e) {
        if (alive) setError(e?.message || "تعذر تحميل المحتوى التدريبي");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [programId]);

  // اجلب الكويزات وابن map: sessionId → quizzes[] + formal quizzes
  useEffect(() => {
    if (!programId) return;
    let alive = true;
    fetchProgramQuizzes(programId)
      .then(res => {
        if (!alive) return;
        const sessions = res?.data?.sessions ?? [];
        const map = {};
        sessions.forEach(s => {
          if (Array.isArray(s.quizzes) && s.quizzes.length > 0) {
            map[s.id] = s.quizzes;
          }
        });
        setQuizzesMap(map);
        // الكويزات الرسمية والتكاليف — category=2 أو is_assignment=true
        const allFromSessions = sessions.flatMap(s => s.quizzes ?? []);
        const programLevel    = res?.data?.program_level_quizzes ?? [];
        // عرض كل program_level_quizzes في السايدبار (هي على مستوى البرنامج كلها)
        // + أي is_assignment=true من الجلسات
        const formal = [
          ...programLevel,
          ...allFromSessions.filter(q => q.is_assignment === true),
        ];
        setFormalQuizzes(formal);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [programId]);

  const addModule = () => {
    const id = Date.now();
    setModules(prev => [
      ...prev,
      { id, title: `فصل جديد ${prev.length + 1}`, meta: "0 دروس", open: true, lessons: [] },
    ]);
  };

  // يفتح الـ drawer لإنشاء كويز جديد مع ربط الجلسة
  const openQuizDrawer = (lessonTitle, sessionId) => {
    setDrawerLesson(lessonTitle);
    setDrawerScopeSession(sessionId ? [sessionId] : []);
    setEditingQuiz(null);
    setDrawerOpen(true);
  };

  // يفتح الـ drawer لتعديل كويز — يختار القالب حسب النوع
  const openEditQuizDrawer = async (quiz) => {
    const cat = quiz.category?.value ?? quiz.category;
    const isFormal = cat === 2 || quiz.is_assignment === true;

    let fullQuiz = quiz;
    try {
      const res = await fetchProgramQuiz(programId, quiz.id);
      fullQuiz = res?.data ?? quiz;
    } catch { /* fallback */ }

    if (isFormal) {
      setFormalEditQuiz(fullQuiz);
      setFormalDrawerOpen(true);
    } else {
      setEditingQuiz(fullQuiz);
      setDrawerLesson("");
      setDrawerScopeSession([]);
      setDrawerOpen(true);
    }
  };

  // "إضافة عنصر" — صفحة AddSessionPage
  const handleAddItem = (unitId) => {
    navigate("/dashboard/add-session", {
      state: { programId, unitId, backTo: "view-program" },
    });
  };

  // ── إضافة وحدة جديدة عبر الـ API
  const resetAddForm = () => {
    setAdding(false); setNewAr(""); setNewDescAr(""); setUnitError(null);
  };

  const createUnit = async () => {
    if (!realMode) { addModule(); resetAddForm(); return; }
    if (!newAr.trim()) { setUnitError("اكتب اسم الوحدة"); return; }
    setSavingUnit(true); setUnitError(null);
    try {
      const res = await createProgramUnit(programId, {
        title:       { ar: newAr.trim(), en: newAr.trim() },
        description: { ar: newDescAr.trim(), en: newDescAr.trim() },
        sort_order:   (units?.length ?? modules.length),
      });
      const u = res?.data?.unit ?? res?.data?.data?.unit;
      if (u) {
        const next = [...(units || []), { ...u, sessions: u.sessions ?? [] }];
        setUnits(next);
        setModules(next.map(unitToModule));
      }
      resetAddForm();
    } catch (e) {
      setUnitError(e?.message || "تعذر إضافة الوحدة");
    } finally {
      setSavingUnit(false);
    }
  };

  // حذف كويز
  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`هل أنت متأكد من حذف كويز "${quiz.title}"؟`)) return;
    try {
      await deleteProgramQuiz(programId, quiz.id);
      showToast("تم حذف الكويز بنجاح", "success");
      fetchProgramQuizzes(programId)
        .then(res => {
          const sessions = res?.data?.sessions ?? [];
          const map = {};
          sessions.forEach(s => {
            if (Array.isArray(s.quizzes) && s.quizzes.length > 0) map[s.id] = s.quizzes;
          });
          setQuizzesMap(map);
          const allFromSessions = sessions.flatMap(s => s.quizzes ?? []);
          const programLevel    = res?.data?.program_level_quizzes ?? [];
          const formal = [
            ...programLevel,
            ...allFromSessions.filter(q => q.is_assignment === true),
          ];
          setFormalQuizzes(formal);
        })
        .catch(() => {});
    } catch (e) {
      showToast(e?.message || "تعذر حذف الكويز", "error");
    }
  };
  const handleQuizSaved = (saved) => {
    // reload الكويزات من الـ API
    fetchProgramQuizzes(programId)
      .then(res => {
        const sessions = res?.data?.sessions ?? [];
        const map = {};
        sessions.forEach(s => {
          if (Array.isArray(s.quizzes) && s.quizzes.length > 0) map[s.id] = s.quizzes;
        });
        setQuizzesMap(map);
        const allFromSessions2 = sessions.flatMap(s => s.quizzes ?? []);
        const programLevel2    = res?.data?.program_level_quizzes ?? [];
        const formal2 = [
          ...programLevel2,
          ...allFromSessions2.filter(q => q.is_assignment === true),
        ];
        setFormalQuizzes(formal2);
      })
      .catch(() => {});
  };

  const showFlatSessions = (!units || units.length === 0) && sessions.length > 0;

  return (
    <div
      className="flex flex-col lg:flex-row gap-4 pt-2"
      style={{ alignItems: "start" }}
      dir="rtl"
    >
      {/* ── Main Content (right, ~72%) ── */}
      <div className="w-full lg:flex-1 min-w-0">
        <div
          className="rounded-xl bg-white p-4"
          style={{ border: "1px solid #e5e7eb" }}
        >
          {/* card header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-[15px] font-semibold" style={{ color: "#1f2937" }}>
                المحتوى التدريبي
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                استعرض محتوى البرنامج التدريبي
              </p>
            </div>

            {/* summary badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
              style={{ background: "#f0f6ff", border: "1px solid #dbeafe" }}
            >
              <span style={{ color: BRAND }}>
                <IcoFolder size={13} />
              </span>
              <span className="text-[11px] font-medium" style={{ color: BRAND }}>
                {modules.length} وحدات •{" "}
                {modules.reduce((acc, m) => acc + m.lessons.length, 0)} عناصر
              </span>
            </div>
          </div>

          {/* loading / error */}
          {loading && (
            <p className="text-[12px] text-slate-400 py-6 text-center">جارٍ تحميل المحتوى…</p>
          )}
          {error && !loading && (
            <p className="text-[12px] text-red-500 py-4 text-center">{error}</p>
          )}

          {/* modules list */}
          {!loading && (
            <div className="space-y-2.5">
              {modules.map(mod => (
                <TrainingModule key={mod.id} module={mod}
                  onAddQuiz={openQuizDrawer}
                  onEditQuiz={openEditQuizDrawer}
                  onDeleteQuiz={handleDeleteQuiz}
                  onAddItem={handleAddItem}
                  quizzesMap={quizzesMap} />
              ))}
            </div>
          )}

          {/* sessions list (fallback only — when no units loaded) */}
          {showFlatSessions && (
            <div className="mt-3 space-y-2" dir="rtl">
              <div style={{ borderTop: "1px solid #f1f5f9", marginBottom: "10px" }} />
              <p className="text-[13px] font-semibold" style={{ color: "#1f2937" }}>
                الجلسات ({sessions.length})
              </p>
              <div className="divide-y divide-slate-100 rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
                {sessions.map((s, i) => (
                  <div key={s.id ?? i} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white" dir="rtl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: "#14b8a6" }}
                      >{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 truncate">{s.title || "جلسة بدون عنوان"}</p>
                        {(s.type?.text ?? "") && (
                          <p className="text-[11px] text-slate-400">{s.type?.text ?? ""}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[11px] text-slate-400">{s.date ?? ""}</p>
                      <p className="text-[11px] text-slate-400">
                        {s.starts_at ?? ""}{s.ends_at ? ` — ${s.ends_at}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* add chapter / add unit */}
          {adding && realMode ? (
            <div className="mt-3 rounded-xl border border-slate-200 p-4 space-y-3" dir="rtl">
              <p className="text-[13px] font-semibold" style={{ color: "#1f2937" }}>إضافة وحدة جديدة</p>
              <input
                value={newAr}
                onChange={e => setNewAr(e.target.value)}
                placeholder="اسم الوحدة"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right"
              />
              <textarea
                value={newDescAr}
                onChange={e => setNewDescAr(e.target.value)}
                placeholder="وصف الوحدة (اختياري)"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none"
              />
              {unitError && <p className="text-[11px] text-red-500">{unitError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={createUnit}
                  disabled={savingUnit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: BRAND }}
                >
                  {savingUnit ? "جارٍ الحفظ…" : "حفظ"}
                </button>
                <button
                  onClick={resetAddForm}
                  disabled={savingUnit}
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => realMode ? setAdding(true) : addModule()}
              className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-lg text-[12px] font-medium
                border hover:bg-slate-50 transition-colors"
              style={{ borderColor: "#d1d5db", color: BRAND }}
            >
              <IcoPlus size={12} />
              إضافة فصل جديد
            </button>
          )}
        </div>
      </div>

      {/* ── Sidebar (left, ~28%) ── */}
      <div className="w-full lg:w-[340px] shrink-0">
        <TrainingSidebar programId={programId} onQuizSaved={handleQuizSaved} formalQuizzes={formalQuizzes} onEditQuiz={openEditQuizDrawer} onDeleteQuiz={handleDeleteQuiz} />
      </div>

      {/* ── Quiz Settings Drawer ── */}
      <QuizSettingsDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingQuiz(null); }}
        programId={programId}
        lessonTitle={drawerLesson}
        scopeSessionIds={drawerScopeSession}
        quiz={editingQuiz}
        onSave={handleQuizSaved}
        onDelete={handleDeleteQuiz}
      />

      {/* ── Formal Assessment Drawer (edit من الجلسة) ── */}
      <FormalAssessmentDrawer
        open={formalDrawerOpen}
        onClose={() => { setFormalDrawerOpen(false); setFormalEditQuiz(null); }}
        programId={programId}
        quiz={formalEditQuiz}
        onSave={(saved) => { handleQuizSaved(saved); setFormalDrawerOpen(false); setFormalEditQuiz(null); }}
      />
    </div>
  );
}

// ─── Standalone page wrapper (keeps backward compat if used as a full page) ───
export default function TrainingContentPage() {
  return (
    <main
      className="flex-1 overflow-y-auto px-5 py-5"
      style={{ background: "#f8fafc", minHeight: 0 }}
    >
      <div className="max-w-[1100px] mx-auto">
        <TrainingContentView />
      </div>
    </main>
  );
}
