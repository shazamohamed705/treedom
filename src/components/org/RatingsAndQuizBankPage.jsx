import { useState, useEffect, useMemo, useRef } from "react";
import { fetchPrograms } from "../../services/api";

// ─── Brand colours ────────────────────────────────────────────────────────────
const C = {
  primary: "#024677",
  text: "#1D293D",
  muted: "#64748B",
  border: "#E2E8F0",
  bg: "#F8FAFC",
  card: "#FFFFFF",
};

// ─── Tiny SVG helpers ─────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none", className = "" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
    style={{ display: "block", flexShrink: 0 }}
  >{d}</svg>
);

const IcoFlag    = ({ size = 16 }) => <Ico size={size} fill="#f59e0b" stroke="#f59e0b" sw={1.5} d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>} />;
const IcoStar    = ({ size = 16 }) => <Ico size={size} fill="#f59e0b" stroke="#f59e0b" sw={1.5} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />;
const IcoPlus    = ({ size = 14 }) => <Ico size={size} sw={2.4} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoSearch  = ({ size = 14 }) => <Ico size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoChevron = ({ size = 14, down = false }) => (
  <Ico size={size} sw={2.2} d={<polyline points={down ? "6 9 12 15 18 9" : "9 18 15 12 9 6"}/>} />
);
const IcoDots    = ({ size = 16 }) => (
  <Ico size={size} d={<><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></>} fill="currentColor" sw={0}/>
);
const IcoEdit    = ({ size = 14 }) => <Ico size={size} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcoLink    = ({ size = 14 }) => <Ico size={size} d={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} />;

function textOf(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.ar || v.en || v.name || "";
}

// ─── Mock quiz bank data ──────────────────────────────────────────────────────
const MOCK_QUIZZES = [
  {
    id: 1,
    title: "كويز مراجعة  قواعد اللغة الإنجليزية",
    subtitle: "مستخدم في 1 برامج",
    trainer: "خالد المتيق",
    program: "دبلومة اللغة الإنجليزية للأعمال",
    unit: "الوحدة الأولى",
    type: "كويز تدريبي",
    questions: 10,
    typeStyle: "training",
  },
  {
    id: 2,
    title: "كويز تجميعي — الوحدة الأول",
    subtitle: "مستخدم في 1 برامج",
    trainer: "فهد الشريمي",
    program: "دبلومة اللغة الإنجليزية للأعمال",
    unit: "الوحدة الأولى",
    type: "كويز قيَّم",
    questions: 15,
    typeStyle: "graded",
  },
  {
    id: 3,
    title: "كويز مهارات المحادثة الإنجليزية",
    subtitle: "مستخدم في 2 برامج",
    trainer: "محمد الحربي",
    program: "مهارات الكتابة باللغة الإنجليزية",
    unit: "الوحدة الثانية",
    type: "كويز تدريبي",
    questions: 8,
    typeStyle: "training",
  },
  {
    id: 4,
    title: "كويز مهارات المحادثة الإنجليزية",
    subtitle: "مستخدم في 2 برامج",
    trainer: "نورة الزهراني",
    program: "مهارات الكتابة باللغة الإنجليزية",
    unit: "الوحدة الثانية",
    type: "كويز تدريبي",
    questions: 8,
    typeStyle: "training",
  },
  {
    id: 5,
    title: "كويز مهارات المحادثة الإنجليزية",
    subtitle: "مستخدم في 2 برامج",
    trainer: "عبدالعزيز الدوسري",
    program: "مهارات الكتابة باللغة الإنجليزية",
    unit: "الوحدة الثانية",
    type: "كويز تدريبي",
    questions: 8,
    typeStyle: "training",
  },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, iconBg = "#fef3c7", iconColor = "#f59e0b" }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 flex-1 min-w-0"
      style={{ border: `1px solid ${C.border}` }}
    >
      {/* icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      {/* text */}
      <div className="min-w-0 flex-1" dir="rtl">
        <p className="text-[11px] leading-tight" style={{ color: C.muted }}>{label}</p>
        <p className="text-xl font-extrabold leading-tight mt-0.5" style={{ color: C.text }}>
          {value}
        </p>
        {sub && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: C.muted }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type, style }) {
  if (style === "graded") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
        style={{ background: "#dcfce7", color: "#16a34a" }}
      >
        {type}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: "#f1f5f9", color: C.muted }}
    >
      {type}
    </span>
  );
}

