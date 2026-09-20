import { useState, useRef, useEffect } from "react";
import { fetchMyProfile, updateMyProfile } from "../../services/api";
import { getUser } from "../../services/auth";

// ── helpers ───────────────────────────────────────────────────────────────────
function isEmployee() {
  const u = getUser();
  const t = u?.type ?? u?.role ?? null;
  return t === "staff" || t === "employee";
}

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoUser   = () => <Ico size={18} stroke="#31AFEA" d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const IcoEdit   = () => <Ico size={13} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>;
const IcoCamera = () => <Ico size={14} d={<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>}/>;
const IcoEye    = () => <Ico d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>;
const IcoEyeOff = () => <Ico d={<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}/>;

// ── reusable field ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", disabled = false, badge }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div className="flex flex-col gap-1.5" dir="rtl">
      <label className="text-[14px] font-medium text-slate-600">{label}</label>
      <div className="relative">
        <input
          type={isPass && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3.5 rounded-xl border text-[14px] text-slate-700 outline-none transition text-right"
          style={{
            borderColor: disabled ? "#e8edf2" : "#d1dce8",
            background: disabled ? "#f9fbfc" : "#fff",
            color: disabled ? "#94a3b8" : "#334155",
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
            {show ? <IcoEyeOff/> : <IcoEye/>}
          </button>
        )}
        {badge && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ background:"#f1f5f9", color:"#64748b" }}>{badge}</span>
        )}
      </div>
    </div>
  );
}

// ── read-only info row ────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
      style={{ borderColor:"#e8edf2", background:"#f9fbfc" }} dir="rtl">
      <span className="text-[13px] font-medium text-slate-500">{label}</span>
      <span className="text-[13px] font-semibold text-slate-700 text-left truncate">{value || "—"}</span>
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key:"personal", label:"البيانات الشخصية"  },
];

