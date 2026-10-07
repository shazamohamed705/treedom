import { useState, useRef, useEffect } from "react";
import QuizSettingsDrawer      from "../QuizSettingsDrawer";
import FormalAssessmentDrawer  from "../FormalAssessmentDrawer";
import PracticalTaskDrawer     from "../PracticalTaskDrawer";
import SubmissionsPage         from "../SubmissionsPage";

// ─── colours ──────────────────────────────────────────────────────────────────
const NAVY   = "#024677";
const MUTED  = "#94a3b8";
const BORDER = "#dde6ee";

// ─── svg helpers ──────────────────────────────────────────────────────────────
const Svg = ({ size = 14, sw = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);

const IcoCheck   = ({ size = 14 }) => <Svg size={size}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Svg>;
const IcoStar    = ({ size = 14 }) => <Svg size={size} sw={1.5}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
const IcoFlag    = ({ size = 14 }) => <Svg size={size}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Svg>;
const IcoClip    = ({ size = 14 }) => <Svg size={size}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></Svg>;
const IcoPlus    = ({ size = 11 }) => <Svg size={size} sw={2.2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
const IcoSearch  = ({ size = 12 }) => <Svg size={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>;
const IcoChevD   = ({ size = 10 }) => <Svg size={size} sw={2}><polyline points="6 9 12 15 18 9"/></Svg>;

// ─── mock data ────────────────────────────────────────────────────────────────
const STATS = [
  {
    label: "تسليمات بانتظار التصحيح",
    value: 16,
    sub: "تسليم لم يُصحَّح بعد",
    icon: <IcoCheck size={14} />,
    iconBg: "#EFF6FF",
    iconColor: NAVY,
  },
  {
    label: "تم تصحيحها اليوم",
    value: 4,
    sub: "تصحيح مكتمل اليوم",
    icon: <IcoStar size={14} />,
    iconBg: "#F0FDF4",
    iconColor: "#16a34a",
  },
  {
    label: "أسئله مقابله",
    value: 6,
    sub: "سؤال في انتظار المراجعة",
    icon: <IcoFlag size={14} />,
    iconBg: "#FFF7ED",
    iconColor: "#c2410c",
  },
  {
    label: "التاسكات عملية",
    value: 16,
    sub: "تكليف عملي نشط",
    icon: <IcoClip size={14} />,
    iconBg: "#F5F3FF",
    iconColor: "#7c3aed",
  },
];

const PROGRAMS = [
  "الكل",
  "دبلومة اللغة الإنجليزية للأعمال",
  "أسسيات إدارة المشاريع",
  "مهارات الكتابة باللغة الإنجليزية",
];

const ROWS = [
  {
    id: 1,
    title: "كتابة مقال باللغة الإنجليزية",
    tag: "شط",
    program: "دبلومة اللغة الإنجليزية للأعمال",
    deadline: "24 يناير • 11:59 م",
    status: 14,
    actionLabel: "عرض التسليمات",
  },
  {
    id: 2,
    title: "كتابة مقال باللغة الإنجليزية",
    tag: "قلبي",
    program: "دبلومة اللغة الإنجليزية للأعمال",
    deadline: "24 يناير • 11:59 م",
    status: 14,
    actionLabel: "عرض التسليمات",
  },
  {
    id: 3,
    title: "تصميم خارطة مشروع",
    tag: "قلبي",
    program: "أسسيات إدارة المشاريع",
    deadline: "24 يناير • 11:59 م",
    statusNote: "تم تصحيح الكل (16/16)",
    actionLabel: "عرض الاسلاميات",
  },
];

// ─── dropdown menu items ───────────────────────────────────────────────────────
const CREATE_ITEMS = [
  { key: "formal",    label: "إنشاء تقييم رسمي" },
  { key: "practical", label: "إنشاء تاسك عملي"  },
];

// ─── Tab icons ────────────────────────────────────────────────────────────────
const IcoBook    = ({ size = 13 }) => <Svg size={size}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Svg>;
const IcoExam    = ({ size = 13 }) => <Svg size={size}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>;
const IcoTask    = ({ size = 13 }) => <Svg size={size}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></Svg>;

const TABS = [
  { key: "كورس الدروس والجلسات", icon: <IcoBook  size={13} /> },
  { key: "واجبات",               icon: <IcoTask  size={13} /> },
  { key: "امتحانات",             icon: <IcoExam  size={13} /> },
];

const TAG_STYLE = {
  "تم التصحيح": { bg: "#dcfce7", color: "#15803d" },
  "قلبي":       { bg: "#fee2e2", color: "#b91c1c" },
  "شط":         { bg: "#fef3c7", color: "#92400e" },
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ s }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      background: "#fff",
      border: `1px solid #e2e8f0`,
      borderRadius: 8,
      flex: 1,
      minWidth: 160,
      direction: "rtl",
    }}>
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 6,
        background: s.iconBg, color: s.iconColor,
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>{s.label}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: NAVY, lineHeight: 1 }}>{s.value}</span>
          <span style={{ fontSize: 10, color: MUTED, lineHeight: 1.2 }}>{s.sub}</span>
        </div>
      </div>
    </div>
  );
}

