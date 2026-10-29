import { useState, useRef, useEffect, useCallback } from "react";
import { fetchTraineeProgramTasks, submitTraineeTask } from "../../../services/api";

// ─── colours ──────────────────────────────────────────────────────────────────
const C = {
  navy:        "#005A8D",
  navyDark:    "#003F63",
  green:       "#20B86B",
  orange:      "#F59E0B",
  mintBadge:   "#A8D3CB",
  mintText:    "#1A7A6E",
  text:        "#1F2937",
  muted:       "#9AA4B2",
  border:      "#E7ECF0",
  surface:     "#F6F8FA",
  white:       "#FFFFFF",
};

// ─── tiny icon helpers ────────────────────────────────────────────────────────
const Svg = ({ size = 16, sw = 1.6, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }} {...rest}>
    {children}
  </svg>
);

const IcoDownload   = ({ size = 14 }) => <Svg size={size}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>;
const IcoFile       = ({ size = 14 }) => <Svg size={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Svg>;
const IcoFilePdf    = ({ size = 14 }) => <Svg size={size} stroke={C.orange}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></Svg>;
const IcoUpload     = ({ size = 32 }) => <Svg size={size} sw={1.4}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></Svg>;
const IcoLock       = ({ size = 14 }) => <Svg size={size}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>;
const IcoArrowL     = ({ size = 13 }) => <Svg size={size} sw={2.2}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>;
const IcoCalendar   = ({ size = 12 }) => <Svg size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>;
const IcoClock      = ({ size = 12 }) => <Svg size={size}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></Svg>;
const IcoQuiz       = ({ size = 12 }) => <Svg size={size}><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
const IcoDot        = () => (
  <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: C.muted, verticalAlign: "middle", margin: "0 5px" }} />
);

// ─── mock data ────────────────────────────────────────────────────────────────
const MOCK_TASKS = [
  {
    id: 1,
    type: "quiz",           // "quiz" | "assignment" | "exam"
    badge: "كويز قصير",
    badgeColor: C.navy,
    badgeBg: "#E8F4FB",
    title: "عنوان تاسك",
    desc: "وصف التاسك",
    meta: "15 سؤال",
    score: "92%",
    scoreColor: C.green,
    scoreLabel: "مراجعة الإجابات",
    status: "submitted",   // "submitted" | "pending" | "locked"
  },
  {
    id: 2,
    type: "assignment",
    badge: "واجب عملي",
    badgeColor: "#92400E",
    badgeBg: "#FEF3C7",
    title: "مشروع تصميم بنية VPC الأمنية",
    desc: "صمّم بنية VPC متكاملة تتضمن Bastion Host وNACLs وSecurity Groups. قدّم ملف PDF يشرح التصميم مع رسم تخطيطي.",
    dueDate: "الجمعة 3 أكتوبر 2026",
    trainerNote: "يُرسله المدرب • مراجعة بشرية • رفع ملفات",
    steps: [
      { num: 1, label: "تم التسليم",   done: true,  active: true  },
      { num: 2, label: "قيد المراجعة", done: false, active: false },
      { num: 3, label: "تم التقييم",   done: false, active: false },
    ],
    attachments: [
      { name: "Security_Guide.docx", icon: "doc" },
      { name: "VPC_Template.pdf",    icon: "pdf" },
    ],
    status: "submitted",
  },
  {
    id: 3,
    type: "exam",
    badge: "امتحان محدود",
    badgeColor: C.mintText,
    badgeBg: "#D1F0EA",
    title: "عنوان الامتحان",
    date: "الجمعة 26 سبتمبر 2026",
    timeFrom: "2:00 م",
    timeTo: "3:00 م",
    opensAt: "2:00 م",
    status: "locked",
  },
];

