import { useState } from "react";
import EssayGradingPage from "../EssayGradingPage";

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
const IcoSearch  = ({ size = 13 }) => <Svg size={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>;
const IcoChevD   = ({ size = 10 }) => <Svg size={size} sw={2}><polyline points="6 9 12 15 18 9"/></Svg>;
const IcoChevR   = ({ size = 12 }) => <Svg size={size} sw={2}><polyline points="9 18 15 12 9 6"/></Svg>;
const IcoExport  = ({ size = 13 }) => <Svg size={size}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Svg>;
const IcoPlus    = ({ size = 11 }) => <Svg size={size} sw={2.2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;

// ─── mock data ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: "all",     label: "الكل(25)"              },
  { key: "graded",  label: "تم التقييم (16)"       },
  { key: "pending", label: "بانتظار التصحيح(15)"   },
];

const SUBMISSIONS = [
  {
    id: 1,
    student: "ريم علي",
    avatar: "ر",
    deadline: "24 يناير • 11:59 م",
    since: "منذ 3 أيام",
    grade: "92/100",
    status: "تم التقييم",
    action: "عرض التقييم",
    actionVariant: "outline",
  },
  {
    id: 2,
    student: "ريم علي",
    avatar: "ر",
    deadline: "24 يناير • 11:59 م",
    since: "منذ 5 أيام",
    grade: "—",
    status: "بانتظار التصحيح",
    action: "متابعة التصحيح",
    actionVariant: "navy",
  },
  {
    id: 3,
    student: "ريم علي",
    avatar: "ر",
    deadline: "24 يناير • 11:59 م",
    since: "منذ 8 أيام",
    grade: "—",
    status: "بانتظار التصحيح",
    action: "ابدأ التصحيح",
    actionVariant: "navy",
  },
];

const STATUS_STYLE = {
  "تم التقييم":        { color: "#16a34a", bg: "#dcfce7" },
  "بانتظار التصحيح":   { color: "#d97706", bg: "#fef3c7" },
};

const FILTER_OPTS = ["شط / منتهي", "نشط", "منتهي"];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ letter }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: NAVY, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

