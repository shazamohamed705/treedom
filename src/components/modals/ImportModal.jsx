import { useState } from "react";
import Portal from "./Portal";

const BRAND = "#024677";
const GREEN = "#26AA57";

const IcoX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IMPORT_ROWS = [
  { id: 1, name: "أحمد محمد ماهر",       natId: "1023456789", email: "ahmedmo@gmail.com",         title: "أخصائي موارد بشرية" },
  { id: 2, name: "عبدالله أحمد سعد",     natId: "1023456789", email: "abdoahmed@gmail.com",       title: "أخصائي موارد بشرية" },
  { id: 3, name: "أكرم عبدالعزيز جمال",  natId: "1023456789", email: "akramabdelaziz@gmail.com",  title: "محاسب" },
  { id: 4, name: "مصطفى محمود عزالدين",  natId: "1023456789", email: "mustafa123@gmail.com",      title: "محاسب" },
  { id: 5, name: "كريم محمد السويفي",    natId: "1023456789", email: "kareemelswefy@gmail.com",   title: "مطور نظم" },
  { id: 6, name: "محمود رجب عبدالعزيز", natId: "1023456789", email: "mahmoudragab2@gmail.com",   title: "مطور نظم" },
  { id: 7, name: "علي السيد بدير",       natId: "1023456789", email: "alielssayed2547@gmail.com", title: "مطور نظم" },
];

const ENROLLED_COUNT  = 30;
const UNMATCHED_COUNT = 108;
const FILE_LABEL      = "unresolved_model_names.csv_6";

export default function ImportModal({ onClose, onConfirm }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    const allSel = IMPORT_ROWS.every(r => selected.has(r.id));
    setSelected(allSel ? new Set() : new Set(IMPORT_ROWS.map(r => r.id)));
  };

  const allChecked = IMPORT_ROWS.length > 0 && IMPORT_ROWS.every(r => selected.has(r.id));

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
          style={{ maxWidth: 680, maxHeight: "92vh" }} dir="rtl">

          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#0246770D", color: BRAND }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={BRAND} strokeWidth="1.8" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="15" x2="15" y2="9"/>
                </svg>
              </div>
              <div className="leading-tight">
                <span className="text-xs" style={{ color: "#94a3b8" }}>قائمة الموظفين / استيراد موظفين / </span>
                <span className="text-xs font-extrabold" style={{ color: BRAND }}>
                  استيراد موظفين (CSV / Excel)
                </span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400
                hover:bg-slate-100 transition shrink-0">
              <IcoX />
            </button>
          </div>

          {/* green info banner */}
          <div className="mx-5 mt-4 mb-3 px-4 py-3 rounded-xl flex items-start gap-3 shrink-0"
            style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: GREEN }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "#065F46" }}>
              تم التعرف على <strong>{ENROLLED_COUNT} موظف</strong> من ملف "
              <span className="font-semibold">{FILE_LABEL}</span>" و إضافتهم
              <br />
              <button className="underline font-semibold mt-0.5 text-xs" style={{ color: BRAND }}>
                {UNMATCHED_COUNT} لم يتم التعرف عليهم
              </button>
            </div>
          </div>

          {/* unmatched sub-header */}
          <div className="flex items-center justify-between px-5 py-2.5 shrink-0">
            <span className="text-sm font-extrabold" style={{ color: "#1D293D" }}>
              لم يتم التعرف عليهم ({UNMATCHED_COUNT})
            </span>
            <button onClick={toggleAll}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border transition hover:opacity-80"
              style={{ color: BRAND, borderColor: BRAND, background: "#EEF5FC" }}>
              تحديد الكل
            </button>
          </div>

          {/* table */}
          <div className="overflow-y-auto flex-1 border-t border-[#F0F0F0]">
            <table className="w-full text-sm" style={{ minWidth: 520 }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND, width: 60 }}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll}
                        className="w-4 h-4 cursor-pointer accent-[#024677] rounded" />
                      <span>تحديد</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND }}>اسم الموظف</th>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND }}>رقم الهوية</th>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND }}>البريد الإلكتروني</th>
                  <th className="px-4 py-3 text-right text-xs font-bold" style={{ color: BRAND }}>المسمى الوظيفي</th>
                </tr>
              </thead>
              <tbody>
                {IMPORT_ROWS.map((r, i) => {
                  const checked = selected.has(r.id);
                  return (
                    <tr key={r.id} onClick={() => toggle(r.id)}
                      className="cursor-pointer border-b border-[#F5F5F5] last:border-0 transition-colors"
                      style={{ background: checked ? "#EEF5FC" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={checked} onChange={() => toggle(r.id)}
                          onClick={ev => ev.stopPropagation()}
                          className="w-4 h-4 cursor-pointer accent-[#024677] rounded" />
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#1D293D" }}>{r.name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748b", direction: "ltr", textAlign: "right" }}>{r.natId}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748b", direction: "ltr", textAlign: "right" }}>{r.email}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{r.title}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F0F0F0] shrink-0">
            {/* upload another */}
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold
              border transition hover:bg-slate-50"
              style={{ color: "#64748b", borderColor: "#E1E1E1" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              رفع ملف آخر
            </button>

            {/* interact — disabled */}
            <button disabled
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border opacity-40 cursor-not-allowed"
              style={{ color: "#64748b", borderColor: "#E1E1E1" }}>
              تفاعل
            </button>

            {/* confirm */}
            <button
              onClick={() => onConfirm?.()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: BRAND }}>
              تأكيد الاستيراد ({selected.size} موظف)
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}
