import { useState } from "react";
import QuizSettingsDrawer from "../QuizSettingsDrawer";
import SubmissionsPage    from "../SubmissionsPage";

// ─── colours ──────────────────────────────────────────────────────────────────
const NAVY   = "#024677";
const MUTED  = "#94a3b8";
const BORDER = "#dde6ee";

// ─── tiny svg helpers ─────────────────────────────────────────────────────────
const Svg = ({ size = 14, sw = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);

const IcoCheck  = ({ size = 13 }) => <Svg size={size}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Svg>;
const IcoStar   = ({ size = 13 }) => <Svg size={size} sw={1.5}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
const IcoFlag   = ({ size = 13 }) => <Svg size={size}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Svg>;
const IcoPlus   = ({ size = 11 }) => <Svg size={size} sw={2.2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
const IcoSearch = ({ size = 12 }) => <Svg size={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>;
const IcoLink   = ({ size = 10 }) => <Svg size={size}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>;
const IcoChevD  = ({ size = 10 }) => <Svg size={size} sw={2}><polyline points="6 9 12 15 18 9"/></Svg>;

// ─── mock data ────────────────────────────────────────────────────────────────
const STATS = [
  { label: "إجمالي التقييمات", value: 35, sub: "كويز شطة في المسيرة",    icon: <IcoCheck size={14} />, iconBg: "#EFF6FF", iconColor: NAVY     },
  { label: "اختبارات تدريبية", value: 16, sub: "مرفق أفضل الدرس مباشرة", icon: <IcoStar  size={14} />, iconBg: "#F0FDF4", iconColor: "#16a34a" },
  { label: "كويزات قادمة",     value:  4, sub: "يغطي وحدة كاملة",         icon: <IcoFlag  size={14} />, iconBg: "#FFF7ED", iconColor: "#c2410c" },
];

const PROGRAMS = ["الكل", "دبلومة اللغة الإنجليزية للأعمال", "مهارات المحادثة باللغة الإنجليزية"];

const QUIZZES = [
  { id:1, title:"كويز مراجعة  قواعد اللغة الإنجليزية", usedIn:1, trainer:"خالد العتيبي",      program:"دبلومة اللغة الإنجليزية للأعمال", unit:"الوحدة الأولى",  type:"كويز تدريبي",  questions:10 },
  { id:2, title:"كويز تجميعي — الوحدة الأولى",          usedIn:1, trainer:"فهد الشهري",        program:"دبلومة اللغة الإنجليزية للأعمال", unit:"الوحدة الأولى",  type:"كويز مُقيَّم", questions:15 },
  { id:3, title:"كويز مهارات المحادثة الإنجليزية",       usedIn:2, trainer:"محمد الحربي",       program:"مهارات الكتابة باللغة الإنجليزية", unit:"الوحدة الثانية", type:"كويز تدريبي",  questions: 8 },
  { id:4, title:"كويز مهارات المحادثة الإنجليزية",       usedIn:2, trainer:"نورة الزهراني",     program:"مهارات الكتابة باللغة الإنجليزية", unit:"الوحدة الثانية", type:"كويز تدريبي",  questions: 8 },
  { id:5, title:"كويز مهارات المحادثة الإنجليزية",       usedIn:2, trainer:"عبدالعزيز الدوسري", program:"مهارات الكتابة باللغة الإنجليزية", unit:"الوحدة الثانية", type:"كويز تدريبي",  questions: 8 },
];

const TYPE_COLOR = {
  "كويز تدريبي":  "#d97706",
  "كويز مُقيَّم": "#16a34a",
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ s }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 16px",
        background: "#ffff",
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        width: 260,
        flexShrink: 0,
        direction: "rtl",
      }}
    >
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 6,
        background: s.iconBg, color: s.iconColor,
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>{s.label}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: NAVY, lineHeight: 1 }}>{s.value}</span>
          <span style={{ fontSize: 11, color: MUTED, lineHeight: 1.2 }}>{s.sub}</span>
        </div>
      </div>
    </div>
  );
}

