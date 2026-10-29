import { useState, useEffect } from "react";
import { fetchFields, createField, deleteField, fetchPrograms } from "../../services/api";

function fieldNames(f) {
  const ar = f?.name_translations?.ar
    ?? (typeof f?.name === "object" ? f.name?.ar : f?.name)
    ?? "";
  const en = f?.name_translations?.en
    ?? (typeof f?.name === "object" ? f.name?.en : "")
    ?? "";
  return { ar: String(ar).trim(), en: String(en).trim() };
}

function uniqueFields(list = []) {
  const seen = new Set();
  return list.filter(f => {
    const key = f?.id != null ? `id:${f.id}` : `name:${fieldNames(f).ar}`;
    if (!key || key === "name:" || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── icons ──────────────────────────────────────────────────────────────────
const IcoChev = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
    className={`transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcoPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoDots = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const IcoArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ── Add-category modal ─────────────────────────────────────────────────────
function AddCatModal({ onClose, onSaved }) {
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const submit = async () => {
    if (!nameAr.trim()) { setError("الاسم بالعربي مطلوب"); return; }
    setLoading(true); setError(null);
    try {
      const res = await createField({
        name: { ar: nameAr.trim(), en: nameEn.trim() || nameAr.trim() },
        status: 1,
      });
      onSaved(res?.data ?? { id: Date.now(), name: nameAr.trim(), programs_count: 0 });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[400px] p-6" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800">إضافة مجال جديد</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><IcoX /></button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">الاسم بالعربي <span className="text-red-400">*</span></label>
            <input autoFocus value={nameAr} onChange={e => setNameAr(e.target.value)}
              placeholder="مثال: القيادة والإدارة"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition text-right" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">الاسم بالإنجليزي</label>
            <input value={nameEn} onChange={e => setNameEn(e.target.value)}
              placeholder="e.g. Leadership & Management"
              dir="ltr"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition" />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3 text-right">{error}</p>}

        <div className="flex gap-2 justify-start">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
            إلغاء
          </button>
          <button onClick={submit} disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#024677" }}>
            {loading ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 3-dot menu ─────────────────────────────────────────────────────────────
function DotsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
        <IcoDots />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-28"
          onMouseLeave={() => setOpen(false)}>
          <button onClick={() => { onEdit?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition">
            <IcoEdit /> تعديل
          </button>
          <button onClick={() => { onDelete?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 transition">
            <IcoTrash /> حذف
          </button>
        </div>
      )}
    </div>
  );
}

// ── category row ───────────────────────────────────────────────────────────
function CategoryRow({ cat, programs, onToggle, onDelete, onAddProgram, onGo }) {
  const [open, setOpen] = useState(false);
  const names = fieldNames(cat);

  const toggle = () => {
    // no longer opening — ask parent to ensure programs are loaded first
    onToggle?.(cat);
    setOpen(o => !o);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-visible mb-3 bg-white">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3" dir="rtl">
        {/* right: name + count + chevron — clickable to expand */}
        <button onClick={toggle} className="flex items-center gap-2 min-w-0 flex-1 text-right">
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-800">{names.ar || cat.name}</span>
            {names.en && names.en !== names.ar && (
              <span className="block text-[11px] text-slate-400 mt-0.5" dir="ltr">{names.en}</span>
            )}
          </span>
          <span className="text-xs text-slate-400 shrink-0">({cat.programs_count ?? programs.length} برامج)</span>
          <IcoChev open={open} />
        </button>

        {/* left: add-program + dots */}
        <div className="flex items-center gap-2 shrink-0 mr-3">
          <button onClick={() => onAddProgram(cat)}
            className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition hover:opacity-90"
            style={{ background: "#0ABFBF" }}>
            <IcoPlus /> إضافة برنامج
          </button>
          <DotsMenu
            onDelete={() => onDelete(cat)}
          />
        </div>
      </div>

      {/* sub-rows */}
      {open && (
        <div className="border-t border-slate-100">
          {programs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">لا توجد برامج في هذا المجال</p>
          ) : (
            programs.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 last:border-0" dir="rtl">
                <span className="text-sm text-slate-700">{p.name?.ar ?? p.name}</span>
                <button onClick={() => onGo(p)}
                  className="flex items-center gap-1 text-xs text-teal-600 border border-teal-200 bg-teal-50 px-2.5 py-1 rounded-lg hover:bg-teal-100 transition">
                  الذهاب <IcoArrow />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────
export default function CategoriesPage({ onBack, onAddProgram, onGoProgram }) {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [showModal,  setShowModal]  = useState(false);
  // fieldId -> list of programs
  const [programsByField, setProgramsByField] = useState({});
  // cache of the full programs list (fetched lazily once)
  const [allPrograms, setAllPrograms] = useState(null);

  // load fields from API
  useEffect(() => {
    setLoading(true);
    fetchFields({ per_page: 100 })
      .then(res => {
        const list = uniqueFields(res?.data?.fields ?? []);
        setCategories(list.map(f => ({ ...f, programs: [] })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // fetch the full program list once, then map each program to its field by field_id
  const ensureAllPrograms = async () => {
    if (allPrograms) return allPrograms;
    try {
      const res = await fetchPrograms({ per_page: 100, page: 1 });
      const list = res?.data?.programs ?? [];
      setAllPrograms(list);
      return list;
    } catch { return []; }
  };

  // populate the given field's programs (name list) when it is expanded
  const handleToggle = async (field) => {
    if (programsByField[field.id]) return; // already loaded
    const list = await ensureAllPrograms();
    const matched = list.filter(p => {
      const fid = p.field_id ?? p.field?.id;
      const cid = p.category_id ?? p.category?.id;
      return fid === field.id || cid === field.category_id;
    });
    setProgramsByField(prev => ({ ...prev, [field.id]: matched }));
  };

  const handleSaved = (newField) =>
    setCategories(cs => [...cs, { ...newField, programs: [] }]);

  const handleDelete = async (cat) => {
    setCategories(cs => cs.filter(c => c.id !== cat.id));
    try { await deleteField(cat.id); } catch { /* restore if needed */ }
  };

  const filtered = categories.filter(c => {
    const { ar, en } = fieldNames(c);
    const q = search.toLowerCase();
    return ar.toLowerCase().includes(q) || en.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto bg-white" dir="ltr">
      <div className="w-full px-4 py-4" dir="rtl">

        {/* header */}
        <div className="flex items-center justify-between mb-4" dir="ltr">
          {/* left: action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl transition hover:opacity-90"
              style={{ background: "#024677" }}>
              <IcoPlus /> إضافة مجال جديد
            </button>
          </div>
          {/* right: breadcrumb */}
          <div className="flex items-center gap-2" dir="rtl">
            {onBack && (
              <>
                <button onClick={onBack}
                  className="text-slate-400 text-sm hover:text-teal-600 transition font-semibold">
                  الإعدادات
                </button>
                <span className="text-slate-300 text-sm">/</span>
              </>
            )}
            <span className="text-sm font-bold" style={{ color: "#024677" }}>إدارة المجالات والتصنيفات</span>
          </div>
        </div>

        {/* search */}
        <div className="relative mb-4">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcoSearch /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن مجال أو برنامج..."
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400"
          />
        </div>

        {/* list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ABFBF" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">لا توجد نتائج</p>
        ) : (
          filtered.map(cat => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              programs={programsByField[cat.id] ?? []}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onAddProgram={onAddProgram}
              onGo={onGoProgram}
            />
          ))
        )}
      </div>

      {/* add category modal */}
      {showModal && (
        <AddCatModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