// ─── GradingRow ───────────────────────────────────────────────────────────────
function GradingRow({ r, odd, onViewSubmissions }) {
  const tagStyle = TAG_STYLE[r.tag] ?? { bg: "#f1f5f9", color: "#64748b" };
  const isAction = r.actionLabel === "عرض التسليمات";

  return (
    <tr style={{ background: odd ? "#fafbfc" : "#fff", borderBottom: `1px solid ${BORDER}` }}>

      {/* عنوان التكليف */}
      <td className="px-3 py-3" style={{ verticalAlign: "middle" }} dir="rtl">
        <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, lineHeight: 1.3, marginBottom: 3 }}>
          {r.title}
        </p>
        <span style={{
          display: "inline-block",
          fontSize: 10, fontWeight: 600,
          padding: "1px 8px", borderRadius: 20,
          background: tagStyle.bg, color: tagStyle.color,
        }}>
          {r.tag}
        </span>
      </td>

      {/* البرنامج */}
      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "right", maxWidth: 160 }} dir="rtl">
        <span style={{ fontSize: 12, color: "#374151", display: "block", lineHeight: 1.4 }}>{r.program}</span>
      </td>

      {/* تاريخ التسليم النهائي */}
      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "right" }} dir="rtl">
        <span style={{ fontSize: 12, color: "#374151" }}>{r.deadline}</span>
      </td>

      {/* حالة التصحيح والتسليمات */}
      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "right" }} dir="rtl">
        {r.status != null ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: "#d97706" }}>
            {r.status} بانتظار التصحيح
          </span>
        ) : r.statusNote ? (
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>{r.statusNote}</span>
        ) : (
          <span style={{ fontSize: 12, color: "#6b7280" }}>—</span>
        )}
      </td>

      {/* إجراء */}
      <td className="px-3 py-3" style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
          <button
            onClick={() => isAction && onViewSubmissions?.(r)}
            style={{
              fontSize: 11, padding: "4px 12px", borderRadius: 5,
              border: `1px solid ${isAction ? NAVY : BORDER}`,
              background: isAction ? "#EFF6FF" : "#fff",
              color: isAction ? NAVY : "#4b6070",
              cursor: "pointer", fontWeight: isAction ? 600 : 400,
              whiteSpace: "nowrap",
            }}>
            {r.actionLabel}
          </button>
          <button style={{
            fontSize: 13, padding: "2px 6px", borderRadius: 4,
            border: `1px solid ${BORDER}`, background: "#fff", color: "#4b6070",
            cursor: "pointer", lineHeight: 1,
          }}>···</button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GradingPage() {
  const [search,       setSearch]       = useState("");
  const [activeTab,    setActiveTab]    = useState("كورس الدروس والجلسات");
  const [program,      setProgram]      = useState("الكل");
  const [progOpen,     setProgOpen]     = useState(false);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [quizDrawer,   setQuizDrawer]   = useState(false);
  const [formalDrawer, setFormalDrawer] = useState(false);
  const [practDrawer,  setPractDrawer]  = useState(false);
  const [viewTask,     setViewTask]     = useState(null);
  const createBtnRef = useRef(null);

  useEffect(() => {
    if (!createOpen) return;
    const handler = (e) => {
      if (createBtnRef.current && !createBtnRef.current.contains(e.target))
        setCreateOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [createOpen]);

  const handleCreate = (key) => {
    setCreateOpen(false);
    if (key === "quiz")      setQuizDrawer(true);
    if (key === "formal")    setFormalDrawer(true);
    if (key === "practical") setPractDrawer(true);
  };

  // ── show submissions page ──
  if (viewTask) {
    return <SubmissionsPage task={viewTask} onBack={() => setViewTask(null)} />;
  }

  const rows = ROWS.filter(r => {
    const mS = !search.trim() || r.title.includes(search) || r.program.includes(search);
    const mP = program === "الكل" || r.program === program;
    return mS && mP;
  });

  const TH = {
    fontSize: 12, color: MUTED, textAlign: "right",
    padding: "8px 12px", fontWeight: 600, whiteSpace: "nowrap",
  };

  return (
    <main
      className="flex-1 overflow-y-auto"
      dir="rtl"
      style={{ background: "#fff", padding: "10px 14px" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── title ── */}
        <div style={{ marginBottom: 12, textAlign: "right" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>
            إدارة التقييمات والتصحيح
          </p>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
            متابعة وإدارة التاسكات والامتحانات البرامج التدريبية وتصحيح تسليمات الطلاب
          </p>
        </div>

        {/* ── stats row — 4 cards stretched ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {STATS.map((s, i) => <StatCard key={i} s={s} />)}
        </div>

        {/* ── program select ── */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, textAlign: "right", marginBottom: 5 }}>
            اختر البرنامج
          </p>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setProgOpen(p => !p)}
              style={{
                width: "100%", height: 40, padding: "0 12px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                border: `1px solid ${BORDER}`, borderRadius: 6,
                background: "#fff", fontSize: 13, color: "#374151",
                cursor: "pointer", direction: "rtl",
              }}
            >
              <span>{program}</span>
              <span style={{ color: MUTED }}><IcoChevD size={10} /></span>
            </button>

            {progOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setProgOpen(false)} />
                <div style={{
                  position: "absolute", top: "100%", right: 0, left: 0, zIndex: 20,
                  background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginTop: 2,
                }}>
                  {PROGRAMS.map(p => (
                    <button key={p} onClick={() => { setProgram(p); setProgOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "right",
                        padding: "8px 12px", fontSize: 12,
                        color: p === program ? NAVY : "#374151",
                        fontWeight: p === program ? 700 : 400,
                        background: "none", border: "none", cursor: "pointer",
                      }}
                    >{p}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          borderBottom: `1.5px solid ${BORDER}`, paddingBottom: 0,
        }}>

          {/* اليمين: tabs */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 0, flexDirection: "row-reverse" }}>
            {TABS.map(t => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    height: 38, padding: "0 14px",
                    background: "none", border: "none",
                    borderBottom: active ? `2.5px solid ${NAVY}` : "2.5px solid transparent",
                    color: active ? NAVY : "#5a7a94",
                    fontSize: 13, fontWeight: active ? 700 : 400,
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    marginBottom: -1,
                  }}
                >
                  <span style={{ color: active ? NAVY : MUTED }}>{t.icon}</span>
                  {t.key}
                </button>
              );
            })}
          </div>

          {/* النص: search يـ stretch */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
            <span style={{
              position: "absolute", right: 10, color: MUTED,
              pointerEvents: "none", display: "flex", alignItems: "center",
            }}>
              <IcoSearch size={14} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث عن تكليف..."
              dir="rtl"
              style={{
                width: "100%", height: 36, paddingRight: 32, paddingLeft: 12,
                border: `1px solid ${BORDER}`, borderRadius: 6,
                fontSize: 12, color: "#374151", background: "#fff",
                outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = NAVY)}
              onBlur={e  => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {/* الشمال: زر إنشاء تكليف مع dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }} ref={createBtnRef}>
            <button
              onClick={() => setCreateOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                height: 36, padding: "0 14px",
                background: NAVY, color: "#fff", border: "none",
                borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: "0 1px 4px rgba(2,70,119,0.25)",
              }}
            >
              <IcoPlus size={11} />
              إنشاء تكليف جديد
              <IcoChevD size={9} />
            </button>

            {createOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0,
                zIndex: 50, background: "#fff", minWidth: 200,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}>
                {CREATE_ITEMS.map((item, idx) => (
                  <button
                    key={item.key}
                    onClick={() => handleCreate(item.key)}
                    style={{
                      display: "block", width: "100%",
                      textAlign: "right", direction: "rtl",
                      padding: "10px 14px",
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: idx < CREATE_ITEMS.length - 1 ? `1px solid ${BORDER}` : "none",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0f5fa")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: 0 }}>{item.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── table ── */}
        <div style={{
          background: "#fff",
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0f5fa", borderBottom: `1.5px solid ${BORDER}` }}>
                  <th style={TH}>عنوان التكليف</th>
                  <th style={TH}>البرنامج</th>
                  <th style={TH}>تاريخ التسليم النهائي</th>
                  <th style={TH}>حالة التصحيح والتسليمات</th>
                  <th style={{ ...TH, textAlign: "left" }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0
                  ? rows.map((r, i) => <GradingRow key={r.id} r={r} odd={i % 2 !== 0} onViewSubmissions={setViewTask} />)
                  : (
                    <tr>
                      <td colSpan={5} style={{
                        textAlign: "center", padding: "32px 0",
                        fontSize: 11, color: MUTED,
                      }}>
                        لا توجد نتائج
                      </td>
                    </tr>
                  )
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Drawers ── */}
      <QuizSettingsDrawer
        open={quizDrawer}
        onClose={() => setQuizDrawer(false)}
        onSave={() => setQuizDrawer(false)}
      />
      <FormalAssessmentDrawer
        open={formalDrawer}
        onClose={() => setFormalDrawer(false)}
        onSave={() => setFormalDrawer(false)}
      />
      <PracticalTaskDrawer
        open={practDrawer}
        onClose={() => setPractDrawer(false)}
        onSave={() => setPractDrawer(false)}
      />
    </main>
  );
}
