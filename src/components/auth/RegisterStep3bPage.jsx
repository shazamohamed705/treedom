import { useState } from "react";
import { normalizePhone, isPhoneValid, PHONE_ERROR_AR } from "../../services/registerDraft";

// -----------------------------------------------------------------------------
// Progress steps — step 1 done, step 2 active
// -----------------------------------------------------------------------------
const STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",      sub: "بريد الهيئة ومسؤول التواصل", done: true  },
  { n: 2, pct: "80%",  title: "بيانات الهيئة",       sub: "اسم الهيئة و تخصصها",        active: true },
  { n: 3, pct: "100%", title: "التراخيص والوثائق",   sub: "ترخيص ووثائق رسمية" },
];

function ProgressSteps() {
  return (
    <div className="flex flex-col" dir="rtl">
      {STEPS.map((s, idx) => {
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={s.n}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all"
                style={{
                  borderColor: s.active || s.done ? "#5AEACF" : "rgba(255,255,255,0.2)",
                  background:  s.done ? "#5AEACF" : "transparent",
                  color:       s.done ? "#024677" : s.active ? "#5AEACF" : "rgba(255,255,255,0.3)",
                }}>
                {s.done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : s.n}
              </div>
              <div className="text-right flex-1">
                <p className="text-sm font-bold" style={{ color: s.active || s.done ? "#ffffff" : "rgba(255,255,255,0.35)" }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: s.active ? "rgba(255,255,255,0.55)" : s.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>{s.sub}</p>
              </div>
              <span className="text-base font-bold w-12 text-left shrink-0"
                style={{ color: s.active ? "#5AEACF" : s.done ? "#5AEACF" : "rgba(255,255,255,0.3)" }}>
                {s.pct}
              </span>
            </div>
            {!isLast && (
              <div className="flex items-center py-3">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <svg width="14" height="32" viewBox="0 0 14 32" fill="none">
                    <line x1="7" y1="0" x2="7" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M3 20l4 8 4-8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <span className="flex-1" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Reusable field
// -----------------------------------------------------------------------------
function Field({ label, required, placeholder, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 text-right">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300"
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Phone row — plain input, no visible country code
// -----------------------------------------------------------------------------
function PhoneRow({ label, required, phone, onPhone, invalid }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 text-right">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={14}
        value={phone}
        onChange={e => onPhone(normalizePhone(e.target.value))}
        placeholder="5XXXXXXXX"
        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300 ${
          invalid ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#024677]"
        }`}
      />
      {invalid && (
        <p className="text-xs text-red-500 text-right">{PHONE_ERROR_AR}</p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------
export default function RegisterStep3bPage({ initialData = {}, onContinue, onBack, onLoginRedirect }) {
  const [respName,     setRespName]     = useState(initialData.responsible_name ?? "");
  const [respEmail,    setRespEmail]    = useState(initialData.responsible_email ?? "");
  const [respPhone,    setRespPhone]    = useState(normalizePhone(initialData.responsible_phone ?? ""));
  const [respPosition, setRespPosition] = useState(initialData.responsible_position ?? "");

  const phoneValid = isPhoneValid(respPhone);
  const canSubmit = respName && respEmail && respPhone && phoneValid;

  const handleContinue = () => {
    if (!canSubmit) return;
    onContinue?.({
      responsible_name:         respName,
      responsible_email:        respEmail,
      responsible_phone:        normalizePhone(respPhone),
      responsible_country_code: "966",
      responsible_position:     respPosition,
    });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6" dir="rtl"
      style={{ background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)" }}>

      {/* dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
      {/* logo bg */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "url('/logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center 60%",
        backgroundSize: "250%",
        opacity: 0.06,
      }}/>

      <div className="relative w-full max-w-6xl flex flex-col items-center gap-4">
        <div className="w-full flex flex-col lg:flex-row-reverse items-start gap-6 lg:gap-8">

          {/* ── white card ── */}
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-3">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-5 p-5 sm:p-8 lg:p-10">

              {/* treedom logo */}
              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom" style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              {/* heading */}
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>بيانات مسؤول التواصل</h1>
                <p className="text-xs text-slate-400 mt-1">أدخل بيانات الشخص المسؤول عن التواصل في الهيئة</p>
              </div>

              {/* responsible name */}
              <Field label="اسم المسؤول" required
                placeholder="أحمد محمد" value={respName} onChange={e => setRespName(e.target.value)} />

              {/* responsible email */}
              <Field label="البريد الإلكتروني للمسؤول" required type="email"
                placeholder="ahmed@example.com" value={respEmail} onChange={e => setRespEmail(e.target.value)} />

              {/* phone + country code */}
              <PhoneRow
                label="رقم الجوال"
                required
                phone={respPhone}
                onPhone={setRespPhone}
                invalid={!!respPhone && !phoneValid}
              />

              {/* position */}
              <Field label="المسمى الوظيفي"
                placeholder="المدير التنفيذي" value={respPosition} onChange={e => setRespPosition(e.target.value)} />

              {/* buttons */}
              <div className="flex gap-3 mt-1">
                <button onClick={handleContinue} disabled={!canSubmit}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{ background: canSubmit ? "#024677" : "#E2E8F0", color: canSubmit ? "#ffffff" : "#94A3B8", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                  التالي — رفع التراخيص
                </button>
                <button onClick={onBack}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all"
                  style={{ borderColor: "#CBD5E1", color: "#024677", background: "white" }}>
                  رجوع
                </button>
              </div>

              {/* login link */}
              <p className="text-center text-sm text-slate-500">
                هل لديك حساب بالفعل؟{" "}
                <button onClick={onLoginRedirect} className="font-bold" style={{ color: "#024677" }}>
                  تسجل الدخول
                </button>
              </p>

            </div>

            {/* step dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full"
                  style={{ width: 6, height: 6, background: i === 1 ? "#5AEACF" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          </div>

          {/* ── right side ── */}
          <div className="w-full lg:w-[42%] lg:shrink-0 flex flex-col gap-10 py-1 lg:mt-16">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">انضم كـ هيئة تدريبية</h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                أدر برامجك ومدربيك بكفاءة على Treedom
              </p>
            </div>
            <ProgressSteps />
          </div>

        </div>
      </div>
    </div>
  );
}
