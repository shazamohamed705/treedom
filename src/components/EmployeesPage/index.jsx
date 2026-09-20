import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Pagination from "../Pagination";
import { fetchCompanyEmployees, fetchCompanyDepartments, createCompanyEmployee, createCompanyDepartment, updateCompanyEmployee, deleteCompanyEmployee, importCompanyEmployees } from "../../services/api";

// ─── brand colours ────────────────────────────────────────────────────────────
const BRAND = "#024677";
const TEAL  = "#14b8a6";

// ─── mock data ────────────────────────────────────────────────────────────────
const MOCK_EMPLOYEES = [
  { id: 1,  name: "أحمد محمد ماهر",         idNo: "1023456789", email: "ahmedmo@gmail.com",          dept: "الإدارة التنفيذية",  title: "أخصائي موارد بشرية", programs: 3,  completion: 80 },
  { id: 2,  name: "عبدالله أحمد سعد",        idNo: "1023456789", email: "abdoahmed@gmail.com",         dept: "الموارد البشرية",    title: "أخصائي موارد بشرية", programs: 5,  completion: 72 },
  { id: 3,  name: "أكرم عبدالعزيز جمال",     idNo: "1023456789", email: "akramabdelaziz@gmail.com",    dept: "المالية",            title: "محاسب",               programs: 1,  completion: 90 },
  { id: 4,  name: "مصطفى محمود عزالدين",     idNo: "1023456789", email: "mustafa123@gmail.com",        dept: "المالية",            title: "محاسب",               programs: 0,  completion: 0  },
  { id: 5,  name: "كريم محمد السيوفي",       idNo: "1023456789", email: "kareemelsewy@gmail.com",      dept: "تقنية المعلومات",   title: "مطور نظم",            programs: 2,  completion: 55 },
  { id: 6,  name: "محمود رجب عبدالعزيز",     idNo: "1023456789", email: "mahmoudragab2@gmail.com",     dept: "تقنية المعلومات",   title: "مطور نظم",            programs: 1,  completion: 60 },
  { id: 7,  name: "علي السيد بدير",          idNo: "1023456789", email: "alielsayed2547@gmail.com",    dept: "تقنية المعلومات",   title: "مطور نظم",            programs: 1,  completion: 45 },
  { id: 8,  name: "سارة خالد منصور",         idNo: "1023456789", email: "sarah.k@gmail.com",           dept: "التسويق",            title: "مدير تسويق",          programs: 4,  completion: 95 },
  { id: 9,  name: "هند إبراهيم الشمري",      idNo: "1023456789", email: "hind.sh@gmail.com",           dept: "التسويق",            title: "محلل بيانات",         programs: 3,  completion: 70 },
  { id: 10, name: "عمر فاروق الغامدي",       idNo: "1023456789", email: "omar.fg@gmail.com",           dept: "العمليات",           title: "مدير عمليات",         programs: 2,  completion: 65 },
  { id: 11, name: "نورة محمد العتيبي",       idNo: "1023456789", email: "noura.m@gmail.com",           dept: "الموارد البشرية",    title: "مدير موارد بشرية",    programs: 6,  completion: 88 },
  { id: 12, name: "فيصل علي الزهراني",       idNo: "1023456789", email: "faisal.z@gmail.com",          dept: "العمليات",           title: "مشرف عمليات",         programs: 2,  completion: 50 },
];

const DEPTS = ["كل الأقسام", ...Array.from(new Set(MOCK_EMPLOYEES.map(e => e.dept)))];

// ─── icon helper ──────────────────────────────────────────────────────────────
const I = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block" }}>
    {d}
  </svg>
);

const IcoUsers    = ({ size = 20 }) => <I size={size} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoUser     = ({ size = 20 }) => <I size={size} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const IcoGrad     = ({ size = 20 }) => <I size={size} d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;
const IcoChart    = ({ size = 20 }) => <I size={size} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>} />;
const IcoSearch   = () => <I d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoPlus     = () => <I sw={2.5} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoBuilding = () => <I d={<><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="14" y1="14" x2="16" y2="14"/></>} />;
const IcoFilter   = () => <I d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} />;
const IcoSort     = () => <I d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />;
const IcoEdit     = () => <I d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcoTrash    = () => <I stroke="#ef4444" d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>} />;
const IcoDownload = () => <I d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />;
const IcoChevron  = () => <I size={14} d={<polyline points="6 9 12 15 18 9"/>} />;
const IcoX        = () => <I size={14} sw={2.5} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;

// ─── skeleton pulse ───────────────────────────────────────────────────────────
const Sk = ({ w = "w-full", h = "h-4", r = "rounded-lg" }) => (
  <div className={`${w} ${h} ${r} bg-slate-200 animate-pulse`} />
);

// ─── stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, loading }) {
  return (
    <article
      className="bg-white border border-slate-100 rounded-2xl flex items-center
        justify-between gap-3 px-5 py-4 transition-shadow hover:shadow-md"
      dir="rtl"
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-xs text-slate-400 leading-tight">{label}</span>
        {loading
          ? <Sk w="w-16" h="h-8" r="rounded-lg" />
          : <span className="text-3xl font-extrabold leading-none" style={{ color: "#1D293D" }}>{value}</span>
        }
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "#0246770D", color: BRAND }}>
        {icon}
      </div>
    </article>
  );
}

