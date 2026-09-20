import { useLocation } from "react-router-dom";

// -----------------------------------------------------------------------------
// Progress steps — all done
// -----------------------------------------------------------------------------
const STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",         sub: "بريد الهيئة ومسؤول التواصل" },
  { n: 2, pct: "80%",  title: "بيانات الهيئة",          sub: "اسم الهيئة و تخصصها" },
  { n: 3, pct: "100%", title: "التراخيص والوثائق",      sub: "ترخيص ووثائق رسمية" },
];

function ProgressSteps() {
  return (
    <div className="flex flex-col" dir="rtl">
      {STEPS.map((s, idx) => {
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={s.n}>
            <div className="flex items-center gap-4">
              {/* circle — all done */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2"
                style={{ borderColor: "#5AEACF", background: "#5AEACF" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#024677" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              {/* text */}
              <div className="text-right flex-1">
                <p className="text-sm font-bold text-white">{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.sub}</p>
              </div>

              {/* percentage */}
              <span className="text-base font-bold w-12 text-left shrink-0"
                style={{ color: "#5AEACF" }}>
                {s.pct}
              </span>
            </div>

            {!isLast && (
              <div className="flex items-center py-3">
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
// Checklist item
// -----------------------------------------------------------------------------
function CheckItem({ label, done, pending }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0" dir="rtl">
      {/* icon — right side, next to text */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: pending ? "transparent" : "#024677",
          border: pending ? "2px solid #94A3B8" : "none",
        }}>
        {done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        {pending && (
          /* spinning loader */
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="#5AEACF" strokeWidth="2.5" strokeLinecap="round"
            style={{ animation: "spin 1s linear infinite" }}>
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        )}
      </div>

      {/* label */}
      <span className="text-sm flex-1 text-right"
        style={{ color: pending ? "#5AEACF" : "#1E293B" }}>
        {label}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Success illustration
// -----------------------------------------------------------------------------
function SuccessIllustration() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 120 }}>
      {/* background blobs */}
      <div className="absolute w-28 h-28 rounded-[40px] rotate-12"
        style={{ background: "linear-gradient(135deg, #E0FAF8 0%, #b8f0eb 100%)", opacity: 0.6 }} />
      <div className="absolute w-28 h-28 rounded-[40px] -rotate-6"
        style={{ background: "linear-gradient(135deg, #d0f5f2 0%, #a0e8e2 100%)", opacity: 0.4 }} />

      {/* main icon box */}
      <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, #E0FAF8 0%, #c5f0ec 100%)",
          border: "2.5px solid #2BBFB3",
        }}>
        <img src="/handshake-svgrepo-com 1.png" alt="handshake" style={{ width: 52, height: 52, objectFit: "contain" }} />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------
export default function RegisterSuccessPage({ onGoToLogin, message: messageProp }) {
  const location = useLocation();
  const raw = (messageProp || location.state?.message || "").trim();
  // لو الـ API رجّع رسالة تفعيل OTP — متظهرهاش في مسار الهيئة
  const apiMessage = /رمز التفعيل|كود التفعيل|activation|otp/i.test(raw) ? "" : raw;
  const title = apiMessage
    || "تم إنشاء الحساب بنجاح وسيتم إرسال الطلب للمراجعة";
  const subtitle =
    "طلبك قيد المراجعة والتحقق من قبل إدارة المنظومة. يستغرق التحقق عادةً من 24 إلى 48 ساعة.";

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

          {/* ── LEFT (visually): white card ── */}
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-3">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col items-center gap-6 p-5 sm:p-8 lg:p-10">

              {/* logo */}
              <div className="w-full flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom"
                  style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              {/* illustration */}
              <SuccessIllustration />

              {/* heading */}
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>
                  {title}
                </h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
                  {subtitle}
                </p>
              </div>

              {/* checklist */}
              <div className="w-full rounded-2xl border border-slate-100 px-4 py-1" style={{ background: "#FAFBFC" }}>
                <CheckItem label="تفعيل الحساب"                 done />
                <CheckItem label="إكمال بيانات الهيئة"         done />
                <CheckItem label="رفع التراخيص والوثائق"       done />
                <CheckItem label="مراجعة واعتماد الحساب"       pending />
              </div>

              {/* button */}
              <button
                onClick={onGoToLogin}
                className="w-full py-3.5 rounded-2xl text-sm font-bold border-2 transition-all"
                style={{ borderColor: "#CBD5E1", color: "#024677", background: "white" }}
              >
                العودة لصفحة الدخول
              </button>

            </div>

            {/* step dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full"
                  style={{ width: 6, height: 6, background: "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </div>

          {/* ── RIGHT (visually): title + steps ── */}
          <div className="w-full lg:w-[42%] lg:shrink-0 flex flex-col gap-10 py-1 lg:mt-16">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                تم الإرسال بنجاح
              </h2>
              <p className="text-sm mt-3 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                بياناتك في طريقها إلى فريق الهيئة للمراجعة
              </p>
            </div>
            <ProgressSteps />
          </div>

        </div>

      </div>
    </div>
  );
}
