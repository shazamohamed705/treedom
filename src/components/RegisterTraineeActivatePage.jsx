import { useState, useEffect } from "react";
import { activateTrainee, resendTraineeCode } from "../services/api";
import OtpInput from "./OtpInput";

// ── progress steps ────────────────────────────────────────────────────────────
function IcoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

const STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",    sub: "البريد وكلمة المرور",      done: true  },
  { n: 2, pct: "80%",  title: "البيانات الشخصية", sub: "الاسم والهوية والاهتمامات", done: true  },
  { n: 3, pct: "100%", title: "تأكيد الحساب",     sub: "رمز التحقق على بريدك",      active: true },
];

function ProgressSteps() {
  return (
    <div className="flex flex-col" dir="rtl">
      {STEPS.map((s, idx) => {
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={s.n}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2"
                style={{
                  borderColor: s.active || s.done ? "#5AEACF" : "rgba(255,255,255,0.2)",
                  background:  s.done ? "#5AEACF" : "transparent",
                  color:       s.done ? "#024677" : s.active ? "#5AEACF" : "rgba(255,255,255,0.3)",
                }}>
                {s.done ? <IcoCheck /> : s.n}
              </div>
              <div className="text-right flex-1">
                <p className="text-sm font-bold"
                  style={{ color: s.active || s.done ? "#fff" : "rgba(255,255,255,0.35)" }}>{s.title}</p>
                <p className="text-xs mt-0.5"
                  style={{ color: s.active ? "rgba(255,255,255,0.55)" : s.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>{s.sub}</p>
              </div>
              <span className="text-base font-bold w-12 text-left shrink-0"
                style={{ color: s.active || s.done ? "#5AEACF" : "rgba(255,255,255,0.3)" }}>{s.pct}</span>
            </div>
            {!isLast && (
              <div className="flex items-center py-3">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <svg width="14" height="32" viewBox="0 0 14 32" fill="none">
                    <line x1="7" y1="0" x2="7" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M3 20l4 8 4-8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function RegisterTraineeActivatePage({ email, onSuccess, onBack, onLoginRedirect }) {
  const [code,        setCode]        = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [done,        setDone]        = useState(false);
  const [resendLoad,  setResendLoad]  = useState(false);
  const [resendMsg,   setResendMsg]   = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  // countdown timer after resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const cleanCode = code.replace(/\s/g, "");
  const canSubmit = cleanCode.length === 6 && !loading;

  const handleActivate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await activateTrainee({ email, code: cleanCode });
      setDone(true);
    } catch (err) {
      setError(err.message || "رمز التحقق غير صحيح");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoad || resendTimer > 0) return;
    setResendLoad(true);
    setResendMsg(null);
    setError(null);
    try {
      await resendTraineeCode(email);
      setResendMsg("تم إرسال رمز جديد إلى بريدك الإلكتروني");
      setResendTimer(60);
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoad(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{ background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)" }}>

      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}/>
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
          <div className="w-full lg:flex-1 flex flex-col gap-3">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-6 p-5 sm:p-8 lg:p-10">

              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom" style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              {!done ? (
                <>
                  <div className="text-right">
                    <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>تأكيد الحساب</h1>
                    <p className="text-xs text-slate-400 mt-1">
                      أدخل رمز التحقق المرسل إلى{" "}
                      <span className="font-semibold text-slate-600">{email}</span>
                    </p>
                  </div>

                  {/* envelope icon */}
                  <div className="flex justify-center py-2">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: "#EEF3F8" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                        stroke="#024677" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                  </div>

                  <OtpInput value={code} onChange={setCode} />

                  {/* resend */}
                  <div className="text-center">
                    {resendMsg && (
                      <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2 mb-2">{resendMsg}</p>
                    )}
                    <button
                      onClick={handleResend}
                      disabled={resendLoad || resendTimer > 0}
                      className="text-sm font-semibold transition-all"
                      style={{
                        color: resendLoad || resendTimer > 0 ? "#94A3B8" : "#024677",
                        cursor: resendLoad || resendTimer > 0 ? "not-allowed" : "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                      }}
                    >
                      {resendLoad
                        ? "جاري الإرسال..."
                        : resendTimer > 0
                        ? `إعادة الإرسال خلال ${resendTimer}ث`
                        : "لم تستلم الرمز؟ إعادة الإرسال"}
                    </button>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl px-4 py-2">{error}</p>
                  )}

                  <button onClick={handleActivate} disabled={!canSubmit}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{ background: canSubmit ? "#024677" : "#E2E8F0", color: canSubmit ? "#fff" : "#94A3B8", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                    {loading && (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2a10 10 0 0 1 10 10"/>
                      </svg>
                    )}
                    تفعيل الحساب
                  </button>

                  <button onClick={onBack}
                    className="w-full py-3 rounded-2xl text-sm font-semibold border-2 transition-all"
                    style={{ borderColor: "#CBD5E1", color: "#024677", background: "white" }}>
                    رجوع
                  </button>

                  {/* login link */}
                  <p className="text-center text-sm text-slate-500">
                    هل لديك حساب بالفعل؟{" "}
                    <button onClick={onLoginRedirect} className="font-bold" style={{ color: "#024677" }}>
                      تسجل الدخول
                    </button>
                  </p>
                </>
              ) : (
                /* success */
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "#E0FAF8" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-extrabold" style={{ color: "#024677" }}>تم تفعيل حسابك بنجاح!</h2>
                  <p className="text-sm text-slate-500">يمكنك الآن تسجيل الدخول والبدء في رحلتك التدريبية</p>
                  <button onClick={onSuccess}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "#024677" }}>
                    تسجيل الدخول
                  </button>
                </div>
              )}

            </div>

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
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">خطوة أخيرة</h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                تحقق من بريدك لإتمام التسجيل والبدء فوراً
              </p>
            </div>
            <ProgressSteps />
          </div>

        </div>
      </div>
    </div>
  );
}
