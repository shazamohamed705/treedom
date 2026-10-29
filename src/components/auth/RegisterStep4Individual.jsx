import { useState, useRef } from "react";
import { normalizePhone, isPhoneValid, PHONE_ERROR_AR } from "../../services/registerDraft";
import { registerTrainer } from "../../services/api";

// -----------------------------------------------------------------------------
// Upload icon
// -----------------------------------------------------------------------------
const IcoUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

// -----------------------------------------------------------------------------
// Progress steps — steps 1 & 2 done, step 3 active
// -----------------------------------------------------------------------------
const STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",               sub: "البريد الإلكتروني وكلمة المرور", done: true },
  { n: 2, pct: "80%",  title: "البيانات الشخصية والاهتمامات", sub: "الاسم ومجالات الاهتمام",        done: true },
  { n: 3, pct: "100%", title: "إثبات الهوية",                sub: "توثيق الشخصية لإصدار الشهادات", active: true },
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
                <p className="text-sm font-bold"
                  style={{ color: s.active || s.done ? "#ffffff" : "rgba(255,255,255,0.35)" }}>
                  {s.title}
                </p>
                <p className="text-xs mt-0.5"
                  style={{ color: s.active ? "rgba(255,255,255,0.55)" : s.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>
                  {s.sub}
                </p>
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
// File upload field
// -----------------------------------------------------------------------------
function FileUploadField({ label, optional, fileRef, file, onFile }) {
  return (
    <div className="flex flex-col gap-2 min-w-0 w-full">
      <label className="text-sm font-medium text-slate-700 text-right">
        {label} {optional && <span className="text-slate-400 font-normal">(اختياري)</span>}
      </label>
      <div onClick={() => fileRef.current?.click()}
        className="flex items-center gap-3 sm:gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-w-0 overflow-hidden"
        style={{ borderColor: "#CBD5E1", background: "#F8FAFC" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#2BBFB3"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD5E1"}>
        <div className="text-right flex-1 min-w-0 overflow-hidden">
          <p
            className="text-sm font-semibold break-all"
            style={{ color: "#024677", overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" }}
            title={file?.name || undefined}
            dir={file ? "ltr" : "rtl"}
          >
            {file ? file.name : "انقر للاختيار أو اسحب الملف هنا"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">PDF, JPG — حجم أقصى 5 MB</p>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#E0FAF8", border: "2.32px solid #2BBFB3", color: "#2BBFB3" }}>
          <IcoUpload />
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden"
        onChange={e => onFile(e.target.files?.[0] || null)} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main page
// Receives all collected data from Step 2 (credentials) + Step 3 (profile)
// Makes the final POST /trainer/auth/register call
// -----------------------------------------------------------------------------
export default function RegisterStep4Individual({ collectedData = {}, onSubmit, onBack, onLoginRedirect }) {
  const [idFile,   setIdFile]   = useState(null);
  const [cvFile,   setCvFile]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const idRef = useRef();
  const cvRef = useRef();

  const canSubmit = idFile && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const phone = normalizePhone(collectedData.phone);
      if (!isPhoneValid(phone)) {
        throw new Error(PHONE_ERROR_AR);
      }
      const form = new FormData();

      // ── Step 2 credentials ──────────────────────────────────────────────
      if (collectedData.email)                 form.append("email",                 collectedData.email);
      form.append("phone", phone);
      form.append("country_code", collectedData.country_code ?? "966");
      if (collectedData.password)              form.append("password",              collectedData.password);
      if (collectedData.password_confirmation) form.append("password_confirmation", collectedData.password_confirmation);

      // ── Step 3 profile data ─────────────────────────────────────────────
      if (collectedData.name)                  form.append("name",                  collectedData.name);
      if (collectedData.city)                  form.append("city",                  collectedData.city);
      if (collectedData.bio)                   form.append("bio",                   collectedData.bio);
      if (collectedData.specialization_id)     form.append("specialization_id",     collectedData.specialization_id);
      if (collectedData.years_of_experience !== undefined && collectedData.years_of_experience !== "") {
        form.append("years_of_experience", collectedData.years_of_experience);
      }
      if (collectedData.image)                 form.append("image",                 collectedData.image);

      // ── Step 4 documents ────────────────────────────────────────────────
      form.append("id_card_document", idFile);
      if (cvFile) form.append("cv", cvFile);

      await registerTrainer(form);
      onSubmit?.("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6" dir="rtl"
      style={{ background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
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

              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom" style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>
                  إثبات الهوية
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  ارفع مستنداتك لتأكيد هويتك وإصدار شهادات المدربين
                </p>
              </div>

              {/* national ID — required */}
              <FileUploadField
                label="صورة الهوية الوطنية / الإقامة"
                fileRef={idRef}
                file={idFile}
                onFile={setIdFile}
              />

              {/* CV — optional */}
              <FileUploadField
                label="السيرة الذاتية أو شهادات التدريب"
                optional
                fileRef={cvRef}
                file={cvFile}
                onFile={setCvFile}
              />

              {error && (
                <p className="text-xs text-red-500 text-right bg-red-50 rounded-xl px-4 py-2">{error}</p>
              )}

              {/* buttons */}
              <div className="flex gap-3 mt-1">
                <button onClick={handleSubmit} disabled={!canSubmit}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: canSubmit ? "#024677" : "#E2E8F0",
                    color:      canSubmit ? "#ffffff"  : "#94A3B8",
                    cursor:     canSubmit ? "pointer"  : "not-allowed",
                  }}>
                  {loading && (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                  )}
                  إرسال طلب التسجيل
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
                  style={{ width: 6, height: 6, background: i === 2 ? "#5AEACF" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          </div>

          {/* ── right side ── */}
          <div className="w-full lg:w-[42%] lg:shrink-0 flex flex-col gap-10 py-1 lg:mt-16">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                خطوة أخيرة
              </h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                أكد هويتك لإتمام تسجيلك على Treedom
              </p>
            </div>
            <ProgressSteps />
          </div>

        </div>
      </div>
    </div>
  );
}
