import { useState } from "react";
import QuizSettingsDrawer from "../QuizSettingsDrawer";
import FormalAssessmentDrawer from "../FormalAssessmentDrawer";

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

// ─── LessonRow ────────────────────────────────────────────────────────────────
function LessonRow({ lesson, index, onAddQuiz }) {
  const done = lesson.status === "completed";

  return (
    <div dir="rtl">
      {/* lesson card */}
      <div
        className="rounded-lg bg-white mb-2"
        style={{ border: "1px solid #e5e7eb" }}
      >
        {/* lesson row */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* index + content-type icon */}
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{ background: "#f0f6ff", color: BRAND }}
          >
            {index}
          </span>
          <span className="shrink-0" style={{ color: "#64748b" }}>
            {TYPE_ICON[lesson.type] ?? <IcoLesson />}
          </span>

          {/* title */}
          <span
            className="flex-1 min-w-0 text-[12px] leading-snug truncate font-medium"
            style={{ color: done ? "#64748b" : "#1f2937" }}
          >
            {lesson.title}
          </span>

          {/* actions on right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* add quiz button */}
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border hover:bg-slate-50 transition-colors"
              style={{ borderColor: "#e5e7eb", color: "#64748b" }}
              onClick={() => onAddQuiz?.(lesson.title)}
            >
              <IcoQuiz size={11} />
              إضافة كويز
            </button>
          </div>
        </div>

        {/* attached quizzes */}
        {lesson.quizzes?.map((q, qi) => (
          <div
            key={qi}
            className="mx-2 mb-2 rounded-lg px-3 py-2"
            style={{ border: "1px solid #e5e7eb", background: "#fafafa" }}
          >
            {/* row 1: flag + title + badge + actions */}
            <div className="flex items-center justify-between gap-2">
              {/* quiz title + flag icon */}
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ color: "#f59e0b" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                </span>
                <span className="text-[12px] font-semibold truncate" style={{ color: "#1f2937" }}>
                  {q.title}
                </span>
              </div>

              {/* right side: badge + actions */}
              <div className="flex items-center gap-2 shrink-0">
                {q.type && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={
                      q.type === "كويز مُقيَّم"
                        ? { background: "#dcfce7", color: "#16a34a" }
                        : { background: "#f1f5f9", color: "#64748b" }
                    }
                  >
                    {q.type}
                  </span>
                )}
                {q.canEdit && (
                  <>
                    <button className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50 transition-colors" style={{ borderColor: "#e5e7eb", color: "#64748b" }}>حذف</button>
                    <button className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50 transition-colors" style={{ borderColor: "#e5e7eb", color: BRAND }}>تعديل</button>
                  </>
                )}
              </div>
            </div>

            {/* row 2: pending submissions — always left (ltr forced) */}
            {q.pending > 0 && (
              <p
                className="text-[11px] font-semibold mt-1.5"
                style={{ color: "#ef4444", direction: "ltr", textAlign: "left" }}
              >
                {q.pending} تسليم بانتظار التصحيح
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TrainingModule ───────────────────────────────────────────────────────────
function TrainingModule({ module: mod, onAddQuiz }) {
  const [open, setOpen] = useState(mod.open ?? false);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid #e5e7eb" }}
    >
      {/* module header */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors"
        dir="rtl"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: BRAND }}>
            <IcoFolder size={14} />
          </span>
          <span className="text-[13px] font-semibold truncate" style={{ color: "#1f2937" }}>
            {mod.title}
          </span>
          <span className="text-[11px] shrink-0" style={{ color: "#94a3b8" }}>
            {mod.meta}
          </span>
        </div>
        <span
          className="shrink-0 transition-transform duration-200"
          style={{ color: "#94a3b8", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <IcoChevDown size={14} />
        </span>
      </button>

      {/* lessons */}
      {open && (
        <div className="bg-white px-2 pb-1 pt-1.5" dir="rtl">
          {mod.lessons.map((l, i) => (
            <LessonRow key={l.id} lesson={l} index={i + 1} onAddQuiz={onAddQuiz} />
          ))}

          {/* add item button */}
          <button
            className="w-full flex items-center justify-center gap-1.5 mt-1.5 mb-1 py-2 rounded-lg text-[11px] font-medium
              border border-dashed hover:bg-slate-50 transition-colors"
            style={{ borderColor: "#d1d5db", color: "#64748b" }}
          >
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
function TrainingSidebar() {
  const progress = 70;
  const [assessDrawer, setAssessDrawer] = useState(false);

  return (
    <div
      className="rounded-xl p-4 bg-white"
      style={{ border: "1px solid #e5e7eb" }}
      dir="rtl"
    >
      {/* header */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold" style={{ color: "#1f2937" }}>
            الاختبارات والواجبات
          </h2>
          <button
            onClick={() => setAssessDrawer(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}
          >
            <IcoPlus size={11} />
            إضافة تقييم رسمي
          </button>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
          تقييم مستوى المتدرب في البرنامج
        </p>
      </div>

      {/* progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px]" style={{ color: "#64748b" }}>الأداء في المحتوى</span>
          <span className="text-[15px] font-bold" style={{ color: BRAND }}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: BRAND }}
          />
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", marginBottom: "12px" }} />

      {/* assessments */}
      <div className="space-y-2">
        {ASSESSMENTS.map(a => (
          <AssessmentItem key={a.id} item={a} />
        ))}
      </div>

      {/* FormalAssessmentDrawer */}
      <FormalAssessmentDrawer
        open={assessDrawer}
        onClose={() => setAssessDrawer(false)}
        onSave={(data) => { console.log("assessment saved:", data); }}
      />
    </div>
  );
}

// ─── TrainingContentView — embeddable (no outer <main>) ──────────────────────
export function TrainingContentView({ sessions = [] }) {
  const [modules, setModules] = useState(MODULES);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerLesson,  setDrawerLesson]  = useState("");

  const addModule = () => {
    const id = Date.now();
    setModules(prev => [
      ...prev,
      { id, title: `فصل جديد ${prev.length + 1}`, meta: "0 دروس", open: true, lessons: [] },
    ]);
  };

  const openQuizDrawer = (lessonTitle) => {
    setDrawerLesson(lessonTitle);
    setDrawerOpen(true);
  };

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

          {/* modules list */}
          <div className="space-y-2.5">
            {modules.map(mod => (
              <TrainingModule key={mod.id} module={mod} onAddQuiz={openQuizDrawer} />
            ))}
          </div>

          {/* sessions list */}
          {sessions.length > 0 && (
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

          {/* add chapter button */}
          <button
            onClick={addModule}
            className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-lg text-[12px] font-medium
              border hover:bg-slate-50 transition-colors"
            style={{ borderColor: "#d1d5db", color: BRAND }}
          >
            <IcoPlus size={12} />
            إضافة فصل جديد
          </button>
        </div>
      </div>

      {/* ── Sidebar (left, ~28%) ── */}
      <div className="w-full lg:w-[340px] shrink-0">
        <TrainingSidebar />
      </div>

      {/* ── Quiz Settings Drawer ── */}
      <QuizSettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lessonTitle={drawerLesson}
        onSave={(data) => {
          console.log("quiz saved:", data);
          setDrawerOpen(false);
        }}
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
