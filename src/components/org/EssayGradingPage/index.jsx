import { useState } from "react";

const NAVY   = "#024677";
const MUTED  = "#94a3b8";
const BORDER = "#dde6ee";

const Svg = ({ size = 14, sw = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);
const IcoChevR  = ({ size = 11 }) => <Svg size={size} sw={2.2}><polyline points="9 18 15 12 9 6"/></Svg>;
const IcoChevL  = ({ size = 11 }) => <Svg size={size} sw={2.2}><polyline points="15 18 9 12 15 6"/></Svg>;
const IcoChevLg = ({ size = 16 }) => <Svg size={size} sw={2}><polyline points="15 18 9 12 15 6"/></Svg>;
const IcoChevRg = ({ size = 16 }) => <Svg size={size} sw={2}><polyline points="9 18 15 12 9 6"/></Svg>;
const IcoFile   = ({ size = 40 }) => <Svg size={size} sw={1.2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Svg>;

// ─── mock data ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    label: "السؤال المقالي الأول",
    question: "ما هو دور إتقان القواعد النحوية في بناء جمل إنجليزية صحيحة نحوياً؟",
    answerLabel: "الإجابة المكتوبة",
    answer: "يُعدّ إتقان القواعد النحوية من أهم السمات التي يجب أن يتمتع بها القائد الفعال. فتعلم اللغة لا يعي فقط حفظ القواعد، بل تعني القدرة على التواصل والتعبير وبناء الثقة.",
  },
  {
    id: 2,
    label: "السؤال المقالي الثاني",
    question: "كيف يمكن للممارسة اليومية تحسين مهارات الكتابة باللغة الإنجليزية؟",
    answerLabel: "الإجابة المكتوبة",
    answer: "يُعدّ إتقان القواعد النحوية من أهم السمات التي يجب أن يتمتع بها القائد الفعال. فتعلم اللغة لا يعي فقط حفظ القواعد، بل تعني القدرة على التواصل والتعبير وبناء الثقة.",
  },
  {
    id: 3,
    label: "السؤال المقالي الثالث",
    question: "ضع مثال عملي من بيئة العمل توضح تأثير هذه المهارات اللغوية.",
    answerLabel: "الإجابة المكتوبة",
    answer: "يُعدّ إتقان القواعد النحوية من أهم السمات التي يجب أن يتمتع بها القائد الفعال. فتعلم اللغة لا يعي فقط حفظ القواعد، بل تعني القدرة على التواصل والتعبير وبناء الثقة.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EssayGradingPage({ submission, task, onBack }) {
  const [grade,   setGrade]   = useState("");
  const [notes,   setNotes]   = useState("");
  const [pdfPage, setPdfPage] = useState(1);
  const pdfPages = 3; // mock total pages

  const studentName = submission?.student    ?? "ساره العتيبي";
  const submitDate  = submission?.deadline   ?? "24 يناير 2026 • 10:15 م";
  const taskTitle   = task?.title            ?? "مشروع كتابة مقال باللغة الإنجليزية";
  const taskProgram = task?.program          ?? "دبلومة اللغة الإنجليزية للأعمال";
  const passRate    = task?.passRate         ?? "70%";
  const parentTitle = task?.parentTitle      ?? "كويز مراجعة قواعد اللغة الإنجليزية";
  const hasPdf      = submission?.hasPdf     ?? false;

  return (
    <main
      className="flex-1 overflow-y-auto"
      dir="rtl"
      style={{ background: "#fff", padding: "14px 16px" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── top bar: breadcrumb + save button ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14, direction: "rtl",
        }}>
          {/* breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={onBack} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: MUTED, padding: 0,
            }}>
              إدارة التقييمات والتصحيح
            </button>
            <span style={{ color: MUTED, display: "flex" }}><IcoChevR size={10} /></span>
            <button onClick={onBack} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: MUTED, padding: 0,
            }}>
              {parentTitle}
            </button>
          </div>

          {/* save + next button */}
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 36, padding: "0 18px",
            background: NAVY, color: "#fff", border: "none",
            borderRadius: 7, fontSize: 12, fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(2,70,119,0.25)",
          }}>
            <IcoChevL size={11} />
            حفظ والتالي
          </button>
        </div>

        {/* ── student name + date ── */}
        <div style={{ marginBottom: 14, textAlign: "right" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, margin: 0 }}>
            {studentName}
          </h1>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{submitDate}</p>
        </div>

        {/* ── task header card ── */}
        <div style={{
          background: "#F8FAFC",
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: "14px 20px",
          marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          direction: "rtl",
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0 }}>{taskTitle}</p>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{taskProgram}</p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: "3px 12px", borderRadius: 20,
            background: "#dcfce7", color: "#16a34a",
          }}>
            نسبة النجاح {passRate}
          </span>
        </div>

        {/* ── two-column layout ── */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

          {/* ── RIGHT: questions OR pdf viewer ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {hasPdf ? (
              /* ── PDF Viewer ── */
              <div style={{
                background: NAVY,
                borderRadius: 16,
                overflow: "hidden",
                display: "flex", flexDirection: "column",
              }}>
                {/* pdf toolbar */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px",
                  background: "rgba(255,255,255,0.08)",
                  direction: "rtl",
                }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    مشروع كتابة مقال.pdf
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}
                    >
                      <IcoChevRg size={16} />
                    </button>
                    <span style={{ fontSize: 12, color: "#fff", minWidth: 60, textAlign: "center" }}>
                      {pdfPage} / {pdfPages}
                    </span>
                    <button
                      onClick={() => setPdfPage(p => Math.min(pdfPages, p + 1))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}
                    >
                      <IcoChevLg size={16} />
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>100%</span>
                </div>

                {/* pdf page mock */}
                <div style={{
                  background: "#e8edf2",
                  margin: "12px 16px 16px",
                  borderRadius: 8,
                  minHeight: 560,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "flex-start",
                  padding: "40px 48px",
                  gap: 12,
                }}>
                  {/* mock pdf lines */}
                  {[...Array(14)].map((_, i) => (
                    <div key={i} style={{
                      height: 10,
                      borderRadius: 4,
                      background: i === 0 ? "#b0bec5" : "#cfd8dc",
                      width: i === 0 ? "40%" : i % 5 === 4 ? "60%" : "100%",
                      alignSelf: i === 0 ? "center" : "stretch",
                    }} />
                  ))}
                </div>
              </div>
            ) : (
              /* ── Questions & Answers ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {QUESTIONS.map(q => (
                  <div key={q.id} style={{
                    background: "#fff",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 10,
                    padding: "16px 18px",
                    direction: "rtl",
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                      {q.label}
                    </p>
                    <p style={{ fontSize: 13, color: "#1f2937", marginBottom: 14, lineHeight: 1.6 }}>
                      {q.question}
                    </p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 6 }}>
                      {q.answerLabel}
                    </p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>
                      {q.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── LEFT: grading panel (sticky) ── */}
          <div style={{
            width: 300, flexShrink: 0,
            position: "sticky", top: 14,
            display: "flex", flexDirection: "column", gap: 10,
          }}>

            {/* grade + notes combined card */}
            <div style={{
              background: "#F8FAFC",
              borderRadius: 40,
              padding: "32px 24px",
              direction: "rtl",
              display: "flex", flexDirection: "column", gap: 20,
              boxSizing: "border-box",
              width: "100%",
            }}>
              {/* grade */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                  درجة السؤال المقالي (من 100)
                </p>
                <input
                  type="number"
                  min={0} max={100}
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="أدخل الدرجة..."
                  dir="rtl"
                  style={{
                    width: "100%", height: 68,
                    padding: "0 12px",
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 14, fontSize: 14,
                    color: NAVY, fontWeight: 600,
                    background: "#fff", outline: "none",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => (e.target.style.borderColor = NAVY)}
                  onBlur={e  => (e.target.style.borderColor = BORDER)}
                />
              </div>

              {/* notes */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>
                    ملاحظات وتغذية راجعة للطالب
                  </p>
                  <span style={{ fontSize: 11, color: MUTED }}>(اختياري)</span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="أضف ملاحظاتك وتوجيهاتك للطالب..."
                  dir="rtl"
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 7, fontSize: 12,
                    color: "#374151",
                    background: "#fff", outline: "none",
                    resize: "vertical",
                    transition: "border-color 0.15s",
                    fontFamily: "inherit", lineHeight: 1.6,
                    boxSizing: "border-box",
                  }}
                  onFocus={e => (e.target.style.borderColor = NAVY)}
                  onBlur={e  => (e.target.style.borderColor = BORDER)}
                />
              </div>

              {/* save button */}
              <button style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                height: 40, width: "100%",
                background: NAVY, color: "#fff", border: "none",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(2,70,119,0.25)",
              }}>
                <IcoChevL size={11} />
                حفظ والتالي
              </button>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
