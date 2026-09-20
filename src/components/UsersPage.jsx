import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCoaches, fetchCoachPermissions, deleteCoach, fetchOwnedTrainees, createOwnedTrainee, deleteOwnedTrainee } from "../services/api";
import { normalizePhone, isPhoneValid, PHONE_ERROR_AR } from "../services/registerDraft";
import { useToast } from "./ToastProvider";
import Pagination from "./Pagination";

const ROLE_ALL   = "الكل — الأدوار";
const STATUS_ALL = "الكل — الحالة";
const STATUS_OPTIONS = [STATUS_ALL, "نشط", "غير نشط"];

const ROLE_COLORS = {
  coach_add_edit:  "#f59e0b",
  coach_view_only: "#14b8a6",
  super_admin:     "#6366f1",
  admin:           "#6366f1",
};

const FALLBACK_ROWS = [
  { label: "البرامج التدريبية (عرض)",        perms: [true,       true,       true,  true]  },
  { label: "البرامج التدريبية (إضافة/تعديل)", perms: ["approval", false,      true,  true]  },
  { label: "إدارة الجلسات",                   perms: [true,       true,       true,  true]  },
  { label: "عرض سجلات الحضور",                perms: [true,       true,       true,  true]  },
  { label: "إدارة المدربين",                   perms: [false,      false,      true,  true]  },
  { label: "الإعدادات العامة",                 perms: [false,      false,      true,  true]  },
  { label: "إدارة الصلاحيات والمستخدمين",      perms: [false,      false,      false, true]  },
  { label: "الماليات",                         perms: [false,      false,      false, true]  },
];
const FALLBACK_COLS = ["مدرب - إضافة وتعديل", "مدرب - عرض فقط", "الأمن", "Super Admin"];

function roleColor(key, name = "") {
  if (ROLE_COLORS[key]) return ROLE_COLORS[key];
  const s = `${key} ${name}`.toLowerCase();
  if (s.includes("super") || s.includes("admin")) return "#6366f1";
  if (s.includes("add") || s.includes("edit") || s.includes("إضافة")) return "#f59e0b";
  if (s.includes("view") || s.includes("عرض")) return "#14b8a6";
  return "#024677";
}

function asList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw.coaches)) return raw.coaches;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

function permLabel(p) {
  if (!p) return "";
  if (typeof p === "string") return p;
  return p.name ?? p.label ?? p.key ?? p.permission ?? "";
}

function pickRoles(permData) {
  const assignable = permData?.assignable_roles ?? [];
  if (assignable.length) return assignable;
  return (permData?.roles ?? []).filter(r => r.assignable_to_coach !== false);
}

function findRole(coach, roles) {
  if (coach.role && (coach.role.name || coach.role.key)) return coach.role;
  const id  = coach.role_id ?? coach.role?.id;
  const key = coach.role_key ?? coach.role?.key;
  return roles.find(r => (id != null && r.id === id) || (key && r.key === key)) ?? null;
}

function normaliseCoach(c, roles) {
  const role = findRole(c, roles);
  const roleName = role?.name ?? c.role_name ?? "مدرب";
  const roleKey  = role?.key ?? c.role_key ?? "";
  const rawPerms = c.permissions ?? role?.permissions ?? [];
  const perms = (Array.isArray(rawPerms) ? rawPerms : []).map(permLabel).filter(Boolean);
  const active = c.is_active != null
    ? !!c.is_active
    : (c.status === "active" || !!(c.sessions_count > 0 || c.has_active_sessions));
  const created = c.created_at ?? c.join_date ?? "";
  return {
    id:     c.id,
    name:   c.name ?? "—",
    phone:  c.phone ?? "",
    email:  c.email ?? "",
    date:   typeof created === "string" ? created.slice(0, 10) : "",
    status: active ? "نشط" : "غير نشط",
    role:   roleName,
    roleKey,
    roleColor: roleColor(roleKey, roleName),
    permissions: perms,
  };
}

async function fetchAllCoaches(search) {
  const first = await fetchCoaches({ per_page: 50, page: 1, search: search || undefined });
  const data  = first?.data ?? first ?? {};
  const list  = [...asList(data.coaches ?? data)];
  const totalPages = Number(data.pagination?.total_pages ?? data.meta?.last_page ?? 1) || 1;
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: Math.min(totalPages - 1, 9) }, (_, i) =>
        fetchCoaches({ per_page: 50, page: i + 2, search: search || undefined }).catch(() => null)
      )
    );
    rest.forEach(r => {
      const more = asList(r?.data?.coaches ?? r?.data);
      list.push(...more);
    });
  }
  return list;
}

