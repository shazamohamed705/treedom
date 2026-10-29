import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BRAND = "#024677";

// ─── icon helper ─────────────────────────────────────────────────────────────
const I = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const IcoBack = ({ size = 15 }) => <I size={size} sw={2.2} d={<polyline points="15 18 9 12 15 6"/>} />;
const IcoGrad = ({ size = 14 }) => <I size={size} d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;

// ─── field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold" style={{ color: "#1D293D" }}>
        {label}{required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = `w-full px-4 py-2.5 text-sm rounded-xl border border-[#E1E1E1]
  focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
  transition placeholder:text-slate-300 bg-white`;

// ─── main page ────────────────────────────────────────────────────────────────
export default function CustomRequestPage({ program, onBack }) {
  const navigate = useNavigate();

  const progName = program?.name ?? "التسويق الإلكتروني المقدم من فريله المجد";
  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  const [form, setForm] = useState({
    title:    "",
    desc:     "",
    count:    "",
    timeline: "",
  });
  const [file,     setFile]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [sent,     setSent]     = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const canSubmit = form.title.trim() && form.count.trim() && form.timeline.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSent(true);
    setTimeout(() => handleBack(), 1800);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F7F8FA]" dir="rtl">
      <div className="p-3 sm:p-6">
        <div className="max-w-[720px] mx-auto space-y-4">

          {/* ── header card ── */}
          <div className="bg-white rounded-2xl border border-[#E1E1E1] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#0246770D", color: BRAND }}>
                  <IcoGrad />
                </div>
                <div className="leading-tight">
                  <span className="text-xs sm:text-sm" style={{ color: "#94a3b8" }}>البرامج التدريبية / </span>
                  <span className="text-xs sm:text-sm font-extrabold" style={{ color: BRAND }}>طلب برنامج مخصص</span>
                </div>
              </div>
              <button onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                  text-white hover:opacity-90 transition"
                style={{ background: BRAND }}>
                <IcoBack />
                رجوع
              </button>
            </div>
            {/* program sub-label */}
            <div className="px-5 pb-4 -mt-1">
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                استناداً إلى برنامج{" "}
                <span className="font-semibold" style={{ color: BRAND }}>{progName}</span>
              </p>
            </div>
          </div>

          {/* ── form card ── */}
          <div className="bg-white rounded-2xl border border-[#E1E1E1] overflow-hidden">
            <div className="p-5 sm:p-6 space-y-5">

              {/* عنوان التخصيص */}
              <Field label="عنوان التخصيص المطلوب" required>
                <input
                  value={form.title}
                  onChange={set("title")}
                  placeholder="مثل: تسويق قطاع السيارات"
                  className={inputCls} />
              </Field>

              {/* وصف تفصيلي */}
              <Field label="وصف تفصيلي للطلب">
                <textarea
                  value={form.desc}
                  onChange={set("desc")}
                  rows={4}
                  placeholder="اشرح لفريق التدريب ما يحتاجه موظفو الشركة بالتفصيل مع السياق…"
                  className={`${inputCls} resize-none`} />
              </Field>

              {/* عدد المتدربين */}
              <Field label="عدد المتدربين" required>
                <input
                  type="number"
                  min="1"
                  value={form.count}
                  onChange={set("count")}
                  placeholder="أدخل عدد المتدربين"
                  className={inputCls} />
              </Field>

              {/* الجدول الزمني */}
              <Field label="الجدول الزمني المتوقع" required>
                <input
                  value={form.timeline}
                  onChange={set("timeline")}
                  placeholder="مثال: في خلال شهر"
                  className={inputCls} />
              </Field>

              {/* إرفق ملف */}
              <Field label="إرفق ملف (اختياري)">
                <label
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl
                    cursor-pointer transition-colors py-8 px-4 text-center"
                  style={{
                    border: `2px dashed ${dragging ? BRAND : "#CBD5E1"}`,
                    background: dragging ? "#EEF5FC" : "#F8FAFC",
                  }}>
                  <input type="file" accept=".pdf,.ppt,.pptx,image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />

                  {/* upload icon */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>

                  {file ? (
                    <p className="text-sm font-bold" style={{ color: BRAND }}>{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm" style={{ color: "#64748b" }}>
                        اسحب الملفات هنا أو{" "}
                        <span className="font-bold underline" style={{ color: BRAND }}>اختر الملفات</span>
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>PDF, صور, PowerPoint</p>
                    </>
                  )}
                </label>
              </Field>

            </div>

            {/* footer */}
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-t border-[#F0F0F0]">
              <button onClick={handleBack}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-slate-50"
                style={{ color: "#64748b", borderColor: "#E1E1E1" }}>
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || sent}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition
                  hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: BRAND }}>
                {sent ? "✓ تم الإرسال" : "إرسال الطلب"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