// ─── QuizRow ──────────────────────────────────────────────────────────────────
function QuizRow({ q, odd, onGrade }) {
  return (
    <tr style={{ background: odd ? "#fafbfc" : "#fff", borderBottom: `1px solid ${BORDER}` }}>

      <td className="px-3 py-3" style={{ verticalAlign: "middle" }} dir="rtl">
        <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, lineHeight: 1.3 }}>{q.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, color: MUTED }}>
          <IcoLink size={11} />
          <span style={{ fontSize: 11 }}>مستخدم في {q.usedIn} برنامج</span>
        </div>
      </td>

      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "right" }} dir="rtl">
        <span style={{ fontSize: 12, color: "#374151" }}>{q.trainer}</span>
      </td>

      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "right", maxWidth: 160 }} dir="rtl">
        <span style={{ fontSize: 12, color: "#374151", display: "block", lineHeight: 1.4 }}>{q.program}</span>
      </td>

      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "right" }} dir="rtl">
        <span style={{ fontSize: 12, color: "#374151" }}>{q.unit}</span>
      </td>

      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "right" }} dir="rtl">
        <span style={{ fontSize: 12, fontWeight: 500, color: TYPE_COLOR[q.type] ?? MUTED }}>
          {q.type}
        </span>
      </td>

      <td className="px-3 py-3" style={{ verticalAlign: "middle", textAlign: "center" }} dir="rtl">
        <span style={{ fontSize: 12, color: "#374151" }}>{q.questions} سؤال</span>
      </td>

      <td className="px-3 py-3" style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
          <button
            onClick={() => onGrade?.(q)}
            style={{
            fontSize: 11, padding: "3px 9px", borderRadius: 4,
            border: `1px solid ${BORDER}`, background: "#fff", color: "#4b6070", cursor: "pointer",
          }}>تصحيح</button>
          <button style={{
            fontSize: 13, padding: "2px 6px", borderRadius: 4,
            border: `1px solid ${BORDER}`, background: "#fff", color: "#4b6070", cursor: "pointer",
            lineHeight: 1,
          }}>···</button>
        </div>
      </td>
    </tr>
  );
}

