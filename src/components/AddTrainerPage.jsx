import { useState, useEffect } from "react";
import { useToast } from "./ToastProvider";
import { fetchCoachPermissions, createCoach } from "../services/api";

// ── role fallback (if the permissions API is unreachable) ─────────────────────
const ROLE_FALLBACK = [
  { id: 3, key: "coach_view_only", name: "مدرب - عرض فقط",          description: "يعرض البرامج ويدير الجلسات ويشاهد الحضور بدون إضافة أو تعديل." },
  { id: 4, key: "coach_add_edit",  name: "مدرب - إضافة وتعديل",     description: "يعرض البرامج ويضيف ويعدّلها، ويدير الجلسات ويعرض سجلات الحضور." },
];

// ── shared input class ────────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right";

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IcoContact() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.22 2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IcoRole() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function IcoChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IcoSave() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ── reusable components ───────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div className="text-right mb-8">
      <nav className="flex items-center gap-1.5 text-xs mb-2">
        <span className="text-slate-400 font-medium">صفحة المستخدم</span>
        <span className="text-slate-300">/</span>
        <span style={{ color: "#024677" }} className="font-semibold">إضافة مدرب جديد</span>
      </nav>
      <h1 className="text-xl font-bold flex items-center gap-1.5 justify-start">
        <span style={{ color: "#024677" }}>إضافة مدرب جديد</span>
      </h1>
      <p className="text-xs text-slate-400 mt-0.5">
        أدخل بيانات المدرب الجديد في النظام
      </p>
    </div>
  );
}

function FormSection({ icon, title, children, columns = 2 }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
        style={{ background: "#F8FAFC" }}>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#EBF7FF" }}>
          {icon}
        </span>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </header>
      <div className={`px-5 py-5 grid grid-cols-1 gap-4 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {children}
      </div>
    </section>
  );
}

function FormField({ label, required, hint, fullWidth, children }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 mr-1">*</span>}
        {hint && <span className="text-slate-400 font-normal mr-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput(props) {
  return <input {...props} className={INPUT_CLS + (props.ltr ? " text-left" : "")} />;
}

function SelectField({ value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <select
        className={INPUT_CLS + " appearance-none pl-8 cursor-pointer"}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <IcoChevron />
      </span>
    </div>
  );
}

function ActionButtons({ onSave, onCancel, saving }) {
  return (
    <div className="flex items-center gap-3 pb-8 pt-2" dir="ltr">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 text-sm font-bold text-white px-6 py-2.5 rounded-xl transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "#024677" }}
      >
        {saving ? <IcoSpinner /> : <IcoSave />}
        حفظ وإضافة المستخدم
      </button>
      <button
        onClick={onCancel}
        className="text-sm font-semibold text-slate-600 px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
      >
        إلغاء
      </button>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function AddTrainerPage({ onBack }) {
  const showToast = useToast();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", roleId: "", bio: "", yearsOfExperience: "",
  });
  const [roles,  setRoles]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  // load assignable coach roles from provider/coach-permissions
  useEffect(() => {
    fetchCoachPermissions()
      .then(res => {
        const assignable = res?.data?.assignable_roles ?? [];
        setRoles(assignable.length > 0 ? assignable : (res?.data?.roles ?? []).filter(r => r.assignable_to_coach));
      })
      .catch(() => setRoles(ROLE_FALLBACK));
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const selectedRole = roles.find(r => String(r.id) === String(form.roleId));

  const handleSave = async () => {
    if (!form.name || !form.email) {
      setError("الاسم والبريد الإلكتروني مطلوبان");
      return;
    }
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.append("name",  form.name);
    fd.append("email", form.email);
    fd.append("bio",   form.bio);
    fd.append("years_of_experience", form.yearsOfExperience);
    if (form.phone)  fd.append("phone",   form.phone);
    if (form.roleId) fd.append("role_id", form.roleId);

    try {
      await createCoach(fd);
      showToast("تم إضافة المدرب بنجاح", "success");
      setTimeout(() => onBack?.(), 1200);
    } catch (err) {
      const msg = err.message || "حدث خطأ أثناء الإضافة";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-white px-1.5 sm:px-2 py-3" dir="rtl">
      <div className="w-full max-w-[1024px] mx-auto space-y-5">

        <PageHeader />

        {/* ── card 1: personal ── */}
        <FormSection icon={<IcoUser />} title="البيانات الشخصية" columns={1}>
          <FormField label="الاسم بالكامل" required fullWidth>
            <TextInput
              placeholder="مثال: أحمد سعد الزهراني"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
          </FormField>
        </FormSection>

        {/* ── card 2: contact ── */}
        <FormSection icon={<IcoContact />} title="بيانات التواصل">
          <FormField label="البريد الإلكتروني" required hint="سيُستخدم لتسجيل الدخول">
            <TextInput
              ltr
              placeholder="user@treedom.sa"
              type="email"
              dir="ltr"
              value={form.email}
              onChange={e => set("email", e.target.value)}
            />
          </FormField>
          <FormField label="رقم الجوال" hint="اختياري">
            <TextInput
              ltr
              placeholder="05xxxxxxxx"
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
            />
          </FormField>
        </FormSection>

        {/* ── card 3: roles & permissions ── */}
        <FormSection icon={<IcoRole />} title="الأدوار والصلاحيات" columns={1}>
          <FormField label="الدور في النظام" hint="اختياري" fullWidth>
            <SelectField
              value={form.roleId}
              onChange={v => set("roleId", v)}
              placeholder="اختر الدور..."
              options={roles.length > 0 ? roles : ROLE_FALLBACK}
            />
            {selectedRole?.description && (
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {selectedRole.description}
              </p>
            )}
          </FormField>
        </FormSection>

        {/* ── card 4: additional info ── */}
        <FormSection icon={<IcoUser />} title="معلومات إضافية">
          <FormField label="سنوات الخبرة" hint="اختياري">
            <TextInput
              ltr
              placeholder="8"
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={form.yearsOfExperience}
              onChange={e => set("yearsOfExperience", e.target.value.replace(/\D/g, ""))}
            />
          </FormField>
          <FormField label="النبذة الشخصية" hint="اختياري">
            <textarea
              className={INPUT_CLS + " resize-none"}
              placeholder="أدخل نبذة تعريفية عن المدرب..."
              rows={3}
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
            />
          </FormField>
        </FormSection>

        {/* error */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-right">
            {error}
          </p>
        )}

        {/* actions */}
        <ActionButtons
          onSave={handleSave}
          onCancel={onBack}
          saving={saving}
        />
      </div>
    </main>
  );
}