// ─── SubmissionCard ───────────────────────────────────────────────────────────
function SubmissionCard({ s, onGrade }) {
  const st = STATUS_STYLE[s.status] ?? { color: MUTED, bg: "#f1f5f9" };
  const isNavy = s.actionVariant === "navy";

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "12px 16px",
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: 8,
      direction: "rtl",
    }}>
      {/* اسم الطالب */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 140 }}>
        <Avatar letter={s.avatar} />
        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{s.student}</span>
      </div>

      {/* تاريخ التسليم */}
      <span style={{ fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{s.deadline}</span>

      {/* منذ متى */}
      <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{s.since}</span>

      {/* الدرجة */}
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: s.grade !== "—" ? NAVY : MUTED,
        minWidth: 60, textAlign: "center",
      }}>
        {s.grade}
      </span>

      {/* الحالة */}
      <span style={{
        fontSize: 11, fontWeight: 600,
        padding: "3px 12px", borderRadius: 20,
        background: st.bg, color: st.color,
        whiteSpace: "nowrap",
      }}>
        {s.status}
      </span>

      {/* إجراء */}
      <button
        onClick={() => isNavy && onGrade?.()}
        style={{
          fontSize: 11, padding: "5px 14px", borderRadius: 6,
          border: isNavy ? "none" : `1px solid ${BORDER}`,
          background: isNavy ? NAVY : "#fff",
          color: isNavy ? "#fff" : "#4b6070",
          cursor: "pointer", fontWeight: isNavy ? 600 : 400,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
        {s.action}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubmissionsPage({ task, onBack }) {
  const [search,     setSearch]     = useState("");
  const [activeTab,  setActiveTab]  = useState("all");
  const [filter,     setFilter]     = useState("شط / منتهي");
  const [filterOpen, setFilterOpen] = useState(false);
  const [gradingSub, setGradingSub] = useState(null);

  // show essay grading page
  if (gradingSub) {
    return (
      <EssayGradingPage
        submission={gradingSub}
        task={task}
        onBack={() => setGradingSub(null)}
      />
    );
  }

  const taskTitle   = task?.title   ?? "كويز مراجعة قواعد اللغة الإنجليزية";
  const taskProgram = task?.program ?? "دبلومة اللغة الإنجليزية للأعمال";
  const totalCount  = task?.totalSubmissions ?? 8;

  const rows = SUBMISSIONS.filter(s =>
    !search.trim() || s.student.includes(search)
  );

  return (
    <main
      className="flex-1 overflow-y-auto"
      dir="rtl"
      style={{ background: "#fff", padding: "10px 14px" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── breadcrumb ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, direction: "rtl" }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: NAVY, fontWeight: 600, padding: 0,
          }}>
            إدارة التقييمات والتصحيح
          </button>
          <span style={{ color: MUTED, display: "flex", alignItems: "center" }}>
            <IcoChevR size={12} />
          </span>
          <span style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>{taskTitle}</span>
        </div>

        {/* ── header card ── */}
        <div style={{
          background: "#F8FAFC",
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          direction: "rtl",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>
                {taskTitle}
              </h1>
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: "2px 10px", borderRadius: 20,
                background: "#fef3c7", color: "#d97706",
              }}>
                3 بانتظار التصحيح
              </span>
            </div>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
              {taskProgram} • {totalCount} تسليم إجمالي
            </p>
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 34, padding: "0 14px",
            background: "#fff", color: "#374151",
            border: `1px solid ${BORDER}`, borderRadius: 6,
            fontSize: 12, cursor: "pointer",
          }}>
            <IcoExport size={12} />
            تصدير التقرير
          </button>
        </div>

        {/* ── toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>

          {/* search — يمين يـ stretch */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
            <span style={{
              position: "absolute", right: 10, color: MUTED,
              pointerEvents: "none", display: "flex", alignItems: "center",
            }}>
              <IcoSearch size={13} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث عن تكليف..."
              dir="rtl"
              style={{
                width: "100%", height: 36, paddingRight: 30, paddingLeft: 12,
                border: `1px solid ${BORDER}`, borderRadius: 6,
                fontSize: 12, color: "#374151", background: "#fff",
                outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = NAVY)}
              onBlur={e  => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {/* status tabs — كل زر مستقل تماماً */}
          {STATUS_TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                height: 36, padding: "0 16px",
                background: active ? NAVY : "#fff",
                color:      active ? "#fff" : "#374151",
                border:     `1.5px solid ${active ? NAVY : BORDER}`,
                borderRadius: 7, fontSize: 12,
                fontWeight: active ? 700 : 400,
                cursor: "pointer", whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
                boxShadow: active ? "0 1px 4px rgba(2,70,119,0.18)" : "none",
              }}>
                {t.label}
              </button>
            );
          })}

          {/* فلتر */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setFilterOpen(o => !o)} style={{
              display: "flex", alignItems: "center", gap: 5,
              height: 36, padding: "0 12px",
              border: `1px solid ${BORDER}`, borderRadius: 6,
              background: "#fff", fontSize: 12, color: "#374151",
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {filter}
              <IcoChevD size={9} />
            </button>
            {filterOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setFilterOpen(false)} />
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0,
                  zIndex: 20, background: "#fff",
                  border: `1px solid ${BORDER}`, borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)", minWidth: 140,
                  overflow: "hidden",
                }}>
                  {FILTER_OPTS.map(o => (
                    <button key={o} onClick={() => { setFilter(o); setFilterOpen(false); }} style={{
                      display: "block", width: "100%", textAlign: "right",
                      padding: "8px 12px", fontSize: 12,
                      color: o === filter ? NAVY : "#374151",
                      fontWeight: o === filter ? 700 : 400,
                      background: "none", border: "none", cursor: "pointer",
                    }}>{o}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* زر إنشاء */}
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 36, padding: "0 14px",
            background: NAVY, color: "#fff", border: "none",
            borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(2,70,119,0.25)",
            flexShrink: 0,
          }}>
            <IcoPlus size={11} />
            إنشاء تكليف جديد
          </button>

        </div>

        {/* ── cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.length > 0 ? rows.map(s => (
            <SubmissionCard key={s.id} s={s} onGrade={() => setGradingSub(s)} />
          )) : (
            <div style={{ textAlign: "center", padding: "32px 0", fontSize: 11, color: MUTED }}>
              لا توجد تسليمات
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