// ─── Row actions dropdown ─────────────────────────────────────────────────────
function RowActions({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        style={{ color: C.muted }}
      >
        <IcoDots size={16} />
      </button>
      {open && (
        <div
          className="absolute left-0 mt-1 z-30 bg-white rounded-xl shadow-lg overflow-hidden"
          style={{ border: `1px solid ${C.border}`, minWidth: 120 }}
        >
          <button
            onClick={() => { setOpen(false); onEdit?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-medium hover:bg-slate-50 transition-colors"
            style={{ color: C.text }}
            dir="rtl"
          >
            <IcoEdit size={13} />
            تصحيح
          </button>
          <div style={{ borderTop: `1px solid ${C.border}` }} />
          <button
            onClick={() => { setOpen(false); onDelete?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-medium hover:bg-red-50 transition-colors"
            style={{ color: "#ef4444" }}
            dir="rtl"
          >
            حذف
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function QuizRow({ quiz, onEdit, onDelete, isLast }) {
  return (
    <tr
      className="group hover:bg-slate-50/60 transition-colors"
      style={{ borderBottom: isLast ? "none" : `1px solid ${C.border}` }}
    >
      {/* title + subtitle */}
      <td className="px-4 py-3 text-right" dir="rtl">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }}>
            <IcoFlag size={13} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: C.text, maxWidth: 220 }}>
              {quiz.title}
            </p>
            <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.muted }}>
              <IcoLink size={10} />
              {quiz.subtitle}
            </p>
          </div>
        </div>
      </td>

      {/* trainer */}
      <td className="px-4 py-3 text-right" dir="rtl">
        <p className="text-[12px]" style={{ color: C.text }}>{quiz.trainer}</p>
      </td>

      {/* program */}
      <td className="px-4 py-3 text-right" dir="rtl">
        <p className="text-[12px] truncate" style={{ color: C.text, maxWidth: 180 }}>{quiz.program}</p>
      </td>

      {/* unit */}
      <td className="px-4 py-3 text-right" dir="rtl">
        <p className="text-[12px]" style={{ color: C.text }}>{quiz.unit}</p>
      </td>

      {/* type */}
      <td className="px-4 py-3 text-right" dir="rtl">
        <TypeBadge type={quiz.type} style={quiz.typeStyle} />
      </td>

      {/* questions */}
      <td className="px-4 py-3 text-right" dir="rtl">
        <p className="text-[12px] font-medium" style={{ color: C.text }}>
          {quiz.questions} <span style={{ color: C.muted }}>سؤال</span>
        </p>
      </td>

      {/* actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 justify-center">
          <button
            onClick={() => onEdit?.(quiz)}
            className="text-[11px] px-2.5 py-1 rounded-lg border hover:bg-slate-50 transition-colors font-medium"
            style={{ borderColor: C.border, color: C.primary }}
          >
            تصحيح
          </button>
          <button
            onClick={() => onDelete?.(quiz)}
            className="text-[11px] px-2.5 py-1 rounded-lg border hover:bg-red-50 transition-colors font-medium"
            style={{ borderColor: C.border, color: "#ef4444" }}
          >
            ...
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Program selector dropdown ────────────────────────────────────────────────
function ProgramDropdown({ value, onChange, options, loading }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  const filtered = options.filter(o => !query.trim() || o.label.includes(query.trim()));

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full h-11 flex items-center justify-between gap-2 rounded-xl border bg-white px-4 text-sm"
        style={{ borderColor: open ? C.primary : C.border, color: selected ? C.text : C.muted }}
        dir="rtl"
      >
        <span className="truncate">{loading ? "جاري التحميل…" : (selected?.label ?? "الكل")}</span>
        <IcoChevron size={13} down />
      </button>
      {open && (
        <div
          className="absolute right-0 left-0 top-full mt-1.5 z-30 bg-white rounded-xl overflow-hidden shadow-lg"
          style={{ border: `1px solid ${C.border}` }}
        >
          {options.length > 4 && (
            <div className="p-2 border-b" style={{ borderColor: C.border }}>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="بحث…"
                className="w-full h-9 rounded-lg border px-3 text-sm outline-none"
                style={{ borderColor: C.border }}
                dir="rtl"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map(o => {
              const active = String(o.value) === String(value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange?.(o.value); setOpen(false); setQuery(""); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-right hover:bg-slate-50"
                  style={{ color: active ? C.primary : C.text, background: active ? "#F4F8FB" : undefined }}
                  dir="rtl"
                >
                  <span className="truncate">{o.label}</span>
                  {active && <span className="text-xs font-bold shrink-0">✓</span>}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-center" style={{ color: C.muted }}>لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RatingsAndQuizBankPage() {
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programFilter, setProgramFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState(MOCK_QUIZZES);

  // fetch real programs for the selector
  useEffect(() => {
    let active = true;
    fetchPrograms({ per_page: 100, page: 1, search: "" })
      .catch(() => null)
      .then(res => {
        if (!active) return;
        const list = res?.data?.programs ?? res?.data ?? [];
        setPrograms(
          (Array.isArray(list) ? list : []).map(p => ({
            value: p.id,
            label: textOf(p.name) || "برنامج",
          }))
        );
      })
      .finally(() => { if (active) setLoadingPrograms(false); });
    return () => { active = false; };
  }, []);

  const programOptions = [{ value: "", label: "الكل" }, ...programs];

  // filtered list
  const visible = useMemo(() => {
    let list = quizzes;
    if (typeFilter === "training") list = list.filter(q => q.typeStyle === "training");
    if (typeFilter === "graded")   list = list.filter(q => q.typeStyle === "graded");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(q2 =>
        q2.title.toLowerCase().includes(q) ||
        q2.trainer.toLowerCase().includes(q) ||
        q2.program.toLowerCase().includes(q)
      );
    }
    return list;
  }, [quizzes, typeFilter, search]);

  // stat counts
  const gradedCount   = quizzes.filter(q => q.typeStyle === "graded").length;
  const trainingCount = quizzes.filter(q => q.typeStyle === "training").length;
  const totalCount    = quizzes.length;

  const handleDelete = (quiz) => {
    setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
  };

  const TYPE_TABS = [
    { id: "all",      label: "الكل"          },
    { id: "training", label: "كويز تدريبي"   },
    { id: "graded",   label: "كويز قيَّم"    },
  ];

  return (
    <main
      className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-5"
      style={{ background: C.bg }}
      dir="rtl"
    >
      <div className="max-w-[1180px] mx-auto space-y-5">

        {/* ── Page header ── */}
        <header>
          <h1 className="text-[22px] font-extrabold" style={{ color: C.text }}>
            التقييمات و بنك الأسئله
          </h1>
        </header>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon={<IcoFlag size={18} />}
            value={gradedCount}
            label="كويزات قيَّمة"
            sub="يغطي وحدة كاملة"
            iconBg="#fef3c7"
            iconColor="#f59e0b"
          />
          <StatCard
            icon={<IcoStar size={18} />}
            value={trainingCount}
            label="كويزات تدريبية"
            sub="مرفق أمام أفضل الدرس منقاة"
            iconBg="#eff6ff"
            iconColor="#3b82f6"
          />
          <StatCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            }
            value={totalCount}
            label="إجمالي التقييمات"
            sub="كويز شلق في المنصة"
            iconBg="#f0fdf4"
            iconColor="#22c55e"
          />
        </div>

        {/* ── Program selector ── */}
        <div
          className="rounded-2xl bg-white px-4 py-3"
          style={{ border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold shrink-0" style={{ color: C.text }}>
              اختر البرنامج
            </label>
            <div className="flex-1 max-w-xs">
              <ProgramDropdown
                value={programFilter}
                onChange={setProgramFilter}
                options={programOptions}
                loading={loadingPrograms}
              />
            </div>
          </div>
        </div>

        {/* ── Toolbar: create button + type tabs + search ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* create button */}
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: C.primary }}
          >
            <IcoPlus size={13} />
            إنشاء كويز جديد
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* type filter tabs */}
          <div
            className="flex items-center rounded-xl overflow-hidden shrink-0"
            style={{ border: `1px solid ${C.border}`, background: "#f1f5f9" }}
          >
            {TYPE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className="px-3 py-2 text-[12px] font-semibold transition-all"
                style={{
                  background: typeFilter === tab.id ? "#fff" : "transparent",
                  color: typeFilter === tab.id ? C.primary : C.muted,
                  boxShadow: typeFilter === tab.id ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
                  borderRadius: 10,
                  margin: 2,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* spacer */}
          <div className="flex-1" />

          {/* search */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
              <IcoSearch size={13} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث عن كويز…"
              className="h-10 rounded-xl border bg-white pr-9 pl-3 text-[12px] outline-none w-full sm:w-52"
              style={{ borderColor: C.border, color: C.text }}
              dir="rtl"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div
          className="rounded-2xl bg-white overflow-hidden"
          style={{ border: `1px solid ${C.border}` }}
        >
          {/* desktop table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: `1px solid ${C.border}` }}>
                  {[
                    { label: "عنوان الكويز",   align: "right" },
                    { label: "المدرب المسئول", align: "right" },
                    { label: "البرنامج",       align: "right" },
                    { label: "الوحدة",         align: "right" },
                    { label: "النوع",          align: "right" },
                    { label: "الأسئلة",        align: "right" },
                    { label: "الإجراءات",      align: "center" },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-4 py-3 text-[12px] font-bold text-${col.align}`}
                      style={{ color: C.muted }}
                      dir="rtl"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-sm" style={{ color: C.muted }}>
                      لا توجد نتائج مطابقة
                    </td>
                  </tr>
                ) : (
                  visible.map((quiz, i) => (
                    <QuizRow
                      key={quiz.id}
                      quiz={quiz}
                      isLast={i === visible.length - 1}
                      onEdit={() => {}}
                      onDelete={() => handleDelete(quiz)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* mobile card fallback — shown below sm breakpoint */}
          <div className="sm:hidden divide-y" style={{ borderColor: C.border }}>
            {visible.map(quiz => (
              <div key={quiz.id} className="px-4 py-4 space-y-2" dir="rtl">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: C.text }}>{quiz.title}</p>
                    <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.muted }}>
                      <IcoLink size={10} />
                      {quiz.subtitle}
                    </p>
                  </div>
                  <TypeBadge type={quiz.type} style={quiz.typeStyle} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: C.muted }}>
                  <span>المدرب: <span style={{ color: C.text }}>{quiz.trainer}</span></span>
                  <span>الوحدة: <span style={{ color: C.text }}>{quiz.unit}</span></span>
                  <span>الأسئلة: <span style={{ color: C.text }}>{quiz.questions}</span></span>
                </div>
                <p className="text-[11px] truncate" style={{ color: C.muted }}>{quiz.program}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    className="flex-1 text-[12px] py-2 rounded-lg border font-medium hover:bg-slate-50 transition-colors"
                    style={{ borderColor: C.border, color: C.primary }}
                  >
                    تصحيح
                  </button>
                  <button
                    onClick={() => handleDelete(quiz)}
                    className="flex-1 text-[12px] py-2 rounded-lg border font-medium hover:bg-red-50 transition-colors"
                    style={{ borderColor: C.border, color: "#ef4444" }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
