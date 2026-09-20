import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginProvider, loginCoach, loginTrainer, loginCompany, loginTrainee, loginEmployee } from "../../services/api";
import { setToken, setUser } from "../../services/auth";
import { PhoneMockup } from "../RegisterPage";

// ─────────────────────────────────────────────────────────────────────────────
// Auto-detect login: try each endpoint in order, return first success.
// API returns `type` field directly ("coach" | "provider" | "trainer" etc.)
// so no manual role assignment is needed.
// ─────────────────────────────────────────────────────────────────────────────
const ATTEMPTS = [loginProvider, loginCoach, loginTrainer, loginTrainee, loginCompany, loginEmployee];

async function autoLogin(payload) {
  let lastErr = null;
  for (const fn of ATTEMPTS) {
    try {
      const res  = await fn(payload);
      // Unwrap nested data object if present (e.g. { status:true, data:{ token:... } })
      const data = res.data ?? res;
      // Only accept a response that has a token AND isn't explicitly marked failed
      if (data.token && res.status !== false) {
        if (fn === loginProvider && !data.type) data.type = "provider";
        if (fn === loginTrainer) {
          if (data.provider_type === "individual_trainer" || !data.type || data.type === "trainer") {
            data.type = "inde_coach";
          }
        }
        if (fn === loginCompany  && !data.type) data.type = "company";
        if (fn === loginTrainee  && (!data.type || data.type === "user")) data.type = "trainee";
        if (fn === loginEmployee && (!data.type || data.type === "staff")) data.type = "employee";
        return data;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("بيانات الدخول غير صحيحة");
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const IcoEye = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const valid = email.trim() && password.trim() && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await autoLogin({ email, password });
      setToken(data.token);
      setUser(data); // `type` field from API → getUserRole() reads it directly
      onLogin?.(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message ?? "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{ background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)" }}
    >
      {/* dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}/>
      {/* logo watermark */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "url('/logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "280%",
        opacity: 0.08,
      }}/>

      <div className="relative w-full max-w-6xl flex flex-col items-center gap-4">
        <div className="w-full flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6">

          {/* LEFT — decorative */}
          <div className="w-full lg:w-[42%] flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                مرحباً بك في{" "}
                <span style={{ color: "#5AEACF" }}>Treedom</span>
              </h2>
            </div>
            <p className="text-base font-medium leading-relaxed text-right"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              سجّل دخولك للوصول إلى لوحة التحكم وإدارة برامجك التدريبية
            </p>
            <div className="flex-1 flex items-center justify-center">
              <PhoneMockup />
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="w-full lg:flex-1 flex flex-col gap-3 order-1 lg:order-2 lg:mt-20">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-5 p-5 sm:p-8 lg:p-10">

              {/* logo */}
              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom"
                  style={{ width: "auto", height: 48, objectFit: "contain" }} />
              </div>

              {/* heading */}
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>
                  تسجيل الدخول
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  أدخل بياناتك للوصول إلى حسابك
                </p>
              </div>

              {/* form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 text-right">
                    البريد الإلكتروني <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300"
                  />
                </div>

                {/* password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 text-right">
                    كلمة المرور <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      <IcoEye open={showPass} />
                    </button>
                  </div>
                  <div className="flex justify-start mt-0.5">
                    <button type="button"
                      className="text-xs font-semibold transition hover:opacity-70"
                      style={{ color: "#024677" }}>
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                </div>

                {/* error */}
                {error && (
                  <p className="text-xs text-red-500 text-right bg-red-50 rounded-xl px-4 py-2">
                    {error}
                  </p>
                )}

                {/* loading hint */}
                {loading && (
                  <p className="text-xs text-slate-400 text-center">جارٍ التحقق من بياناتك…</p>
                )}

                {/* submit */}
                <button
                  type="submit"
                  disabled={!valid}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all mt-1 flex items-center justify-center gap-2"
                  style={{
                    background: valid ? "#024677" : "#E2E8F0",
                    color:      valid ? "#ffffff"  : "#94A3B8",
                    cursor:     valid ? "pointer"  : "not-allowed",
                  }}>
                  {loading && (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                  )}
                  دخول
                </button>
              </form>

              {/* register link */}
              <p className="text-center text-sm text-slate-500">
                ليس لديك حساب؟{" "}
                <button onClick={() => navigate("/register")}
                  className="font-bold transition hover:opacity-70"
                  style={{ color: "#024677" }}>
                  إنشاء حساب جديد
                </button>
              </p>
            </div>

            {/* step dots */}
            <div className="flex items-center justify-start gap-2 pt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: 6, height: 6, background: i === 0 ? "#5AEACF" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
