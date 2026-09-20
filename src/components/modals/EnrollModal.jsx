import { useState } from "react";
import Portal from "./Portal";

const BRAND = "#024677";

const I = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const IcoGrad   = ({ size = 13 }) => <I size={size} d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;
const IcoUsers  = ({ size = 13 }) => <I size={size} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoSearch = ({ size = 14 }) => <I size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoFilter = ({ size = 14 }) => <I size={size} d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} />;
const IcoX      = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ALL_EMPLOYEES = [
  { id: 1,  name: "أحمد محمد ماهر",       email: "ahmedmo@gmail.com",          title: "أخصائي موارد بشرية" },
  { id: 2,  name: "عبدالله أحمد سعد",     email: "abdoahmed@gmail.com",        title: "أخصائي موارد بشرية" },
  { id: 3,  name: "أكرم عبدالعزيز جمال",  email: "akramabdelaziz@gmail.com",   title: "محاسب" },
  { id: 4,  name: "مصطفى محمود عزالدين",  email: "mustafa123@gmail.com",       title: "محاسب" },
  { id: 5,  name: "كريم محمد السويفي",    email: "kareemelswefy@gmail.com",    title: "محاسب" },
  { id: 6,  name: "محمود رجب عبدالعزيز", email: "mahmoudragab2@gmail.com",    title: "محاسب" },
  { id: 7,  name: "علي السيد بدير",       email: "alielssayed2547@gmail.com",  title: "محاسب" },
  { id: 8,  name: "مصطفى محمود عزالدين",  email: "mustafa456@gmail.com",       title: "محاسب" },
  { id: 9,  name: "مصطفى محمود عزالدين",  email: "mustafa789@gmail.com",       title: "محاسب" },
  { id: 10, name: "نورة سعد الحربي",       email: "noura@gmail.com",            title: "مختص تسويق رقمي" },
  { id: 11, name: "خالد عبدالرحمن فهد",   email: "khaled@gmail.com",           title: "مطور برمجيات" },
];

export default function EnrollModal({ onClose, onConfirm }) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(new Set([2, 7]));

  const filtered = ALL_EMPLOYEES.filter(e =>
    !search.trim() || e.name.includes(search.trim()) || e.email.includes(search.trim())
  );

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    const allSel = filtered.every(e => selected.has(e.id));
    setSelected(prev => {
      const next = new Set(prev);
      filtered.forEach(e => allSel ? next.delete(e.id) : next.add(e.id));
      return next;
    });
  };

  const allChecked = filtered.length > 0 && filtered.every(e => selected.has(e.id));

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
          style={{ maxWidth: 660, maxHeight: "90vh" }} dir="rtl">

          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#0246770D", color: BRAND }}>
                <IcoGrad />
              </div>
              <div className="leading-tight">
                <span className="text-xs" style={{ color: "#94a3b8" }}>البرامج المسجلة / تفاصيل البرنامج / </span>
                <span className="text-xs font-extrabold" style={{ color: BRAND }}>تسجيل موظف</span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400
                hover:bg-slate-100 transition shrink-0">
              <IcoX />
            </button>
          </div>

          {/* sub-header: title + search */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0F0F0] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#0246770D", color: BRAND }}>
                <IcoUsers />
              </div>
              <span className="text-sm font-extrabold" style={{ color: BRAND }}>قائمة الموظفين</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border
                border-slate-200 text-slate-400 hover:text-[#024677] hover:border-[#024677]/30 transition">
                <IcoFilter />
              </button>
              <div className="relative">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="بحث عن موظف"
                  className="pr-3 pl-8 py-2 text-xs rounded-xl border border-slate-200 w-44
                    focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                    transition placeholder:text-slate-300"
                  dir="rtl" />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <IcoSearch />
                </span>
              </div>
            </div>
          </div>

          {/* table */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm" style={{ minWidth: 460 }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND, width: 56 }}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll}
                        className="w-4 h-4 cursor-pointer accent-[#024677] rounded" />
                      <span>تحديد</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND }}>اسم الموظف</th>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND }}>البريد</th>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND }}>المسمى الوظيفي</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => {
                  const checked = selected.has(e.id);
                  return (
                    <tr key={e.id} onClick={() => toggle(e.id)}
                      className="cursor-pointer border-b border-[#F5F5F5] last:border-0 transition-colors"
                      style={{ background: checked ? "#EEF5FC" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={checked} onChange={() => toggle(e.id)}
                          onClick={ev => ev.stopPropagation()}
                          className="w-4 h-4 cursor-pointer accent-[#024677] rounded" />
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#1D293D" }}>{e.name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748b", direction: "ltr", textAlign: "right" }}>{e.email}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{e.title}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-sm text-slate-400">لا توجد نتائج</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F0F0F0] shrink-0">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-slate-50"
              style={{ color: "#64748b", borderColor: "#E1E1E1" }}>
              إلغاء
            </button>
            <button
              onClick={() => { if (selected.size > 0) { onConfirm?.(Array.from(selected)); } }}
              disabled={selected.size === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition
                hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: BRAND }}>
              تسجيل الموظفين
              {selected.size > 0 && <span className="mr-1.5 text-xs opacity-80">({selected.size})</span>}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}
