import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeCompanyPassword } from "../services/api";
import { clearAuth } from "../services/auth";

// ── palette ───────────────────────────────────────────────────────────────────
const C_PRIMARY = "#00517F";
const C_TEAL    = "#35D6C5";
const C_GREEN   = "#2EAF62";
const C_RED     = "#EF6B6B";

// ── tiny icon helper ──────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, color = "currentColor", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const IcoSettings = ({ color = C_TEAL }) => <Ico color={color} size={17} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;
const IcoKey     = ({ color = C_TEAL }) => <Ico color={color} size={16} d={<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}/>;
const IcoEyeOff  = ({ color = "#94A3B8" }) => <Ico color={color} size={16} d={<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}/>;
const IcoEye     = ({ color = "#94A3B8" }) => <Ico color={color} size={16} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>;
const IcoCheck   = ({ color = "#fff", size = 9 }) => <Ico color={color} size={size} sw={3.4} d={<polyline points="20 6 9 17 4 12"/>}/>;

// ── validation helpers ────────────────────────────────────────────────────────
const hasMin8      = (p) => p.length >= 8;
const hasUpperLower= (p) => /[A-Z]/.test(p) && /[a-z]/.test(p);
const hasNumber    = (p) => /\d/.test(p);
const hasSpecial   = (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p);
const isValidPw    = (p) => hasMin8(p) && hasUpperLower(p) && hasNumber(p) && hasSpecial(p);

// ── password field with show/hide toggle ──────────────────────────────────────
function PasswordField({ value, onChange, borderColor, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-10 rounded-lg border bg-white pr-3.5 pl-10
          text-xs text-slate-700 placeholder:text-slate-400
          outline-none transition focus:outline-none disabled:opacity-60"
        style={{ borderColor }}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center
          text-slate-400 hover:text-slate-600 transition"
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
        {show ? <IcoEye /> : <IcoEyeOff />}
      </button>
    </div>
  );
}

// ── password requirement row ──────────────────────────────────────────────────
function Requirement({ ok, label }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: ok ? C_GREEN : C_RED }} />
      <span className="text-[10px] font-medium"
        style={{ color: ok ? "#94A3B8" : C_RED }}>
        {label}
      </span>
    </li>
  );
}

// ── default export ────────────────────────────────────────────────────────────
export default function CompanySecuritySettingsPage() {
  const navigate = useNavigate();
  const [current,  setCurrent]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState("");
  const [error,    setError]    = useState("");

  // ── derived validation ──────────────────────────────────────────────────────
  const newTouched   = newPass.length > 0;
  const confirmMismatch = confirm.length > 0 && confirm !== newPass;
  const newPassValid    = isValidPw(newPass);
  const canSubmit =
    current.length > 0 &&
    newPassValid &&
    confirm === newPass;

  // ── border colours ──────────────────────────────────────────────────────────
  const borderCurrent = current.length > 0 ? `${C_GREEN}55` : "#E2E8F0";
  const borderNew     = newTouched
    ? newPassValid ? `${C_GREEN}55` : `${C_RED}66`
    : "#E2E8F0";
  const borderConfirm = confirmMismatch ? `${C_RED}66` : confirm.length > 0 ? `${C_GREEN}55` : "#E2E8F0";

  // ── submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await changeCompanyPassword({
        current_password:          current,
        new_password:              newPass,
        new_password_confirmation: confirm,
      });
      setSuccess(res?.message || "تم تغيير كلمة المرور بنجاح.");
      setCurrent("");
      setNewPass("");
      setConfirm("");
      // force re-login with the new password
      setTimeout(() => {
        clearAuth();
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "حدث خطأ أثناء تغيير كلمة المرور.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="rtl">
      <div className="w-full max-w-none mx-auto px-3 sm:px-5 py-3">

        {/* ── page header ── */}
        <div className="flex items-center gap-2 mb-3">
          <IcoSettings />
          <h1 className="text-lg font-bold text-slate-800">الإعدادات</h1>
        </div>

        {/* ═══════════════════ Card — تغيير كلمة المرور ═══════════════════ */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-[#E8ECF0] p-4 sm:p-5 mb-4">
            {/* card header */}
            <div className="flex items-center gap-2 mb-4">
              <IcoKey />
              <h2 className="text-sm font-bold text-slate-800">تغيير كلمة المرور</h2>
            </div>

            {/* success / error banners */}
            {success && (
              <p className="text-xs font-medium mb-3 text-center rounded-lg py-2 px-3"
                style={{ background: `${C_GREEN}18`, color: C_GREEN }}>
                {success}
              </p>
            )}
            {error && (
              <p className="text-xs font-medium mb-3 text-center rounded-lg py-2 px-3"
                style={{ background: `${C_RED}18`, color: C_RED }}>
                {error}
              </p>
            )}

            {/* ── field 1: كلمة المرور الحالية ── */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-xs font-semibold text-slate-600">كلمة المرور الحالية</label>
                {current.length > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: C_GREEN }}>
                    <IcoCheck size={8} />
                  </span>
                )}
              </div>
              <PasswordField
                value={current}
                onChange={setCurrent}
                borderColor={borderCurrent}
                placeholder="••••••••••••"
                disabled={loading}
              />
            </div>

            {/* ── field 2: كلمة المرور الجديدة ── */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">كلمة المرور الجديدة</label>
              <PasswordField
                value={newPass}
                onChange={setNewPass}
                borderColor={borderNew}
                placeholder="••••••••"
                disabled={loading}
              />
              {/* requirements — shown while typing, hidden once all pass */}
              {newTouched && !newPassValid && (
                <>
                  <p className="text-[10px] font-medium mt-1.5 text-right" style={{ color: C_RED }}>
                    كلمة المرور لا تستوفي الحد الأدنى من المتطلبات
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    <Requirement ok={hasMin8(newPass)}       label="8 أحرف على الأقل" />
                    <Requirement ok={hasUpperLower(newPass)} label="حرف كبير وحرف صغير" />
                    <Requirement ok={hasNumber(newPass)}     label="رقم واحد على الأقل" />
                    <Requirement ok={hasSpecial(newPass)}    label="رمز خاص (!@#$٪)" />
                  </ul>
                </>
              )}
            </div>

            {/* ── field 3: تأكيد كلمة المرور ── */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">تأكيد كلمة المرور</label>
              <PasswordField
                value={confirm}
                onChange={setConfirm}
                borderColor={borderConfirm}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                disabled={loading}
              />
              {confirmMismatch && (
                <p className="text-[10px] font-medium mt-1.5 text-right" style={{ color: C_RED }}>
                  كلمتا المرور غير متطابقتين
                </p>
              )}
            </div>

            {/* ── submit button ── */}
            <div className="mb-4">
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full h-[32px] rounded-lg text-white text-[13px] font-semibold
                  hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: C_PRIMARY }}>
                {loading ? "جارٍ الحفظ…" : "تغيير كلمة المرور"}
              </button>
            </div>

            {/* forgot link */}
            <p className="text-[11px] font-medium text-center cursor-pointer hover:underline select-none"
              style={{ color: C_TEAL }}>
              هل نسيت كلمة المرور؟
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}
