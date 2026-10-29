import { useState, useEffect } from "react";
import {
  fetchCompanyEmployees,
  createCompanyEmployee,
  updateCompanyEmployee,
  deleteCompanyEmployee,
  fetchCompanyDepartments,
} from "../../services/api";

// ── palette ──────────────────────────────────────────────────────────────────
const C_PRIMARY = "#00527F";   // dark blue
const C_TEAL    = "#42D8C8";   // turquoise
const C_GRAY    = "#F1F4F6";   // light gray
const C_BORDER  = "#E3EBEF";   // border gray
const C_GREEN_BG  = "#CDEEDD"; // success bg
const C_GREEN      = "#32A866"; // success text
const C_RED_BG     = "#F4C9CC"; // error bg
const C_RED        = "#C9505D"; // error text
const C_BLUE_BG    = "#DDEBF3"; // neutral/pending bg

// ── icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 15, color = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IcoSettings = ({ size = 17 }) => <Ico size={size} color={C_TEAL} sw={2} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;
const IcoSearch  = ({ size = 15 }) => <Ico size={size} color="#9AA8B4" sw={2} d={<><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoPlus    = ({ size = 14 }) => <Ico size={size} sw={2.2} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>;
const IcoSliders = ({ size = 15 }) => <Ico size={size} color="#5A7184" sw={1.8} d={<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>}/>;
const IcoRefresh = ({ size = 15 }) => <Ico size={size} color="#5A7184" sw={1.8} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const IcoTrash   = ({ size = 15 }) => <Ico size={size} color={C_PRIMARY} sw={1.8} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>}/>;
const IcoEdit    = ({ size = 15 }) => <Ico size={size} color={C_PRIMARY} sw={1.8} d={<><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></>}/>;
const IcoLock    = ({ size = 15, color = C_TEAL }) => <Ico size={size} color={color} sw={1.9} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;

// ── empty initial state (populated from API) ─────────────────────────────────

// ── status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    active:   { bg: C_GREEN_BG, color: C_GREEN,   label: "نشط"             },
    pending:  { bg: C_BLUE_BG,  color: C_PRIMARY, label: "بانتظار التفعيل" },
    disabled: { bg: C_RED_BG,   color: C_RED,     label: "معطل"            },
  }[status] ?? { bg: C_BLUE_BG, color: C_PRIMARY, label: status };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-5"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── add/edit modal ─────────────────────────────────────────────────────────────
