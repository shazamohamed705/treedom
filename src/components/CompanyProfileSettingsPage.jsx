import { getUser } from "../services/auth";

// ── palette ───────────────────────────────────────────────────────────────────
const C_PRIMARY = "#00527F";
const C_TEAL    = "#43D8C7";
const C_BORDER  = "#E3EBEF";
const C_SECOND  = "#9AA3AA";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 15, color = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IcoSettings = ({ size = 16 }) => (
  <Ico size={size} color={C_TEAL} sw={2} d={
    <><circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>
  }/>
);

// ── read-only field ───────────────────────────────────────────────────────────
function Field({ label, value, dir = "rtl" }) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] font-bold mb-1.5"
        style={{ color: C_PRIMARY, textAlign: "right" }}>
        {label}
      </label>
      <input
        value={value ?? "—"}
        readOnly
        dir={dir}
        className="w-full h-[38px] rounded-[6px] bg-[#F8FAFC] px-3 text-[13px] focus:outline-none"
        style={{ border: `1px solid ${C_BORDER}`, color: C_SECOND, textAlign: "right" }}
      />
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function CompanyProfileSettingsPage() {
  // بيانات الشركة محفوظة في localStorage من وقت تسجيل الدخول
  const d = getUser() ?? {};

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="rtl">
      <div className="w-full h-[2px]" style={{ background: C_PRIMARY }} />

      <div className="w-full max-w-[860px] mx-auto px-6 py-7">

        {/* header */}
        <div className="flex items-center gap-2 mb-8">
          <IcoSettings />
          <h1 className="text-[17px] font-bold" style={{ color: C_PRIMARY }}>الإعدادات — معلومات الشركة</h1>
        </div>

        {/* avatar + name */}
        <div className="flex items-center gap-4 mb-7">
          {d.image
            ? <img src={d.image} alt="logo"
                className="w-16 h-16 rounded-full object-cover border shrink-0"
                style={{ borderColor: C_BORDER }} />
            : <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ background: C_PRIMARY }}>
                {(d.name ?? "ش")[0]}
              </div>
          }
          <div>
            <p className="text-base font-bold" style={{ color: C_PRIMARY }}>{d.name ?? "—"}</p>
            <p className="text-sm mt-0.5" style={{ color: C_SECOND }}>{d.email ?? "—"}</p>
          </div>
        </div>

        {/* info card */}
        <div className="bg-white rounded-[8px] border p-8" style={{ borderColor: C_BORDER }}>
          <Field label="اسم الشركة"        value={d.name} />
          <Field label="البريد الإلكتروني" value={d.email} dir="ltr" />
          <Field label="رقم الجوال"        value={d.phone} />
          <Field label="السجل التجاري"     value={d.commercial_number} />
          <Field
            label="الحالة"
            value={d.is_active !== undefined ? (d.is_active ? "نشط" : "غير نشط") : undefined}
          />
        </div>

      </div>
    </div>
  );
}
