import { useState } from "react";
import Portal from "./Portal";

const BRAND = "#024677";

const IcoX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function UploadCsvModal({ onClose, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [file,     setFile]     = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
          style={{ maxWidth: 520 }} dir="rtl">

          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#0246770D", color: BRAND }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={BRAND} strokeWidth="1.8" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
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

          {/* drop zone */}
          <div className="px-6 py-8">
            <label
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl
                cursor-pointer transition-colors py-12 px-4 text-center"
              style={{
                border: `2px dashed ${dragging ? BRAND : "#CBD5E1"}`,
                background: dragging ? "#EEF5FC" : "#F8FAFC",
              }}>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />

              {/* upload icon */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "#F1F5F9" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>

              {file ? (
                <>
                  <p className="text-sm font-bold" style={{ color: BRAND }}>{file.name}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>انقر لتغيير الملف</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold" style={{ color: "#1D293D" }}>اسحب وأفلت الملف هنا</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>أو انقر للاختيار من جهازك</p>
                  <p className="text-[11px]" style={{ color: "#b0bec5" }}>CSV أو Excel — xlsx, xls, csv</p>
                </>
              )}
            </label>
          </div>

          {/* format hint */}
          <div className="mx-6 mb-5 px-4 py-3 rounded-xl text-xs leading-relaxed"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#64748b" }}>
            <p className="font-bold mb-1" style={{ color: "#1D293D" }}>
              تنسيق الملف المطلوب يجب أن يحتوي على الأعمدة التالية:
            </p>
            <p>اسم الموظف، رقم الهوية، البريد الإلكتروني، المسمى الوظيفي</p>
          </div>

          {/* footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-[#F0F0F0] shrink-0">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-slate-50"
              style={{ color: "#64748b", borderColor: "#E1E1E1" }}>
              إلغاء
            </button>
            <button
              onClick={() => onUploaded?.()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: BRAND }}>
              رفع الملف
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}