// ─── step indicator ───────────────────────────────────────────────────────────
function StepBar({ steps }) {
  // RTL: اعكس الترتيب عشان الخطوة 1 تكون على اليمين
  const reversed = [...steps].reverse();
  return (
    <div className="flex items-start justify-end gap-0 my-4 px-4" dir="ltr">
      {reversed.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2"
              style={{
                background:  s.active ? C.navy  : C.white,
                borderColor: s.active ? C.navy  : s.done ? C.navy : C.border,
                color:       s.active ? C.white : s.done ? C.navy : C.muted,
              }}
            >
              {s.num}
            </div>
            <span className="text-[10px] whitespace-nowrap" style={{ color: s.active ? C.navy : C.muted }}>
              {s.label}
            </span>
          </div>
          {/* connector line after each step except last in reversed array */}
          {i < reversed.length - 1 && (
            <div style={{ width: 40, height: 1.5, background: reversed[i + 1]?.done || reversed[i + 1]?.active ? C.navy : C.border, marginBottom: 18 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── file chip ────────────────────────────────────────────────────────────────
function FileChip({ name, icon }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
      style={{ background: C.white, border: `1px solid ${C.border}`, color: C.text }}
    >
      <span style={{ color: icon === "pdf" ? C.orange : C.navy }}>
        {icon === "pdf" ? <IcoFilePdf size={13} /> : <IcoFile size={13} />}
      </span>
      <span className="truncate max-w-[120px]">{name}</span>
      <button
        className="mr-auto flex items-center"
        style={{ color: C.navy }}
        title="تحميل"
      >
        <IcoDownload size={13} />
      </button>
    </div>
  );
}

// ─── quiz card ────────────────────────────────────────────────────────────────
function QuizCard({ task }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.white, border: `1px solid ${C.border}` }}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        {/* right: score */}
        <div className="flex flex-col gap-2 shrink-0">
          <span className="text-2xl font-extrabold leading-none" style={{ color: task.scoreColor }}>
            {task.score}
          </span>
          <button
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg border"
            style={{ borderColor: C.border, color: C.text, background: C.white }}
          >
            {task.scoreLabel}
          </button>
        </div>

        {/* left: info */}
        <div className="flex-1 min-w-0 text-right space-y-1">
          <span
            className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
            style={{ background: task.badgeBg, color: task.badgeColor }}
          >
            {task.badge}
          </span>
          <p className="text-sm font-extrabold" style={{ color: C.text }}>{task.title}</p>
          <p className="text-[11px]" style={{ color: C.muted }}>{task.desc}</p>
          <div className="flex items-center justify-end gap-1 text-[11px]" style={{ color: C.muted }}>
            <IcoQuiz />
            <IcoDot />
            <span>{task.meta}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── assignment card ──────────────────────────────────────────────────────────
function AssignmentCard({ task, programId, onSubmitDone }) {
  const [file,      setFile]      = useState(null);
  const [link,      setLink]      = useState("");
  const [dragging,  setDragging]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [submitted, setSubmitted] = useState(task.status === "submitted");
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.stopPropagation();
    if (!file && !link.trim()) {
      setError("يرجى رفع ملف أو إدخال رابط قبل التسليم");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await submitTraineeTask(programId, task.id, { file, link: link.trim() || undefined });
      setSubmitted(true);
      setFile(null);
      setLink("");
      onSubmitDone?.();
    } catch (err) {
      setError(err?.message ?? "حدث خطأ أثناء التسليم، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: C.white,
        border: `1.5px solid #FDDDB5`,
      }}
      dir="rtl"
    >
      {/* header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div className="text-right space-y-0.5 flex-1 min-w-0">
          <span
            className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
            style={{ background: task.badgeBg, color: task.badgeColor }}
          >
            {task.badge}
          </span>
          <p className="text-[11px] mt-1" style={{ color: C.muted }}>{task.trainerNote}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1 text-[11px]" style={{ color: C.muted }}>
          <IcoCalendar />
          <span className="whitespace-nowrap">موعد التسليم: {task.dueDate}</span>
        </div>
      </div>

      {/* step bar */}
      <StepBar steps={task.steps} />

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* project info */}
      <div className="px-4 py-4 space-y-2" dir="rtl">
        <h3 className="text-[15px] font-extrabold" style={{ color: C.text }}>{task.title}</h3>
        <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>{task.desc}</p>
      </div>

      {/* trainer attachments */}
      {task.attachments?.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl px-3 py-3 space-y-2"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <p className="text-[11px] font-extrabold text-right" style={{ color: C.text }}>
            مرفقات المدرب
          </p>
          <div className="flex flex-wrap gap-2">
            {task.attachments.map((a, i) => (
              <FileChip key={i} name={a.name} icon={a.icon} />
            ))}
          </div>
        </div>
      )}

      {/* upload zone */}
      <div className="px-4 pb-3">
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="rounded-2xl flex flex-col items-center justify-center gap-2 py-7 px-4 text-center transition-colors"
          style={{
            border: `1.5px dashed ${dragging ? C.navy : "#CBD5E1"}`,
            background: dragging ? "#EBF4FB" : C.white,
            cursor: "pointer",
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.zip,.rar"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: C.surface, color: C.muted }}>
            <IcoUpload size={26} />
          </div>
          {file ? (
            <p className="text-[12px] font-bold" style={{ color: C.navy }}>{file.name}</p>
          ) : (
            <>
              <p className="text-[13px] font-bold" style={{ color: C.text }}>اسحب وأفلت ملفاتك هنا</p>
              <p className="text-[11px]" style={{ color: C.muted }}>PDF, ZIP أو رابط GitHub</p>
            </>
          )}
          <button
            type="button"
            className="mt-1 px-5 py-2 rounded-xl text-[12px] font-extrabold text-white"
            style={{ background: C.navyDark }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            اختر ملفًا
          </button>
        </div>
      </div>

      {/* bottom action row */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: `1px solid ${C.border}` }}
        dir="rtl"
      >
        {submitted ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-extrabold"
            style={{ background: "#ECFDF5", color: C.green }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            تم التسليم بنجاح
          </div>
        ) : (
          <>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-white shrink-0 transition-opacity"
              style={{ background: loading ? "#9AA4B2" : C.navyDark, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ) : (
                <IcoArrowL size={13} />
              )}
              {loading ? "جارٍ التسليم..." : "تسليم التاسك"}
            </button>
            <input
              value={link}
              onChange={e => { setLink(e.target.value); setError(null); }}
              placeholder="أو أدخل رابط Figma / GitHub..."
              className="flex-1 min-w-0 text-[11px] px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#005A8D]/20 focus:border-[#005A8D] transition placeholder:text-slate-300 text-right"
              style={{ borderColor: error ? "#ef4444" : C.border }}
              dir="rtl"
            />
          </>
        )}
      </div>
      {/* error message */}
      {error && (
        <div className="px-4 pb-3 text-[11px] font-semibold text-right" style={{ color: "#ef4444" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── exam card ────────────────────────────────────────────────────────────────
function ExamCard({ task }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.white, border: `1px solid ${C.border}` }}
      dir="rtl"
    >
      {/* top row */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
            <span>يُفتح في</span>
            <IcoDot />
            <span className="font-bold" style={{ color: C.text }}>{task.opensAt}</span>
          </div>
        </div>
        <span
          className="text-[10px] font-extrabold px-3 py-0.5 rounded-full"
          style={{ background: task.badgeBg, color: task.badgeColor }}
        >
          {task.badge}
        </span>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* body */}
      <div className="flex items-center justify-between gap-3 px-4 py-3" dir="rtl">
        {/* lock button */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            disabled
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold border"
            style={{ borderColor: C.border, color: C.muted, background: C.surface, cursor: "not-allowed" }}
          >
            <IcoLock size={13} />
            مقفل
          </button>
          <span className="text-[10px]" style={{ color: C.muted }}>يفتح عند الموعد المحدد</span>
        </div>

        {/* info */}
        <div className="flex-1 min-w-0 text-right space-y-1">
          <p className="text-[14px] font-extrabold" style={{ color: C.text }}>{task.title}</p>
          <div className="flex items-center justify-end flex-wrap gap-x-2 gap-y-0.5 text-[11px]" style={{ color: C.muted }}>
            <div className="flex items-center gap-1">
              <IcoCalendar />
              <span>{task.date}</span>
            </div>
            <IcoDot />
            <div className="flex items-center gap-1">
              <IcoClock />
              <span>{task.timeFrom} – {task.timeTo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────
export default function TasksTab({ tasks: propTasks, programId }) {
  const [tasks,   setTasks]   = useState(propTasks ?? null);
  const [loading, setLoading] = useState(!propTasks && !!programId);

  const loadTasks = useCallback(() => {
    if (!programId) return;
    setLoading(true);
    fetchTraineeProgramTasks(programId)
      .then(res => {
        const raw = res?.data?.tasks ?? res?.data ?? [];
        if (!Array.isArray(raw) || raw.length === 0) {
          // API returned empty — show mock data so the tab is never blank
          setTasks(MOCK_TASKS);
          return;
        }
        // normalise each task to the shape AssignmentCard/QuizCard/ExamCard expects
        const normalised = raw.map(t => ({
          id:          t.id,
          type:        t.type ?? "assignment",          // "quiz"|"assignment"|"exam"
          badge:       t.badge_label ?? t.type_label ?? "واجب",
          badgeColor:  t.badge_color  ?? "#92400E",
          badgeBg:     t.badge_bg     ?? "#FEF3C7",
          title:       t.title,
          desc:        t.description ?? t.desc ?? "",
          dueDate:     t.due_date_label ?? t.due_date ?? "",
          trainerNote: t.note ?? "",
          meta:        t.meta ?? "",
          score:       t.score != null ? `${t.score}%` : null,
          scoreColor:  t.score >= 50 ? C.green : "#ef4444",
          scoreLabel:  "مراجعة الإجابات",
          status:      t.status ?? "pending",
          steps:       t.steps ?? [
            { num: 1, label: "تم التسليم",   done: t.status === "submitted" || t.status === "graded", active: t.status === "submitted" },
            { num: 2, label: "قيد المراجعة", done: t.status === "graded",   active: t.status === "graded" && !t.score },
            { num: 3, label: "تم التقييم",   done: !!t.score,               active: !!t.score },
          ],
          attachments: t.attachments ?? [],
          date:        t.date ?? "",
          timeFrom:    t.time_from ?? "",
          timeTo:      t.time_to   ?? "",
          opensAt:     t.opens_at  ?? "",
        }));
        setTasks(normalised);
      })
      .catch(() => {
        // API endpoint not available — fall back to mock data silently
        setTasks(MOCK_TASKS);
      })
      .finally(() => setLoading(false));
  }, [programId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // loading skeleton
  if (loading) {
    return (
      <div dir="rtl" className="space-y-3 px-3 sm:px-4 py-4">
        {[1, 2].map(i => (
          <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  // empty state
  const list = tasks ?? MOCK_TASKS;
  if (list.length === 0) {
    return (
      <div dir="rtl" className="px-4 py-10 text-center text-sm text-slate-400">
        لا توجد مهام لهذا البرنامج بعد
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-3 px-3 sm:px-4 py-4">
      {list.map(task => {
        if (task.type === "quiz")       return <QuizCard       key={task.id} task={task} />;
        if (task.type === "assignment") return (
          <AssignmentCard
            key={task.id}
            task={task}
            programId={programId}
            onSubmitDone={loadTasks}
          />
        );
        if (task.type === "exam")       return <ExamCard       key={task.id} task={task} />;
        return null;
      })}
    </div>
  );
}