// ─── modal select dropdown ────────────────────────────────────────────────────
function ModalSelect({ value, onChange, placeholder, options }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 200 });
  const btnRef  = useRef();
  const menuRef = useRef();

  useEffect(() => {
    const handler = e => {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(o => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl
          px-4 py-3 text-sm bg-white focus:outline-none transition text-right"
        style={{ color: value ? "#1D293D" : "#94a3b8" }}
      >
        <span className={`transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ color: "#94a3b8" }}>
          <IcoChevron />
        </span>
        <span className="flex-1 text-right truncate">{value || placeholder}</span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          dir="rtl"
          style={{
            position:  "fixed",
            top:       pos.top,
            left:      pos.left,
            width:     pos.width,
            zIndex:    99999,
          }}
          className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {(options ?? []).map(opt => (
              <button key={opt} type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full text-right px-4 py-2.5 text-sm transition hover:bg-slate-50"
                style={value === opt ? { color: BRAND, fontWeight: 700, background: "#f0f7ff" } : { color: "#64748b" }}>
                {opt}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const DEPT_OPTIONS  = Array.from(new Set(MOCK_EMPLOYEES.map(e => e.dept)));

// mock programs list for the edit modal
const MOCK_PROGRAMS = [
  "برنامج إدارة المشاريع الاحترافية",
  "برنامج القيادة الفعالة",
  "برنامج التحول الرقمي",
  "برنامج المحاسبة المتقدمة",
  "برنامج التسويق الإلكتروني",
];

// ─── add / edit employee modal ────────────────────────────────────────────────
function EmployeeModal({ employee, departments, onSave, onCreate, onClose, externalSaving, externalError }) {
  const isEdit = !!employee;

  // initialise enrolled programs list for edit mode
  const initPrograms = isEdit
    ? (employee.programsList ?? Array.from({ length: employee.programs || 0 }, (_, i) => MOCK_PROGRAMS[i] ?? `برنامج ${i + 1}`))
    : [];

  const [form, setForm] = useState(
    employee
      ? {
          id:   employee.id,
          name: employee.name ?? "",
          idNo: employee.idNo ?? "",
          email: employee.email ?? "",
          dept: employee.dept ?? "",
          deptId: employee.deptId ?? "",
          title: employee.title ?? "",
          programs: employee.programs ?? 0,
          completion: employee.completion ?? 0,
        }
      : { name: "", idNo: "", email: "", dept: "", deptId: "", title: "", programs: 0, completion: 0 }
  );
  const [programsList, setProgramsList] = useState(initPrograms);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const removeProgram = idx => setProgramsList(p => p.filter((_, i) => i !== idx));

  // dept options: real departments (preferred) → old local fallback
  const deptOptions = departments?.length ? departments.map(d => d.name) : DEPT_OPTIONS;

  const pickDept = name => {
    const d = (departments ?? []).find(x => x.name === name);
    set("dept", name);
    set("deptId", d ? d.id : "");
  };

  const submit = async () => {
    if (isEdit) {
      setSaving(true);
      setError("");
      try {
        await onSave({ ...form, programsList, programs: programsList.length, deptId: form.deptId }, employee);
      } catch (e) {
        setError(e?.message || "حدث خطأ أثناء تعديل بيانات الموظف، حاول مرة أخرى.");
      } finally {
        setSaving(false);
      }
      return;
    }
    // validation for add mode
    if (!form.name.trim() || !form.idNo.trim() || !form.email.trim()) {
      setError("من فضلك أدخل الاسم ورقم الهوية والبريد الإلكتروني.");
      return;
    }
    if (!form.deptId) {
      setError("من فضلك اختر القسم.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onCreate({
        name:         form.name.trim(),
        national_id:  form.idNo.trim(),
        email:        form.email.trim(),
        department_id: form.deptId,
        job_title:    form.title.trim(),
      });
      onClose();
    } catch (e) {
      setError(e?.message || "حدث خطأ أثناء إضافة الموظف، حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ maxWidth: 640, borderRadius: 16, maxHeight: "95vh" }}>

        {/* ── header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0246770D", color: BRAND }}>
              <IcoUser size={16} />
            </div>
            <span className="text-sm" style={{ color: "#64748b" }}>قائمة الموظفين</span>
            <span className="text-sm text-slate-400">/</span>
            <span className="text-sm font-bold" style={{ color: BRAND }}>
              {isEdit ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
            </span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200
              text-slate-400 hover:text-slate-700 hover:border-slate-300 transition">
            <IcoX />
          </button>
        </div>

        <div className="h-px mx-6" style={{ background: "#E1E1E1" }} />

        {/* ── body ── */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="flex flex-col gap-4">

            {/* اسم الموظف */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-right" style={{ color: BRAND }}>اسم الموظف</label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="أضف إسم الموظف"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                  transition placeholder:text-slate-300 text-right"
                style={{ color: "#64748b" }}
              />
            </div>

            {/* رقم الهوية */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-right" style={{ color: BRAND }}>رقم الهوية</label>
              <input
                value={form.idNo}
                onChange={e => set("idNo", e.target.value)}
                placeholder="أضف رقم الهوية"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                  transition placeholder:text-slate-300 text-right"
                style={{ color: "#64748b" }}
              />
            </div>

            {/* البريد الإلكتروني */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-right" style={{ color: BRAND }}>البريد الإلكتروني</label>
              <input
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="أضف البريد الإلكتروني"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                  transition placeholder:text-slate-300 text-right"
                style={{ direction: "ltr", textAlign: "left", color: "#64748b" }}
              />
            </div>

            {/* القسم */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-right" style={{ color: BRAND }}>القسم</label>
              <ModalSelect
                value={form.dept}
                onChange={pickDept}
                placeholder={departments?.length ? "إختر القسم" : "جارٍ تحميل الأقسام..."}
                options={deptOptions}
              />
            </div>

            {/* المسمى الوظيفي */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-right" style={{ color: BRAND }}>المسمى الوظيفي</label>
              <input
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="أضف المسمى الوظيفي"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                  transition placeholder:text-slate-300 text-right"
                style={{ color: "#64748b" }}
              />
            </div>

            {/* البرامج المسجلة — edit only */}
            {isEdit && programsList.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-right" style={{ color: BRAND }}>البرامج المسجلة</label>
                <div className="flex flex-col gap-2">
                  {programsList.map((prog, idx) => (
                    <div key={idx}
                      className="flex items-center justify-between border border-slate-200
                        rounded-xl px-4 py-3 bg-white">
                      <button
                        type="button"
                        onClick={() => removeProgram(idx)}
                        className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200
                          text-slate-400 hover:border-red-300 hover:text-red-400 transition shrink-0">
                        <I size={12} sw={2.5} d={<><line x1="5" y1="12" x2="19" y2="12"/></>} />
                      </button>
                      <span className="text-sm flex-1 text-right mr-3" style={{ color: "#64748b" }}>{prog}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* submit error */}
            {(error) && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

          </div>
        </div>

        <div className="h-px mx-6" style={{ background: "#E1E1E1" }} />

        {/* ── footer ── */}
        <div className="flex gap-3 px-6 py-5">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90
              disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: BRAND }}>
            {saving && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            )}
            {saving ? "جارٍ الحفظ..." : isEdit ? "تعديل البيانات" : "إضافة الموظف"}
          </button>
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold border border-slate-200
              text-slate-600 hover:bg-slate-50 transition disabled:opacity-60">
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, loading, error }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <IcoTrash />
        </div>
        <div>
          <p className="font-bold text-slate-800">حذف الموظف</p>
          <p className="text-sm text-slate-500 mt-1">هل تريد حذف <b>{name}</b>؟ لا يمكن التراجع.</p>
        </div>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            )}
            {loading ? "جارٍ الحذف..." : "نعم، احذف"}
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200
              text-slate-600 hover:bg-slate-50 transition disabled:opacity-60">
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── success modal (shows the temporary password of the new employee) ────────
function CreatedModal({ created, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.temporary_password ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="font-extrabold text-slate-800 text-lg">تم إضافة الموظف بنجاح</p>
          <p className="text-sm text-slate-500 mt-1">
            تم إنشاء حساب <b>{created.name}</b>. شاركه كلمة المرور المؤقتة التالية
            لتسجيل الدخول لأول مرة:
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border border-dashed
          border-slate-300 rounded-xl bg-slate-50 px-4 py-3" dir="ltr">
          <span className="font-mono font-bold text-slate-800 text-sm tracking-wider" dir="ltr">
            {created.temporary_password}
          </span>
          <button onClick={copy}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
              border border-slate-200 bg-white text-[#024677] hover:border-[#024677]/40 transition shrink-0"
            dir="rtl">
            {copied ? "تم النسخ ✓" : "نسخ"}
          </button>
        </div>
        <button onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: BRAND }}>
          حسناً
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── success modal (shows a returned API message) ─────────────────────────────
function SuccessModal({ message, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-extrabold text-slate-800 text-lg">{message || "تمت العملية بنجاح."}</p>
        <button onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: BRAND }}>
          حسناً
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── add department modal ─────────────────────────────────────────────────────
function DepartmentModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", job_title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      setError("من فضلك أدخل اسم القسم.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { name: form.name.trim() };
      if (form.job_title.trim()) payload.job_title = form.job_title.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(e?.message || "حدث خطأ أثناء إنشاء القسم، حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ maxWidth: 480, borderRadius: 16, maxHeight: "95vh" }}>

        {/* ── header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0246770D", color: BRAND }}>
              <IcoBuilding />
            </div>
            <span className="text-sm font-bold" style={{ color: BRAND }}>إضافة قسم جديد</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200
              text-slate-400 hover:text-slate-700 hover:border-slate-300 transition">
            <IcoX />
          </button>
        </div>

        <div className="h-px mx-6" style={{ background: "#E1E1E1" }} />

        {/* ── body ── */}
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-right" style={{ color: BRAND }}>اسم القسم</label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="مثال: الموارد البشرية"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                transition placeholder:text-slate-300 text-right"
              style={{ color: "#64748b" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-right" style={{ color: BRAND }}>المسمى الوظيفي (اختياري)</label>
            <input
              value={form.job_title}
              onChange={e => set("job_title", e.target.value)}
              placeholder="الدور العام لأعضاء القسم"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                transition placeholder:text-slate-300 text-right"
              style={{ color: "#64748b" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-right" style={{ color: BRAND }}>الوصف (اختياري)</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="وصف مختصر للقسم"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                transition placeholder:text-slate-300 text-right resize-none"
              style={{ color: "#64748b" }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>

        <div className="h-px mx-6" style={{ background: "#E1E1E1" }} />

        {/* ── footer ── */}
        <div className="flex gap-3 px-6 py-5">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90
              disabled:opacity-60"
            style={{ background: BRAND }}>
            {saving ? "جارٍ الإضافة..." : "إضافة القسم"}
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold border border-slate-200
              text-slate-600 hover:bg-slate-50 transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── employee detail drawer ───────────────────────────────────────────────────
function EmployeeDrawer({ employee, onClose }) {
  if (!employee) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto"
        dir="rtl" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-extrabold text-slate-800">ملف الموظف</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200
              text-slate-400 hover:text-slate-700 transition">
            <IcoX />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 py-8 px-5 bg-[#f7f9fc]">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white"
            style={{ background: BRAND }}>
            {employee.name.trim()[0]}
          </div>
          <div className="text-center">
            <p className="font-extrabold text-slate-800 text-lg">{employee.name}</p>
            <p className="text-sm text-slate-500 mt-0.5">{employee.title}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ background: "#0246770D", color: BRAND }}>
            {employee.dept}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {[
            { label: "رقم الهوية",        value: employee.idNo,  dir: "ltr" },
            { label: "البريد الإلكتروني", value: employee.email, dir: "ltr" },
            { label: "القسم",             value: employee.dept   },
            { label: "المسمى الوظيفي",   value: employee.title  },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2.5
              border-b border-slate-50 last:border-0">
              <span className="text-xs text-slate-400">{r.label}</span>
              <span className="text-sm font-semibold text-slate-700" dir={r.dir}>{r.value}</span>
            </div>
          ))}

          <div className="pt-2">
            <p className="text-xs font-bold text-slate-700 mb-3">البرامج المسجلة</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-extrabold text-slate-800">
                {employee.programs} {employee.programs === 1 ? "برنامج" : "برامج"}
              </span>
              <span className="text-sm font-bold" style={{ color: TEAL }}>{employee.completion}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${employee.completion}%`, background: TEAL }} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">نسبة الإتمام</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── dept filter dropdown ─────────────────────────────────────────────────────
function DeptDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, right: 0, minWidth: 160 });
  const btnRef = useRef();
  const menuRef = useRef();

  // close on outside click
  useEffect(() => {
    const handler = e => {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // reposition when opened — use viewport coords directly (position:fixed)
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // estimate menu height (max 260px) then place above the button
      const menuH = Math.min(260, (options ?? DEPTS).length * 40 + 8);
      setPos({
        top:      r.top - menuH - 6,
        right:    window.innerWidth - r.right,
        minWidth: r.width,
      });
    }
    setOpen(o => !o);
  };

  const opts = options ?? DEPTS;

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200
          bg-white text-sm text-slate-600 hover:border-[#024677]/30 transition min-w-[140px] justify-between"
      >
        <span className="truncate">{value}</span>
        <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""} shrink-0`}>
          <IcoChevron />
        </span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          dir="rtl"
          style={{
            position:  "fixed",
            top:       pos.top,
            right:     pos.right,
            minWidth:  pos.minWidth,
            zIndex:    99999,
          }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {opts.map(d => (
              <button key={d}
                onClick={() => { onChange(d); setOpen(false); }}
                className="w-full text-right px-4 py-2.5 text-sm transition hover:bg-slate-50"
                style={value === d ? { color: BRAND, fontWeight: 700, background: "#f0f7ff" } : { color: "#64748b" }}>
                {d}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── import CSV modal ─────────────────────────────────────────────────────────
function ImportModal({ onClose, onSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState(null); // { imported_count, updated_count, failed_rows }
  const inputRef = useRef();

  const accept = f => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (["csv","xls","xlsx"].includes(ext)) { setFile(f); setError(""); setResult(null); }
    else setError("صيغة الملف غير مدعومة. يُرجى اختيار ملف CSV أو Excel.");
  };

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await importCompanyEmployees(file);
      setResult(res?.data ?? {});
      onSuccess?.();
    } catch (e) {
      setError(e?.message || "حدث خطأ أثناء الاستيراد، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full bg-white flex flex-col overflow-hidden"
        style={{ maxWidth: 560, borderRadius: 16, maxHeight: "95vh" }}>

        {/* ── header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: "#94a3b8" }}>
              قائمة الموظفين / استيراد موظفين
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#0246770D", color: BRAND }}>
                <IcoDownload />
              </div>
              <h2 className="text-base font-extrabold" style={{ color: BRAND }}>
                استيراد موظفين (CSV / Excel)
              </h2>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400
              hover:text-slate-700 transition mt-1 shrink-0">
            <IcoX />
          </button>
        </div>

        {/* ── body ── */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">

          {/* success result */}
          {result ? (
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-center font-extrabold text-slate-800">تم الاستيراد بنجاح</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 px-4 py-3">
                  <span className="text-2xl font-extrabold" style={{ color: "#059669" }}>{result.imported_count ?? 0}</span>
                  <span className="text-xs text-slate-500">موظفون جدد</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl bg-blue-50 px-4 py-3">
                  <span className="text-2xl font-extrabold" style={{ color: BRAND }}>{result.updated_count ?? 0}</span>
                  <span className="text-xs text-slate-500">موظفون مُحدَّثون</span>
                </div>
              </div>
              {Array.isArray(result.failed_rows) && result.failed_rows.length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm font-bold text-red-600 mb-2">صفوف فاشلة ({result.failed_rows.length})</p>
                  <ul className="text-xs text-red-500 space-y-1 max-h-28 overflow-y-auto">
                    {result.failed_rows.map((r, i) => (
                      <li key={i}>{typeof r === "object" ? (r.message ?? r.error ?? JSON.stringify(r)) : r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer
                  transition-all py-12"
                style={{
                  border: `1.5px dashed ${dragging ? BRAND : "#CBD5E1"}`,
                  background: dragging ? "#f0f7ff" : "#fff",
                }}>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={e => accept(e.target.files[0])}
                />

                {file ? (
                  <>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ background: "#d1faf5", color: TEAL }}>
                      <IcoDownload />
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#1D293D" }}>{file.name}</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null); setError(""); }}
                      className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                      إزالة الملف
                    </button>
                  </>
                ) : (
                  <>
                    <svg width={40} height={40} viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-extrabold" style={{ color: "#1D293D" }}>
                        اسحب وأفلت الملف هنا
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        أو انقر للاختيار من جهازك
                      </p>
                      <p className="text-xs" style={{ color: "#CBD5E1" }}>
                        Excel أو CSV (.csv, .xls, .xlsx)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* format hint */}
              <p className="text-xs leading-6 text-right" style={{ color: "#64748b" }}>
                <span className="font-bold" style={{ color: BRAND }}>تنسيق الملف المطلوب: </span>
                يجب أن يحتوي الملف على الأعمدة التالية:
                <br />
                اسم الموظف، رقم الهوية، البريد الإلكتروني، القسم، المسمى الوظيفي
              </p>

              {/* error */}
              {error && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── footer ── */}
        <div className="px-6 py-4 border-t border-[#F0F0F0] flex gap-3">
          {result ? (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: BRAND }}>
              حسناً
            </button>
          ) : (
            <>
              {file && (
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90
                    disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: BRAND }}>
                  {loading && (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                  )}
                  {loading ? "جارٍ الاستيراد..." : "استيراد الموظفين"}
                </button>
              )}
              <button onClick={onClose} disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-slate-200
                  text-slate-600 hover:bg-slate-50 transition disabled:opacity-60">
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
const PER_PAGE = 8;

// ─── API employee → table row ────────────────────────────────────────────────
function normalizeEmployee(e) {
  const deptName = typeof e.department === "object" && e.department
    ? (e.department.name ?? "—")
    : (e.department ?? e.dept ?? "—");
  return {
    id:         e.id,
    name:       e.name ?? e.full_name ?? "—",
    idNo:       e.national_id ?? e.id_number ?? "—",
    email:      e.email ?? "—",
    dept:       deptName,
    deptId:     typeof e.department === "object" && e.department ? e.department.id ?? "" : "",
    title:      e.job_title ?? e.title ?? "—",
    programs:   e.programs_count ?? e.enrolled_programs ?? 0,
    completion: e.completion_rate ?? e.completion ?? 0,
  };
}

export default function EmployeesPage({ onViewEmployee }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search,    setSearch]    = useState("");
  const [dept,      setDept]      = useState("كل الأقسام");
  const [page,      setPage]      = useState(1);
  const [toDelete,  setToDelete]  = useState(null);
  const [editEmp,   setEditEmp]   = useState(null);
  const [viewEmp,   setViewEmp]   = useState(null);
  const [created,   setCreated]   = useState(null);
  const [deptMsg,   setDeptMsg]   = useState(null);
  const [showDep,   setShowDep]   = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);
  const [editLoading,   setEditLoading]   = useState(false);
  const [editError,     setEditError]     = useState(null);
  const [successMsg,    setSuccessMsg]    = useState(null);
  const [sortBy,        setSortBy]        = useState(null);   // null | "name" | "dept" | "title"
  const [sortDir,       setSortDir]       = useState("asc");  // "asc" | "desc"
  const [filterTitle,   setFilterTitle]   = useState("all");  // "all" | any job title
  const [showSortMenu,  setShowSortMenu]  = useState(false);
  const [showFilterMenu,setShowFilterMenu]= useState(false);
  const sortMenuRef   = useRef(null);
  const filterMenuRef = useRef(null);

  // close sort/filter menus on outside click
  useEffect(() => {
    const handler = e => {
      if (sortMenuRef.current   && !sortMenuRef.current.contains(e.target))   setShowSortMenu(false);
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) setShowFilterMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadEmployees = () => {
    setLoading(true);
    fetchCompanyEmployees({ per_page: 100 })
      .then(res => {
        const list = res?.data?.data ?? res?.data ?? [];
        setEmployees(Array.isArray(list) ? list.map(normalizeEmployee) : []);
      })
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEmployees(); }, []);

  // load company departments for the add-modal / filter
  const loadDepartments = () => {
    fetchCompanyDepartments()
      .then(d => { if (Array.isArray(d) && d.length) setDepartments(d); })
      .catch(() => { /* keep local fallback options */ });
  };

  useEffect(() => { loadDepartments(); }, []);

  // create a new department, then refresh the list
  const handleCreateDepartment = async payload => {
    const res = await createCompanyDepartment(payload);
    setDeptMsg(res?.message || "تم إنشاء القسم بنجاح.");
    loadDepartments();
  };

  // available depts for toolbar filter ("كل الأقسام" + real departments → fallback)
  const deptOptions = ["كل الأقسام", ...(departments.length
    ? departments.map(d => d.name)
    : DEPTS.slice(1))];

  const totalEmp      = employees.length;
  const enrolledEmp   = employees.filter(e => e.programs > 0).length;
  const notEnrolled   = employees.filter(e => e.programs === 0).length;
  const avgCompletion = (() => {
    const withProgs = employees.filter(e => e.programs > 0);
    return withProgs.length
      ? Math.round(withProgs.reduce((a, b) => a + b.completion, 0) / withProgs.length)
      : 0;
  })();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = employees.filter(e => {
      const matchSearch = !q ||
        e.name.toLowerCase().includes(q)  ||
        e.email.toLowerCase().includes(q) ||
        e.dept.toLowerCase().includes(q)  ||
        e.title.toLowerCase().includes(q);
      const matchDept  = dept         === "كل الأقسام" || e.dept  === dept;
      const matchTitle = filterTitle  === "all"         || e.title === filterTitle;
      return matchSearch && matchDept && matchTitle;
    });

    if (sortBy) {
      list = [...list].sort((a, b) => {
        let va, vb;
        if      (sortBy === "name")  { va = a.name;  vb = b.name; }
        else if (sortBy === "dept")  { va = a.dept;  vb = b.dept; }
        else                         { va = a.title; vb = b.title; }
        const cmp = String(va).localeCompare(String(vb), "ar");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [employees, search, dept, filterTitle, sortBy, sortDir]);

  // unique job titles for filter menu (built from actual data)
  const titleOptions = useMemo(() => {
    const titles = [...new Set(employees.map(e => e.title).filter(t => t && t !== "—"))];
    return titles.sort((a, b) => a.localeCompare(b, "ar"));
  }, [employees]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = v => { setSearch(v); setPage(1); };
  const handleDept   = v => { setDept(v);   setPage(1); };

  const handleDelete = async id => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteCompanyEmployee(id);
      setToDelete(null);
      loadEmployees();
    } catch (e) {
      setDeleteError(e?.message || "حدث خطأ أثناء حذف الموظف، حاول مرة أخرى.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async (form, originalEmployee) => {
    if (!form?.id) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const dept = departments.find(d => d.name === form.dept);
      const deptId = form.deptId || dept?.id || null;
      const payload = {
        name:      form.name?.trim()  || undefined,
        email:     form.email?.trim() || undefined,
        job_title: form.title?.trim() || undefined,
      };
      // only send national_id if it actually changed
      const origId = originalEmployee?.idNo ?? originalEmployee?.national_id ?? "";
      if (form.idNo?.trim() && form.idNo.trim() !== origId) {
        payload.national_id = form.idNo.trim();
      }
      if (deptId) payload.department_id = deptId;
      if (Array.isArray(form.programIds) && form.programIds.length) {
        payload.enrolled_program_ids = form.programIds;
      }
      const res = await updateCompanyEmployee(form.id, payload);

      // build the updated row — use API response if available, otherwise apply
      // the form values directly so the table always reflects what was saved
      const updatedRow = res?.data
        ? normalizeEmployee(res.data)
        : {
            name:   form.name?.trim()  || originalEmployee?.name,
            email:  form.email?.trim() || originalEmployee?.email,
            idNo:   form.idNo?.trim()  || originalEmployee?.idNo,
            title:  form.title?.trim() || originalEmployee?.title,
            dept:   form.dept          || originalEmployee?.dept,
            deptId: deptId             || originalEmployee?.deptId,
          };

      setEditEmp(null);
      setSuccessMsg(res?.message || "تم تعديل بيانات الموظف بنجاح.");
      loadEmployees();
    } catch (e) {
      setEditError(e?.message || "حدث خطأ أثناء تعديل بيانات الموظف، حاول مرة أخرى.");
      throw e;
    } finally {
      setEditLoading(false);
    }
  };

  // real add — POST /company/employees, then keep the created employee for the password modal
  const handleCreateEmployee = async payload => {
    const res = await createCompanyEmployee(payload);
    const emp = res?.data ?? {};
    setCreated(emp);
    loadEmployees();
    return emp;
  };

  const COLS = ["اسم الموظف", "رقم الهوية", "البريد الإلكتروني", "القسم", "المسمى الوظيفي", "البرامج المسجلة", "عرض", "إجراءات"];

  return (
    <main className="flex-1 overflow-y-auto bg-white p-3 sm:p-6 space-y-6" dir="rtl">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* stats */}
        <div className="bg-white rounded-2xl border border-[#E1E1E1] p-3 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard loading={loading} icon={<IcoUsers size={22} />}  label="إجمالي الموظفين"                  value={totalEmp} />
            <StatCard loading={loading} icon={<IcoGrad size={22} />}   label="الموظفون المسجلون في برامج"        value={enrolledEmp} />
            <StatCard loading={loading} icon={<IcoUser size={22} />}   label="الموظفون غير المسجلين"             value={notEnrolled} />
            <StatCard loading={loading} icon={<IcoChart size={22} />}  label="متوسط نسبة إتمام البرامج"          value={`${avgCompletion}%`} />
          </div>
        </div>

        {/* toolbar + table */}
        <div className="bg-white rounded-2xl border border-[#E1E1E1] p-3 sm:p-5 space-y-4">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">

          {/* ── row 1 (mobile) / inline (desktop): title + action buttons ── */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0246770D", color: BRAND }}>
              <IcoUsers size={14} />
            </div>
            <h1 className="text-sm font-extrabold" style={{ color: BRAND }}>قائمة الموظفين</h1>
          </div>

          {/* action buttons — full width on mobile, auto on desktop */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200
              bg-white text-sm font-semibold text-slate-600 hover:border-[#024677]/30
              hover:text-[#024677] transition whitespace-nowrap">
              <IcoDownload />
              <span className="hidden sm:inline">إستيراد موظفين (CSV / EXCEL)</span>
              <span className="sm:hidden">استيراد</span>
            </button>

            <button
              onClick={() => setEditEmp(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                text-white transition hover:opacity-90 whitespace-nowrap"
              style={{ background: BRAND }}>
              <IcoPlus />
              إضافة موظف جديد
            </button>

            <button
              onClick={() => setShowDep(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                bg-white text-sm font-semibold text-slate-600 hover:border-[#024677]/30
                hover:text-[#024677] transition whitespace-nowrap">
              <IcoBuilding />
              إضافة قسم
            </button>
          </div>

          {/* ── row 2 (mobile) / inline (desktop): search + filters ── */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative w-full sm:w-52">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <IcoSearch />
              </span>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="بحث عن موظف..."
                className="w-full pr-9 pl-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#024677]/20
                  focus:border-[#024677] transition placeholder:text-slate-400"
              />
            </div>

            <DeptDropdown value={dept} options={deptOptions} onChange={handleDept} />

            {/* ── sort button ── */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => { setShowSortMenu(o => !o); setShowFilterMenu(false); }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition shrink-0
                  ${sortBy ? "border-[#024677] text-[#024677] bg-blue-50" : "border-slate-200 bg-white text-slate-500 hover:text-[#024677] hover:border-[#024677]/30"}`}>
                <IcoSort />
              </button>
              {showSortMenu && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px]">
                  {[
                    { key: "name",  label: "ترتيب بالاسم" },
                    { key: "dept",  label: "ترتيب بالقسم" },
                    { key: "title", label: "ترتيب بالمسمى الوظيفي" },
                  ].map(opt => (
                    <button key={opt.key}
                      onClick={() => {
                        if (sortBy === opt.key) setSortDir(d => d === "asc" ? "desc" : "asc");
                        else { setSortBy(opt.key); setSortDir("asc"); }
                        setShowSortMenu(false); setPage(1);
                      }}
                      className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 transition flex items-center justify-between gap-2
                        ${sortBy === opt.key ? "text-[#024677] font-bold" : "text-slate-600"}`}>
                      <span>{opt.label}</span>
                      {sortBy === opt.key && <span className="text-[10px]">{sortDir === "asc" ? "↑ أ–ي" : "↓ ي–أ"}</span>}
                    </button>
                  ))}
                  {sortBy && (
                    <button onClick={() => { setSortBy(null); setShowSortMenu(false); }}
                      className="w-full text-right px-4 py-2.5 text-xs text-red-400 hover:bg-red-50 transition border-t border-slate-100">
                      إلغاء الترتيب
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── filter button ── */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => { setShowFilterMenu(o => !o); setShowSortMenu(false); }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition shrink-0
                  ${filterTitle !== "all" ? "border-[#024677] text-[#024677] bg-blue-50" : "border-slate-200 bg-white text-slate-500 hover:text-[#024677] hover:border-[#024677]/30"}`}>
                <IcoFilter />
              </button>
              {showFilterMenu && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px] max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setFilterTitle("all"); setShowFilterMenu(false); setPage(1); }}
                    className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 transition
                      ${filterTitle === "all" ? "text-[#024677] font-bold bg-blue-50" : "text-slate-600"}`}>
                    كل المسميات الوظيفية
                  </button>
                  {titleOptions.length === 0 && (
                    <p className="px-4 py-3 text-xs text-slate-400">لا توجد بيانات</p>
                  )}
                  {titleOptions.map(t => (
                    <button key={t}
                      onClick={() => { setFilterTitle(t); setShowFilterMenu(false); setPage(1); }}
                      className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 transition
                        ${filterTitle === t ? "text-[#024677] font-bold bg-blue-50" : "text-slate-600"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* table */}
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 780 }} dir="rtl">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {COLS.map((h, i) => (
                    <th key={i}
                      className="text-right font-bold text-xs uppercase tracking-wide
                        px-4 py-3.5 whitespace-nowrap"
                      style={{ color: BRAND }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: PER_PAGE }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        {COLS.map((__, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <Sk w={j === 0 ? "w-32" : j === 7 ? "w-14" : "w-20"} h="h-3.5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : paginated.length === 0
                    ? (
                      <tr>
                        <td colSpan={COLS.length} className="text-center py-16 text-slate-400 text-sm">
                          {search || dept !== "كل الأقسام" ? "لا توجد نتائج مطابقة" : "لا يوجد موظفون بعد"}
                        </td>
                      </tr>
                    )
                    : paginated.map(emp => (
                        <tr key={emp.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-800 whitespace-nowrap">{emp.name}</span>
                          </td>

                          <td className="px-4 py-3.5 text-slate-500 tabular-nums whitespace-nowrap">{emp.idNo}</td>

                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap" dir="ltr">{emp.email}</td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                              style={{ background: "#0246770D", color: BRAND }}>
                              {emp.dept}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap text-xs">{emp.title}</td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-slate-700 text-sm">
                                {emp.programs} {emp.programs === 1 ? "برنامج" : "برامج"}
                              </span>
                              {emp.programs > 0 && (
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                  <div className="h-full rounded-full"
                                    style={{ width: `${emp.completion}%`, background: TEAL }} />
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <button
                              onClick={() => onViewEmployee ? onViewEmployee(emp) : setViewEmp(emp)}
                              className="text-xs font-bold transition hover:underline"
                              style={{ color: TEAL }}>
                              عرض
                            </button>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditEmp(emp)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg
                                  border border-slate-200 text-slate-400 hover:text-[#024677]
                                  hover:border-[#024677]/30 transition bg-white"
                                title="تعديل">
                                <IcoEdit />
                              </button>
                              <button
                                onClick={() => setToDelete(emp)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg
                                  border border-slate-200 text-red-400 hover:border-red-300
                                  hover:bg-red-50 transition bg-white"
                                title="حذف">
                                <IcoTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>

          {!loading && (
            <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                عرض{" "}
                <b className="text-slate-600">
                  {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)}
                </b>{" "}
                من أصل <b className="text-slate-600">{filtered.length}</b> موظف
                {(search || dept !== "كل الأقسام") && (
                  <button
                    onClick={() => { handleSearch(""); handleDept("كل الأقسام"); }}
                    className="mr-3 text-xs font-semibold text-red-400 hover:text-red-600 transition">
                    مسح الفلاتر
                  </button>
                )}
              </span>
              <Pagination page={page} totalPages={Math.ceil(filtered.length / PER_PAGE)} onChange={setPage} />
            </div>
          )}
        </div>
        </div>
      </div>

      {toDelete && (
        <DeleteModal
          name={toDelete.name}
          onConfirm={() => handleDelete(toDelete.id)}
          onCancel={() => { setToDelete(null); setDeleteError(null); }}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      {editEmp !== null && (
        <EmployeeModal
          employee={editEmp || undefined}
          departments={departments}
          onSave={handleSave}
          onCreate={handleCreateEmployee}
          onClose={() => { setEditEmp(null); setEditError(null); }}
          externalSaving={editLoading}
          externalError={editError}
        />
      )}

      {created && (
        <CreatedModal created={created} onClose={() => setCreated(null)} />
      )}

      {showDep && (
        <DepartmentModal
          onSave={handleCreateDepartment}
          onClose={() => setShowDep(false)}
        />
      )}

      {deptMsg && (
        <SuccessModal message={deptMsg} onClose={() => setDeptMsg(null)} />
      )}

      {successMsg && (
        <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}

      {viewEmp && (
        <EmployeeDrawer
          employee={viewEmp}
          onClose={() => setViewEmp(null)}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); loadEmployees(); }}
        />
      )}
    </main>
  );
}
