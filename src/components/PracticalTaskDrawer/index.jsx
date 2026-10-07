import { useState, useRef } from "react";

const BRAND = "#024677";

const Ico = ({ d, size = 14, sw = 1.8, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const IcoX      = ({ size = 13 }) => <Ico size={size} sw={2.2} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoUpload = ({ size = 20 }) => <Ico size={size} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />;

const FILE_TYPES = ["PDF", "ZIP", "Figma URL", "GitHub URL"];

function Field({ label, children }) {
  return (
    <div className="space-y-1" dir="rtl">
      <label className="block text-[11px] font-semibold" style={{ color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = `w-full text-[12px] px-3 rounded-md border border-[#e5e7eb] bg-white
  focus:outline-none focus:ring-1 focus:ring-[#024677]/30 focus:border-[#024677]
  placeholder:text-slate-300 transition`;

export default function PracticalTaskDrawer({ open, onClose, onSave }) {
  const fileRef = useRef();

  const [title,        setTitle]        = useState("");
  const [instructions, setInstructions] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [passMark,     setPassMark]     = useState(30);
  const [dueDate,      setDueDate]      = useState("");
  const [allowedTypes, setAllowedTypes] = useState(["PDF", "ZIP"]);

  const toggleType = (t) =>
    setAllowedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = () => {
    onSave?.({ title, instructions, uploadedFile, passMark, dueDate, allowedTypes });
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* overlay */}
      <div className="flex-1 bg-black/25" onClick={onClose} />

      {/* panel */}
      <div className="flex flex-col bg-white h-full overflow-hidden"
        style={{
          width: "clamp(480px, 55vw, 720px)",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.07)",
        }}>

        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0" dir="rtl">
          <h2 className="text-[14px] font-semibold" style={{ color: "#1f2937" }}>
            إنشاء تاسك عملي
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-slate-400">
            <IcoX size={13} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* عنوان التاسك */}
          <Field label="عنوان التاسك / المشروع">
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="مثال: واجب كتابة مقال باللغة الإنجليزية"
              className={`${inputCls} h-9`} dir="rtl" />
          </Field>

          {/* تعليمات */}
          <Field label="تعليمات المشروع">
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
              placeholder="اكتب التعليمات بالتفصيل..."
              rows={4}
              className={`${inputCls} resize-none py-2`} dir="rtl" />
          </Field>

          {/* مرفقات المدرب */}
          <Field label="مرفقات المدرب">
            <div
              className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 py-7 cursor-pointer hover:bg-slate-50 transition-colors"
              style={{ borderColor: "#d1d5db" }}
              onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" className="hidden"
                onChange={e => setUploadedFile(e.target.files?.[0] ?? null)} />
              <IcoUpload size={22} stroke="#94a3b8" />
              {uploadedFile
                ? <p className="text-[12px] font-medium" style={{ color: BRAND }}>{uploadedFile.name}</p>
                : <p className="text-[11px]" style={{ color: "#94a3b8" }}>PDF, DOC, ZIP, 20 ميغابايت</p>
              }
            </div>
          </Field>

          {/* الوزن في السكور النهائي */}
          <div className="space-y-1" dir="rtl">
            <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>
              الوزن في السكور النهائي
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[12px]" style={{ color: "#64748b" }}>% من مجموع الدرجة النهائية</span>
              <input type="number" value={passMark}
                onChange={e => setPassMark(Number(e.target.value))}
                className="w-16 text-[13px] font-bold text-center h-9 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#024677]"
                style={{ color: BRAND }} />
            </div>
          </div>

          {/* الموعد النهائي للتسليم */}
          <Field label="الموعد النهائي للتسليم">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className={`${inputCls} h-9`} dir="rtl" />
          </Field>

          {/* صيغ الملفات المقبولة */}
          <div className="space-y-2" dir="rtl">
            <p className="text-[11px] font-semibold" style={{ color: "#374151" }}>
              صيغ الملفات المقبولة
            </p>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPES.map(t => (
                <label key={t}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-[12px] font-medium select-none"
                  style={{
                    borderColor: allowedTypes.includes(t) ? BRAND : "#e5e7eb",
                    background:  allowedTypes.includes(t) ? "#f0f6ff" : "#fff",
                    color:       allowedTypes.includes(t) ? BRAND : "#374151",
                  }}>
                  <input type="checkbox" className="hidden"
                    checked={allowedTypes.includes(t)}
                    onChange={() => toggleType(t)} />
                  {/* checkmark */}
                  <span
                    className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      borderColor: allowedTypes.includes(t) ? BRAND : "#d1d5db",
                      background:  allowedTypes.includes(t) ? BRAND : "#fff",
                    }}>
                    {allowedTypes.includes(t) && (
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                        <polyline points="1.5 6 4.5 9 10.5 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {t}
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* footer */}
        <div className="shrink-0 px-4 py-3 border-t border-[#f0f0f0] flex items-center justify-between gap-3" dir="rtl">
          <button type="button" onClick={onClose}
            className="text-[12px] font-medium px-4 py-2 rounded-md border border-[#e5e7eb] hover:bg-slate-50 transition-colors"
            style={{ color: "#64748b" }}>
            إلغاء
          </button>
          <button type="button" onClick={handleSave}
            className="text-[12px] font-bold px-5 py-2 rounded-md text-white hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}>
            حفظ التاسك
          </button>
        </div>
      </div>
    </div>
  );
}
