import { useState } from "react";
import { normalizePhone, isPhoneValid, PHONE_ERROR_AR } from "../services/registerDraft";

// -----------------------------------------------------------------------------
// Eye icon
// -----------------------------------------------------------------------------
const IcoEye = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

// -----------------------------------------------------------------------------
// Password field
// -----------------------------------------------------------------------------
function PasswordField({ label, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 text-right">
        {label} <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <IcoEye open={show} />
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Progress steps — vertical with arrow connectors between them
// -----------------------------------------------------------------------------
const STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",      sub: "بريد الهيئة ومسؤول التواصل" },
  { n: 2, pct: "80%",  title: "بيانات الهيئة",       sub: "اسم الهيئة و تخصصها" },
  { n: 3, pct: "100%", title: "التراخيص والوثائق",   sub: "ترخيص ووثائق رسمية" },
];

function ProgressSteps({ activeStep = 1 }) {
  return (
    <div className="flex flex-col" dir="rtl">
      {STEPS.map((s, idx) => {
        const isActive = s.n === activeStep;
        const isDone   = s.n < activeStep;
        const isLast   = idx === STEPS.length - 1;

        return (
          <div key={s.n}>
            {/* step row: circle → text → percentage (RTL: right to left) */}
            <div className="flex items-center gap-4">

              {/* circle — far right */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all"
                style={{
                  borderColor: isActive || isDone ? "#5AEACF" : "rgba(255,255,255,0.2)",
                  background:  isActive ? "#5AEACF" : "transparent",
                  color:       isActive ? "#024677" : isDone ? "#5AEACF" : "rgba(255,255,255,0.3)",
                }}
              >
                {s.n}
              </div>

              {/* text — middle */}
              <div className="text-right flex-1">
                <p className="text-sm font-bold"
                  style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.35)" }}>
                  {s.title}
                </p>
                <p className="text-xs mt-0.5"
                  style={{ color: isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)" }}>
                  {s.sub}
                </p>
              </div>

              {/* percentage — far left */}
              <span
                className="text-base font-bold w-12 text-left shrink-0"
                style={{ color: isActive ? "#5AEACF" : "rgba(255,255,255,0.3)" }}
              >
                {s.pct}
              </span>
            </div>

            {/* arrow connector */}
            {!isLast && (
              <div className="flex items-center py-3">
                {/* align arrow under circle */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  <svg width="14" height="32" viewBox="0 0 14 32" fill="none">
                    <line x1="7" y1="0" x2="7" y2="22"
                      stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M3 20l4 8 4-8"
                      stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
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
// Main page
// -----------------------------------------------------------------------------
export default function RegisterStep2Page({ accountType, initialData = {}, onContinue, onLoginRedirect }) {
  const [email,    setEmail]    = useState(initialData.email ?? "");
  const [phone,    setPhone]    = useState(normalizePhone(initialData.phone ?? ""));
  const [password, setPassword] = useState(initialData.password ?? "");
  const [confirm,  setConfirm]  = useState(initialData.password_confirmation ?? initialData.password ?? "");

  const phoneValid = isPhoneValid(phone);
  const canSubmit = email && phone && phoneValid && password && confirm && password === confirm;

  const titles = {
    individual: "إنشاء حساب فردي",
    company:    "إنشاء حساب شركة",
    institute:  "إنشاء حساب هيئة تدريبية",
  };
  const title = titles[accountType] ?? "إنشاء حساب";

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{
        background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)",
      }}
    >
      {/* dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      {/* logo background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "url('/logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "280%",
        opacity: 0.08,
      }}/>

      <div className="relative w-full max-w-6xl flex flex-col items-center gap-4">

        <div className="w-full flex flex-col lg:flex-row-reverse items-start gap-6 lg:gap-8">

          {/* ── LEFT (visually): white form card ── */}
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-3">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-5 p-5 sm:p-8 lg:p-10">

              {/* logo */}
              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom"
                  style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              {/* heading */}
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>
                  {title}
                </h1>
                <p className="text-xs text-slate-400 mt-1">أدخل بيانات الهيئة الاساسيه</p>
              </div>

              {/* email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ahmed.zahrani@treedom.sa"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300"
                />
              </div>

              {/* phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">
                  رقم الجوال <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={phone}
                  onChange={e => setPhone(normalizePhone(e.target.value))}
                  placeholder="5XXXXXXXX"
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300 ${
                    phone && !phoneValid ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#024677]"
                  }`}
                />
                {phone && !phoneValid && (
                  <p className="text-xs text-red-500 text-right">{PHONE_ERROR_AR}</p>
                )}
              </div>

              {/* password */}
              <PasswordField
                label="كلمة المرور الجديدة"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              {/* confirm */}
              <PasswordField
                label="تأكيد كلمة المرور"
                placeholder="أعد إدخال كلمة المرور"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500 text-right -mt-3">كلمة المرور غير متطابقة</p>
              )}

              {/* continue */}
              <button
                onClick={() => canSubmit && onContinue?.({
                  email,
                  phone: normalizePhone(phone),
                  country_code: "966",
                  password,
                  password_confirmation: confirm,
                })}
                disabled={!canSubmit}
                className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all mt-1"
                style={{
                  background: canSubmit ? "#024677" : "#E2E8F0",
                  color:      canSubmit ? "#ffffff"  : "#94A3B8",
                  cursor:     canSubmit ? "pointer"  : "not-allowed",
                }}
              >
                المتابعة
              </button>

              {/* login link */}
              <p className="text-center text-sm text-slate-500">
                عندك حساب بالفعل؟{" "}
                <button onClick={onLoginRedirect} className="font-bold" style={{ color: "#5AEACF" }}>
                  سجل الدخول
                </button>
              </p>

            </div>

            {/* step dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full"
                  style={{
                    width: 6, height: 6,
                    background: i === 1 ? "#5AEACF" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT (visually): title at top level + steps below ── */}
          <div className="w-full lg:w-[42%] lg:shrink-0 flex flex-col gap-10 py-1 lg:mt-16">

            {/* title block — aligned with top of white card */}
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                إدارة متكاملة لبرامجك التدريبية
              </h2>
              <p className="text-sm mt-3 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                منظومة متطورة تمكّنك من التوسع وإدارة عملياتك التدريبية بكفاءة عالية
              </p>
            </div>

            {/* progress steps with arrows */}
            <ProgressSteps activeStep={1} />

          </div>

        </div>

      </div>
    </div>
  );
}