// ─── AddQuizModal ─────────────────────────────────────────────────────────────
export function AddQuizModal({ onClose }) {
  const [title,     setTitle]     = useState("");
  const [type,      setType]      = useState("كويز تدريبي");
  const [program,   setProgram]   = useState("");
  const [unit,      setUnit]      = useState("");
  const [questions, setQuestions] = useState("");

  const inputStyle = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1px solid ${BORDER}`, borderRadius: 6,
    fontSize: 13, color: "#374151", background: "#fff",
    outline: "none", direction: "rtl",
  };
  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#374151", marginBottom: 5, textAlign: "right",
  };

  return (
    <>
      {/* overlay */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.35)",
      }} />

      {/* modal box */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 101, width: 480, background: "#fff",
        borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        direction: "rtl",
      }}>
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${BORDER}`,
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0 }}>
            إنشاء كويز جديد
          </p>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: MUTED, lineHeight: 1, padding: "0 4px",
          }}>✕</button>
        </div>

        {/* body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={labelStyle}>عنوان الكويز</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="أدخل عنوان الكويز..." style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>نوع الكويز</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["كويز تدريبي", "كويز مُقيَّم"].map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, height: 36, borderRadius: 6, fontSize: 12,
                  fontWeight: type === t ? 600 : 400,
                  background: type === t ? NAVY : "#f1f5f9",
                  color:      type === t ? "#fff" : "#5a7a94",
                  border:     type === t ? "none" : `1px solid ${BORDER}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>البرنامج</label>
            <input value={program} onChange={e => setProgram(e.target.value)}
              placeholder="اسم البرنامج..." style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>الوحدة</label>
            <input value={unit} onChange={e => setUnit(e.target.value)}
              placeholder="مثال: الوحدة الأولى" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>عدد الأسئلة</label>
            <input type="number" min={1} value={questions}
              onChange={e => setQuestions(e.target.value)}
              placeholder="10" style={inputStyle} />
          </div>
        </div>

        {/* footer */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "flex-start",
          padding: "14px 20px", borderTop: `1px solid ${BORDER}`,
        }}>
          <button onClick={onClose} style={{
            height: 36, padding: "0 20px", borderRadius: 6,
            border: `1px solid ${BORDER}`, background: "#fff",
            fontSize: 12, color: "#374151", cursor: "pointer",
          }}>
            إلغاء
          </button>
          <button style={{
            height: 36, padding: "0 24px", borderRadius: 6,
            border: "none", background: NAVY,
            fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer",
          }}>
            حفظ الكويز
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("الكل");
  const [program,     setProgram]     = useState("الكل");
  const [progOpen,    setProgOpen]    = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [gradingQuiz, setGradingQuiz] = useState(null);

  // show submissions page → then essay grading
  if (gradingQuiz) {
    return (
      <SubmissionsPage
        task={{ title: gradingQuiz.title, program: gradingQuiz.program }}
        onBack={() => setGradingQuiz(null)}
      />
    );
  }

  const TABS = ["الكل", "كويز تدريبي", "كويز مُقيَّم"];

  const rows = QUIZZES.filter(q => {
    const mS = !search.trim() || q.title.includes(search) || q.trainer.includes(search);
    const mT = filterType === "الكل" || q.type === filterType;
    const mP = program    === "الكل" || q.program === program;
    return mS && mT && mP;
  });

  const TH = {
    fontSize: 12, color: MUTED, textAlign: "right",
    padding: "8px 12px", fontWeight: 600, whiteSpace: "nowrap",
  };

  return (
    <main
      className="flex-1 overflow-y-auto"
      dir="rtl"
      style={{ background: "#ffff", padding: "10px 14px" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── title ── */}
        <p style={{ fontSize: 16, fontWeight: 600, color: NAVY, marginBottom: 12, textAlign: "right" }}>
          التقييمات و بنك الأسئلة
        </p>

        {/* ── stats row — fixed width, not full page ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[...STATS].reverse().map((s, i) => (<StatCard key={i} s={s} />))}
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
                width: "100%", height: 30, padding: "0 10px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                border: `1px solid ${BORDER}`, borderRadius: 4,
                background: "#fff", fontSize: 11, color: "#374151", cursor: "pointer",
              }}
            >
              <span style={{ color: MUTED }}><IcoChevD size={9} /></span>
              <span>{program}</span>
            </button>

            {progOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                  onClick={() => setProgOpen(false)}
                />
                <div style={{
                  position: "absolute", top: "100%", right: 0, left: 0,
                  zIndex: 20, background: "#fff",
                  border: `1px solid ${BORDER}`, borderRadius: 4,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginTop: 2,
                }}>
                  {PROGRAMS.map(p => (
                    <button
                      key={p}
                      onClick={() => { setProgram(p); setProgOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "right",
                        padding: "7px 10px", fontSize: 11,
                        color: p === program ? NAVY : "#374151",
                        fontWeight: p === program ? 700 : 400,
                        background: "none", border: "none", cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── toolbar ── */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          }}
        >
          {/* RIGHT side: search — stretches to fill remaining space */}
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
              placeholder="بحث عن كويز أو مدرب..."
              dir="rtl"
              style={{
                width: "100%", height: 36, paddingRight: 32, paddingLeft: 12,
                border: `1px solid ${BORDER}`, borderRadius: 6,
                fontSize: 12, color: "#374151", background: "#fff",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = NAVY)}
              onBlur={e  => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {/* LEFT side: tabs segment + create button */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* segmented tabs box — rightmost tab first (RTL order) */}
            <div style={{
              display: "flex", alignItems: "center",
              flexDirection: "row-reverse",
              background: "#e8f0f7",
              borderRadius: 7,
              padding: 3,
              gap: 2,
              border: `1px solid ${BORDER}`,
            }}>
              {TABS.map(t => {
                const active = filterType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    style={{
                      height: 33, padding: "0 16px",
                      background: active ? "#fff" : "transparent",
                      color:      active ? NAVY   : "#5a7a94",
                      border:     active ? `1px solid ${BORDER}` : "1px solid transparent",
                      borderRadius: 5, fontSize: 13,
                      fontWeight: active ? 700 : 400,
                      cursor: "pointer",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* create button */}
            <button
              onClick={() => setDrawerOpen(true)}
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
              إنشاء كويز جديد
            </button>
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
                  <th style={TH}>عنوان الكويز</th>
                  <th style={TH}>المدرب المنفذ</th>
                  <th style={TH}>البرنامج</th>
                  <th style={TH}>الوحدة</th>
                  <th style={TH}>النوع</th>
                  <th style={{ ...TH, textAlign: "center" }}>الأسئلة</th>
                  <th style={{ ...TH, textAlign: "left" }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0
                  ? rows.map((q, i) => <QuizRow key={q.id} q={q} odd={i % 2 !== 0} onGrade={setGradingQuiz} />)
                  : (
                    <tr>
                      <td colSpan={7} style={{
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

      {/* ── Quiz Settings Drawer ── */}
      <QuizSettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={(data) => {
          console.log("quiz saved:", data);
          setDrawerOpen(false);
        }}
      />

    </main>
  );
}