// ── main ──────────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const isEmp = isEmployee();

  const [tab, setTab]           = useState("personal");
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);
  const fileRef = useRef();

  // form state — filled from API on mount
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [phone,      setPhone]      = useState("");
  const [image,      setImage]      = useState(null);
  const [birthDate,  setBirthDate]  = useState("");
  const [nationality,setNationality]= useState("");
  const [city,       setCity]       = useState("");
  const [fields,     setFields]     = useState([]);
  // employee-specific
  const [jobTitle,   setJobTitle]   = useState("");
  const [department, setDepartment] = useState("");
  const [company,    setCompany]    = useState("");
  const [nationalId, setNationalId] = useState("");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    let on = true;
    fetchMyProfile()
      .then(res => {
        if (!on) return;
        const d = res?.data ?? {};
        setName(d.name ?? "");
        setEmail(d.email ?? "");
        setPhone(d.phone ?? "");
        setImage(d.image ?? null);
        // employee-specific fields
        setJobTitle(d.job_title ?? "");
        setDepartment(d.department ?? "");
        setCompany(d.company?.name ?? "");
        setNationalId(d.national_id ?? "");
        // trainee-specific fields
        setBirthDate(d.birth_date ?? "");
        setNationality(typeof d.nationality === "object" ? (d.nationality?.name ?? "") : (d.nationality ?? ""));
        setCity(typeof d.city === "object" ? (d.city?.name ?? "") : (d.city ?? ""));
        setFields(Array.isArray(d.fields) ? d.fields : []);
      })
      .catch(() => {
        const u = getUser();
        if (u) {
          setName(u.name ?? "");
          setEmail(u.email ?? "");
          setPhone(u.phone ?? "");
          setImage(u.image ?? null);
          setJobTitle(u.job_title ?? "");
          setDepartment(u.department ?? "");
          setCompany(u.company?.name ?? "");
        }
      })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const doSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await updateMyProfile({
        name,
        email,
        phone,
        field_ids: fields.map(f => f.id).filter(Boolean),
      });
      if (res?.status === false) throw new Error(res.message ?? "تعذر الحفظ");
      const d = res?.data ?? {};
      setName(d.name ?? name);
      setEmail(d.email ?? email);
      setPhone(d.phone ?? phone);
      setImage(d.image ?? image);
      if (d.birth_date) setBirthDate(d.birth_date);
      if (typeof d.nationality === "object") setNationality(d.nationality?.name ?? "");
      if (typeof d.city === "object") setCity(d.city?.name ?? "");
      if (Array.isArray(d.fields)) setFields(d.fields);
      setMsg({ ok: true, text: res?.message ?? "تم تحديث الملف الشخصي بنجاح." });
      setEditing(false);
    } catch (err) {
      setMsg({ ok: false, text: err?.message ?? "تعذر حفظ التغييرات." });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setImage(URL.createObjectURL(file)); setMsg({ ok: false, text: "سيتم حفظ الصورة محلياً فقط حتى دعم رفعها من الخادم." }); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0" dir="rtl">
      <div className="w-full px-10 py-5">

        {/* ── header ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <IcoUser/>
            <h1 className="text-[20px] font-bold" style={{ color:"#024677" }}>الملف الشخصي</h1>
          </div>
          <button
            onClick={() => { setEditing(e => !e); setMsg(null); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-[12px] font-semibold transition hover:bg-slate-50"
            style={{ borderColor:"#d1dce8", color:"#334155" }}>
            <IcoEdit/>
            {editing ? "إلغاء التعديل" : "تعديل"}
          </button>
        </div>

        {/* ── tabs ── */}
        <div className="flex items-center justify-end gap-0 mb-5 border-b border-slate-200" dir="ltr">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-[12px] font-semibold transition-all relative"
              style={{ color: tab === t.key ? "#31AFEA" : "#64748b" }}>
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background:"#31AFEA" }}/>
              )}
            </button>
          ))}
        </div>

        {/* ── card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8"
          style={{ boxShadow:"0 4px 24px rgba(8,15,52,0.06)" }}>

          {/* ══ TAB: البيانات الشخصية ══ */}
          {tab === "personal" && (
            <div className="space-y-6">
              {loading && <p className="text-center text-[13px] text-slate-400 py-8">جارِ تحميل بياناتك...</p>}

              {!loading && (<>
                {/* avatar */}
                <div className="flex flex-col items-center gap-3 mb-3">
                  <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background:"#e8edf4" }}>
                    {image
                      ? <img src={image} alt="" className="w-full h-full object-cover"/>
                      : <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
                          stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                    }
                  </div>
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-[13px] font-medium transition hover:opacity-70"
                    style={{ color:"#31AFEA" }}>
                    <IcoCamera/>
                    تغيير الصورة الشخصية
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={handleAvatarChange}/>
                </div>

                {/* divider */}
                <div className="border-t border-slate-100"/>

                {/* message */}
                {msg && (
                  <p className="text-[12px] rounded-xl px-4 py-2 text-right"
                    style={{ background: msg.ok ? "#ecfdf5" : "#fef2f2",
                             color: msg.ok ? "#059669" : "#dc2626" }}>
                    {msg.text}
                  </p>
                )}

                {/* fields */}
                <Field label="الإسم"
                  value={name} onChange={setName} disabled={!editing}/>
                <Field label="البريد الإلكتروني"
                  value={email} onChange={setEmail} disabled={!editing}/>
                <Field label="رقم الجوال"
                  value={phone} onChange={setPhone} disabled={!editing}/>

                <div className="border-t border-slate-100"/>

                {isEmp ? (
                  <>
                    <InfoRow label="المسمى الوظيفي"  value={jobTitle}   />
                    <InfoRow label="القسم"            value={department} />
                    <InfoRow label="الشركة"           value={company}    />
                    {nationalId && <InfoRow label="رقم الهوية" value={nationalId} />}
                  </>
                ) : (
                  <>
                    <InfoRow label="تاريخ الميلاد" value={birthDate}/>
                    <InfoRow label="الجنسية"       value={nationality}/>
                    <InfoRow label="المدينة"        value={city}/>
                    <InfoRow label="مجالات الاهتمام"
                      value={fields.map(f => f.name).join("، ")}/>
                  </>
                )}

                {/* save button */}
                {editing && (
                  <button
                    onClick={doSave}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background:"#31AFEA" }}>
                    {saving && (
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2a10 10 0 0 1 10 10"/>
                      </svg>
                    )}
                    {saving ? "جارِ الحفظ..." : "حفظ التغييرات"}
                  </button>
                )}
              </>)}
            </div>
          )}

          </div>
      </div>
    </div>
  );
}