function EmployeeModal({ employee, departments, onClose, onSaved }) {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState({
    name:          employee?.name          ?? "",
    email:         employee?.email         ?? "",
    national_id:   employee?.national_id   ?? "",
    job_title:     employee?.job_title      ?? "",
    department_id: employee?.department_id ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [tempPwd, setTempPwd] = useState("");

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      if (isEdit) {
        await updateCompanyEmployee(employee.id, form);
        onSaved();
      } else {
        const res = await createCompanyEmployee(form);
        const pwd = res?.data?.temporary_password ?? "";
        if (pwd) { setTempPwd(pwd); return; }
        onSaved();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (tempPwd) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center" dir="rtl">
        <div className="text-green-600 text-5xl mb-3">✓</div>
        <h3 className="font-semibold text-base mb-1" style={{ color: C_PRIMARY }}>تمت إضافة الموظف</h3>
        <p className="text-sm text-slate-500 mb-3">كلمة المرور المؤقتة</p>
        <div className="bg-slate-100 rounded-lg px-4 py-2 font-mono text-lg font-bold tracking-widest mb-5" dir="ltr">{tempPwd}</div>
        <button onClick={onSaved}
          className="h-10 px-8 rounded-lg text-white text-sm font-semibold"
          style={{ background: C_PRIMARY }}>حسناً</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" dir="rtl">
        <h3 className="text-base font-semibold mb-5" style={{ color: C_PRIMARY }}>
          {isEdit ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
        </h3>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <form onSubmit={submit} className="flex flex-col gap-3">
          {[
            { label: "الاسم",         key: "name",        type: "text" },
            { label: "البريد الإلكتروني", key: "email",   type: "email" },
            { label: "الهوية الوطنية",  key: "national_id", type: "text" },
            { label: "المسمى الوظيفي",  key: "job_title",  type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: "#5A7184" }}>{label}</label>
              <input type={type} required value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: C_BORDER }} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#5A7184" }}>القسم</label>
            <select required value={form.department_id}
              onChange={e => set("department_id", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none bg-white"
              style={{ borderColor: C_BORDER }}>
              <option value="">اختر القسم</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose}
              className="h-9 px-5 rounded-lg border text-sm font-medium"
              style={{ borderColor: C_BORDER, color: "#5A7184" }}>إلغاء</button>
            <button type="submit" disabled={saving}
              className="h-9 px-5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: C_PRIMARY }}>
              {saving ? "جارٍ الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── delete confirm modal ───────────────────────────────────────────────────────
function DeleteModal({ employee, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function confirm() {
    setLoading(true); setError("");
    try {
      await deleteCompanyEmployee(employee.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center" dir="rtl">
        <div className="text-4xl mb-2">🗑️</div>
        <h3 className="text-base font-semibold mb-1" style={{ color: C_PRIMARY }}>حذف الموظف</h3>
        <p className="text-sm text-slate-500 mb-4">هل أنت متأكد من حذف <strong>{employee.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.</p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="flex justify-center gap-3">
          <button onClick={onClose}
            className="h-9 px-5 rounded-lg border text-sm font-medium"
            style={{ borderColor: C_BORDER, color: "#5A7184" }}>إلغاء</button>
          <button onClick={confirm} disabled={loading}
            className="h-9 px-5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: "#C9505D" }}>
            {loading ? "جارٍ الحذف..." : "حذف"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function CompanyUsersSettingsPage() {
  const [employees,    setEmployees]    = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [meta,         setMeta]         = useState({ current_page: 1, last_page: 1, total: 0 });

  // modals
  const [showAdd,      setShowAdd]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);  // employee to edit
  const [deleteTarget, setDeleteTarget] = useState(null);  // employee to delete

  async function load(p = page, q = search) {
    setLoading(true); setError("");
    try {
      const res = await fetchCompanyEmployees({ page: p, search: q });
      const d   = res?.data ?? {};
      setEmployees(Array.isArray(d.data) ? d.data : []);
      setMeta({ current_page: d.current_page ?? 1, last_page: d.last_page ?? 1, total: d.total ?? 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1, ""); fetchCompanyDepartments().then(setDepartments).catch(() => {}); }, []);

  function handleSearch(v) { setSearch(v); setPage(1); load(1, v); }
  function handleRefresh() { load(page, search); }

  function afterSaved() {
    setShowAdd(false); setEditTarget(null);
    load(page, search);
  }
  function afterDeleted() {
    setDeleteTarget(null);
    // if last item on page > 1, go back
    const newPage = employees.length === 1 && page > 1 ? page - 1 : page;
    setPage(newPage);
    load(newPage, search);
  }

  const COLUMNS = ["اسم الموظف", "البريد الإلكتروني", "رقم الجوال", "المسمى الوظيفي", "القسم", "إجراءات"];

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0 relative" dir="rtl">
      {/* thin blue line on the left edge */}
      <div className="absolute top-0 bottom-0 left-0 w-[2px] pointer-events-none"
        style={{ background: C_PRIMARY }} />

      <div className="w-full max-w-[1100px] mx-auto px-6 py-8">
        {/* ── header ── */}
        <div className="flex items-center gap-2 mb-5">
          <IcoSettings />
          <h1 className="text-lg font-semibold" style={{ color: C_PRIMARY }}>الإعدادات — المستخدمون</h1>
        </div>

        {/* ── toolbar ── */}
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          {/* search field */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IcoSearch />
            </span>
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="بحث عن موظف"
              className="w-full h-[38px] pr-9 pl-3 rounded-lg border text-[13px] text-slate-700
                bg-white focus:outline-none transition placeholder:text-slate-400"
              style={{ borderColor: C_BORDER }}
            />
          </div>

          {/* add button */}
          <button type="button" onClick={() => setShowAdd(true)}
            className="h-[38px] px-4 rounded-lg text-white text-[13px] font-semibold flex items-center gap-1.5 shrink-0"
            style={{ background: C_PRIMARY }}>
            <IcoPlus color="#fff" />
            إضافة موظف جديد
          </button>

          {/* refresh */}
          <button type="button" onClick={handleRefresh}
            className="w-[38px] h-[38px] rounded-lg flex items-center justify-center shrink-0 bg-white border"
            style={{ borderColor: C_BORDER }}>
            <IcoRefresh />
          </button>
        </div>

        {/* ── error banner ── */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
            style={{ background: C_RED_BG, color: C_RED }}>
            {error}
          </div>
        )}

        {/* ── users table card ── */}
        <div className="bg-white rounded-lg border p-[10px]"
          style={{ borderColor: C_BORDER }}>
          <div className="users-scroll overflow-y-auto rounded-md" style={{ maxHeight: 430 }}>
            <table className="w-full border-collapse text-right" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  {COLUMNS.map(c => (
                    <th key={c}
                      className="py-2 px-3 text-[12px] font-semibold whitespace-nowrap"
                      style={{ color: C_PRIMARY, background: C_GRAY }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="py-10 text-center text-sm text-slate-400">
                      جارٍ التحميل...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="py-10 text-center text-sm text-slate-400">
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : employees.map((emp, i) => (
                  <tr key={emp.id}
                    style={{ background: i % 2 === 1 ? "#F7FAFB" : "#FFFFFF" }}>
                    <td className="py-2 px-3 text-[13px] font-semibold whitespace-nowrap"
                      style={{ color: "#1D293D" }}>{emp.name}</td>
                    <td className="py-2 px-3 text-[12px] whitespace-nowrap"
                      style={{ color: "#5A7184" }} dir="ltr">{emp.email ?? "—"}</td>
                    <td className="py-2 px-3 text-[12px] whitespace-nowrap"
                      style={{ color: "#5A7184" }}>{emp.phone ?? "—"}</td>
                    <td className="py-2 px-3 text-[12px] whitespace-nowrap"
                      style={{ color: "#33475B" }}>{emp.job_title ?? "—"}</td>
                    <td className="py-2 px-3 text-[12px] whitespace-nowrap"
                      style={{ color: "#33475B" }}>{emp.department?.name ?? "—"}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label="حذف" onClick={() => setDeleteTarget(emp)}
                          className="opacity-80 hover:opacity-100 transition">
                          <IcoTrash />
                        </button>
                        <button type="button" aria-label="تعديل" onClick={() => setEditTarget(emp)}
                          className="opacity-80 hover:opacity-100 transition">
                          <IcoEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── pagination ── */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between px-2 pt-3 text-xs text-slate-500">
              <span>إجمالي: {meta.total} موظف</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); load(p, search); }}
                  className="h-7 px-3 rounded border disabled:opacity-40"
                  style={{ borderColor: C_BORDER }}>السابق</button>
                <span className="px-2">{page} / {meta.last_page}</span>
                <button disabled={page >= meta.last_page}
                  onClick={() => { const p = page + 1; setPage(p); load(p, search); }}
                  className="h-7 px-3 rounded border disabled:opacity-40"
                  style={{ borderColor: C_BORDER }}>التالي</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── modals ── */}
      {showAdd && (
        <EmployeeModal
          employee={null}
          departments={departments}
          onClose={() => setShowAdd(false)}
          onSaved={afterSaved}
        />
      )}
      {editTarget && (
        <EmployeeModal
          employee={editTarget}
          departments={departments}
          onClose={() => setEditTarget(null)}
          onSaved={afterSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          employee={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={afterDeleted}
        />
      )}

      {/* thin scrollbar for table */}
      <style>{`
        .users-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .users-scroll::-webkit-scrollbar-track { background: transparent; }
        .users-scroll::-webkit-scrollbar-thumb { background: #D5DEE4; border-radius: 999px; }
        .users-scroll::-webkit-scrollbar-thumb:hover { background: #BCC9D2; }
      `}</style>
    </div>
  );
}