function PermCell({ value }) {
  if (value === true) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5"/>
      <polyline points="7 12 10 15 17 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (value === "approval") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#fef9c3" stroke="#eab308" strokeWidth="1.5"/>
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#eab308" fontWeight="bold">!</text>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5"/>
      <line x1="8" y1="8" x2="16" y2="16" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="8" x2="8" y2="16" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} dir="rtl"
        className="appearance-none border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm text-slate-600 bg-white focus:outline-none focus:border-teal-400 transition cursor-pointer">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </div>
  );
}

function PermissionsMatrix() {
  return (
    <div dir="rtl">
      <div className="rounded-xl px-4 py-2.5 mb-4 text-right"
        style={{ background: "#F0F9FF", borderTop: "0.8px solid #BAE6FD" }}>
        <p className="text-xs text-slate-500">
          هذه المصفوفة للعرض التوضيحي فقط. الصلاحيات مبرمجة مسبقاً في النظام ولا يمكن تعديلها.
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "#024677" }}>
              <th className="text-right py-2 px-4 text-xs font-bold text-white">القسم / الصلاحية</th>
              {FALLBACK_COLS.map(col => (
                <th key={col} className="text-center py-2 px-3 text-xs font-bold text-white whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FALLBACK_ROWS.map((row, i) => (
              <tr key={row.label + i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="py-2 px-4 text-xs text-slate-700 font-medium border-b border-slate-100">
                  {row.label}
                </td>
                {row.perms.map((p, j) => (
                  <td key={j} className="py-2 px-3 text-center border-b border-slate-100">
                    <div className="flex justify-center"><PermCell value={p} /></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-start gap-6 mt-4 flex-wrap">
        {[
          { icon: <PermCell value={true} />,       label: "صلاحية كاملة"                          },
          { icon: <PermCell value="approval" />,   label: "صلاحية مشروطة بموافقة الأمن"            },
          { icon: <PermCell value={false} />,      label: "غير متاح"                              },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.icon}
            <span className="text-xs text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTable({ users, loading, onDeleted }) {
  const navigate   = useNavigate();
  const showToast  = useToast();
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState(ROLE_ALL);
  const [statFilter, setStatFilter] = useState(STATUS_ALL);
  const [page,       setPage]       = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const PAGE_SIZE = 10;
  const roleOptions = [ROLE_ALL, ...Array.from(new Set(users.map(u => u.role).filter(Boolean)))];

  const filtered = users.filter(u => {
    const q = search.trim();
    const matchSearch = !q || u.name.includes(q) || u.email.includes(q);
    const matchRole   = roleFilter === ROLE_ALL   || u.role   === roleFilter;
    const matchStatus = statFilter === STATUS_ALL || u.status === statFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const visible    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, roleFilter, statFilter]);

  const removeUser = async (id) => {
    if (!window.confirm("هل تريد حذف هذا المدرب؟")) return;
    setDeletingId(id);
    try {
      await deleteCoach(id);
      showToast("تم حذف المدرب", "success");
      onDeleted?.(id);
    } catch (err) {
      showToast(err.message || "تعذر حذف المدرب", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap" dir="ltr">
        <FilterSelect value={statFilter}  onChange={setStatFilter}  options={STATUS_OPTIONS} />
        <FilterSelect value={roleFilter}  onChange={setRoleFilter}  options={roleOptions}   />
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن مدرب بالاسم أو البريد الإلكتروني" dir="rtl"
            className="w-full border border-slate-200 rounded-xl px-4 py-2 pr-9 text-sm focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400" />
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto" dir="rtl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["الاسم", "البريد الإلكتروني", "تاريخ الإضافة", "إجراء", "الحالة", "الدور والصلاحيات"].map(h => (
                <th key={h} className="text-right py-3 px-4 text-xs font-bold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-slate-400">جاري التحميل...</td></tr>
            )}
            {!loading && visible.map(u => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                <td className="py-3 px-4">
                  <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{u.phone}</p>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500" dir="ltr">{u.email}</td>
                <td className="py-3 px-4 text-xs text-slate-500">{u.date || "—"}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem("viewTrainerId", u.id);
                        navigate("/dashboard/trainer-profile");
                      }}
                      className="flex items-center gap-1 text-xs text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition">
                      عرض
                    </button>
                    <button onClick={() => removeUser(u.id)} disabled={deletingId === u.id}
                      className="flex items-center gap-1 text-xs text-red-500 border border-red-100 px-2.5 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                      {deletingId === u.id ? "..." : "حذف"}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                    ${u.status === "نشط" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs font-semibold" style={{ color: u.roleColor }}>
                    {u.role}
                  </span>
                  {u.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {u.permissions.slice(0, 3).map(p => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                          {p}
                        </span>
                      ))}
                      {u.permissions.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400">
                          +{u.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-slate-400">لا توجد نتائج</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </>
  );
}

function ownedList(res) {
  const data = res?.data ?? {};
  const raw = data.trainees ?? data.students ?? data.owned_trainees ?? data.items ?? data;
  return Array.isArray(raw) ? raw : [];
}

function normaliseStudent(s) {
  const created = s.created_at ?? s.join_date ?? "";
  const active = s.is_active != null
    ? !!s.is_active
    : String(s.status ?? "").toLowerCase() !== "inactive";
  return {
    id:     s.id,
    name:   s.name ?? "—",
    email:  s.email ?? "",
    phone:  s.phone ?? "",
    date:   typeof created === "string" ? created.slice(0, 10) : "",
    status: active ? "نشط" : "غير نشط",
  };
}

function AddStudentForm({ onCancel, onCreated }) {
  const showToast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const phoneOk = !form.phone || isPhoneValid(form.phone);
  const canSave = form.name.trim() && form.email.trim() && form.phone && phoneOk && !saving;

  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone) {
      setError("الاسم والبريد ورقم الجوال مطلوبون");
      return;
    }
    if (!isPhoneValid(form.phone)) {
      setError(PHONE_ERROR_AR);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await createOwnedTrainee({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: normalizePhone(form.phone),
        country_code: "966",
      });
      const data = res?.data ?? {};
      const student = normaliseStudent({
        ...data,
        name: data.name ?? form.name,
        email: data.email ?? form.email,
        phone: data.phone ?? form.phone,
      });
      setCreated({
        ...student,
        temporary_password: data.temporary_password ?? data.password ?? "",
      });
      onCreated?.(student);
      showToast(res?.message || "تم إضافة الطالب", "success");
    } catch (err) {
      setError(err.message || "تعذر إضافة الطالب");
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <div className="border border-slate-200 rounded-xl p-5 mb-4" dir="rtl" style={{ background: "#F8FAFC" }}>
        <p className="text-sm font-bold" style={{ color: "#024677" }}>تم إنشاء حساب الطالب</p>
        <p className="text-xs text-slate-500 mt-1">
          الطالب <b className="text-slate-700">{created.name}</b> أصبح خاصًا بهذه الهيئة.
        </p>
        {created.temporary_password && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">كلمة المرور المؤقتة — انسخها الآن</p>
            <p className="text-sm font-bold tracking-wide" dir="ltr" style={{ color: "#024677" }}>
              {created.temporary_password}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-sm font-semibold text-white px-5 py-2 rounded-xl hover:opacity-90"
          style={{ background: "#024677" }}
        >
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4" dir="rtl">
      <div className="px-4 py-3 border-b border-slate-100" style={{ background: "#F8FAFC" }}>
        <p className="text-sm font-bold text-slate-800">إضافة طالب خاص بالهيئة</p>
        <p className="text-xs text-slate-400 mt-0.5">الاسم والبريد والجوال فقط — الحساب يتسجل مباشرة على الهيئة</p>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-semibold text-slate-700">الاسم بالكامل <span className="text-red-400">*</span></span>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثال: أحمد سعد الزهراني"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-right outline-none focus:border-teal-400" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">البريد الإلكتروني <span className="text-red-400">*</span></span>
          <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="user@treedom.sa" dir="ltr"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-400" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">رقم الجوال <span className="text-red-400">*</span></span>
          <input value={form.phone} onChange={e => set("phone", normalizePhone(e.target.value))}
            inputMode="numeric" maxLength={14} placeholder="5XXXXXXXX" dir="ltr"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#024677]/10 ${
              form.phone && !phoneOk ? "border-red-400" : "border-slate-200 focus:border-teal-400"
            }`} />
          {form.phone && !phoneOk && <span className="text-xs text-red-500">{PHONE_ERROR_AR}</span>}
        </label>
      </div>
      {error && <p className="px-4 text-xs text-red-500 text-right">{error}</p>}
      <div className="flex items-center gap-3 px-4 py-4" dir="ltr">
        <button type="button" onClick={save} disabled={!canSave}
          className="text-sm font-bold text-white px-5 py-2.5 rounded-xl disabled:opacity-50"
          style={{ background: "#024677" }}>
          {saving ? "جارِ الحفظ..." : "حفظ وإضافة الطالب"}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-semibold text-slate-600 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
          إلغاء
        </button>
      </div>
    </div>
  );
}

function StudentsTable({ students, loading, onDeleted }) {
  const showToast = useToast();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const q = search.trim().toLowerCase();
  const list = students.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone || "").includes(q)
  );

  const remove = async (id) => {
    if (!window.confirm("هل تريد حذف هذا الطالب من الهيئة؟")) return;
    setDeletingId(id);
    try {
      await deleteOwnedTrainee(id);
      showToast("تم حذف الطالب", "success");
      onDeleted?.(id);
    } catch (err) {
      showToast(err.message || "تعذر حذف الطالب", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="relative mb-4">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن طالب بالاسم أو البريد أو الجوال" dir="rtl"
          className="w-full border border-slate-200 rounded-xl px-4 py-2 pr-9 text-sm focus:outline-none focus:border-teal-400 placeholder:text-slate-400" />
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto" dir="rtl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["الاسم", "البريد الإلكتروني", "الجوال", "تاريخ الإضافة", "الحالة", "إجراء"].map(h => (
                <th key={h} className="text-right py-3 px-4 text-xs font-bold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-slate-400">جاري التحميل...</td></tr>
            )}
            {!loading && list.map(s => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                <td className="py-3 px-4 text-sm font-semibold text-slate-800">{s.name}</td>
                <td className="py-3 px-4 text-xs text-slate-500" dir="ltr">{s.email || "—"}</td>
                <td className="py-3 px-4 text-xs text-slate-500" dir="ltr">{s.phone || "—"}</td>
                <td className="py-3 px-4 text-xs text-slate-500">{s.date || "—"}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    s.status === "نشط" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  }`}>{s.status}</span>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => remove(s.id)} disabled={deletingId === s.id}
                    className="text-xs text-red-500 border border-red-100 px-2.5 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50">
                    {deletingId === s.id ? "..." : "حذف"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm text-slate-400">
                  لا يوجد طلاب خاصون بهذه الهيئة بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function UsersPage({ onBack, onAddUser, orgName }) {
  const showToast = useToast();
  const [tab,      setTab]      = useState("users");
  const [users,    setUsers]    = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    let on = true;
    setLoading(true);
    Promise.all([
      fetchAllCoaches(""),
      fetchCoachPermissions().catch(() => null),
    ])
      .then(([coaches, permRes]) => {
        if (!on) return;
        const roles = pickRoles(permRes?.data ?? {});
        setUsers(coaches.map(c => normaliseCoach(c, roles)));
      })
      .catch(() => { if (on) setUsers([]); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  useEffect(() => {
    if (tab !== "students") return;
    let on = true;
    setStudentsLoading(true);
    fetchOwnedTrainees({ per_page: 100 })
      .then(res => {
        if (on) setStudents(ownedList(res).map(normaliseStudent));
      })
      .catch(err => {
        if (!on) return;
        setStudents([]);
        showToast(err.message || "تعذر تحميل طلاب الهيئة", "error");
      })
      .finally(() => { if (on) setStudentsLoading(false); });
    return () => { on = false; };
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 overflow-y-auto bg-white" dir="ltr">
      <div className="w-full px-5 py-4" dir="rtl">

        <div className="flex items-center justify-between mb-5" dir="ltr">
          <button
            onClick={() => {
              if (tab === "students") {
                setAddingStudent(true);
                return;
              }
              if (tab === "users") onAddUser?.();
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl transition hover:opacity-90"
            style={{ background: "#024677", visibility: tab === "perms" ? "hidden" : "visible" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {tab === "students" ? "إضافة طالب" : "إضافة مستخدم جديد"}
          </button>
          <div className="flex items-center gap-2" dir="rtl">
            <button onClick={onBack}
              className="text-slate-400 text-sm hover:text-teal-600 transition font-semibold">
              الإعدادات
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold" style={{ color: "#024677" }}>
              الصلاحيات والمستخدمين
            </span>
          </div>
        </div>

        <div dir="ltr" className="flex justify-start mb-5">
          <div className="flex items-center rounded-xl p-1.5" dir="rtl"
            style={{ background: "#024677" }}>
            {[
              { key: "users", label: orgName ? `مدربين ${orgName}` : "المدربون",        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { key: "students", label: "طلاب الهيئة",   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
              { key: "perms", label: "مصفوفة الصلاحيات",  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); if (t.key !== "students") setAddingStudent(false); }}
                className={`flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg transition
                  ${tab === t.key ? "bg-white text-[#024677]" : "text-white/80 hover:text-white"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "users" && (
          <UsersTable
            users={users}
            loading={loading}
            onDeleted={id => setUsers(p => p.filter(u => u.id !== id))}
          />
        )}
        {tab === "students" && (
          <>
            {addingStudent ? (
              <AddStudentForm
                onCancel={() => setAddingStudent(false)}
                onCreated={(student) => {
                  if (student?.id) setStudents(prev => [student, ...prev.filter(s => s.id !== student.id)]);
                }}
              />
            ) : (
              <StudentsTable
                students={students}
                loading={studentsLoading}
                onDeleted={id => setStudents(p => p.filter(s => s.id !== id))}
              />
            )}
          </>
        )}
        {tab === "perms" && <PermissionsMatrix />}
      </div>
    </div>
  );
}
