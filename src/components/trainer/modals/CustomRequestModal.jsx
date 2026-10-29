import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/* ── tiny icon helper ── */
const Ico = ({ d, size = 16, sw = 1.8, fill = "none", stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const IcoClose  = () => <Ico d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoUpload = () => <Ico size={28} sw={1.5} stroke="#94a3b8"
  d={<><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>} />;
const IcoBook   = () => <Ico size={15} sw={1.8}
  d={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>} />;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CustomRequestModal                                                         */
/*                                                                             */
/*  Props:                                                                     */
/*    open       – boolean                                                     */
/*    onClose    – () => void                                                  */
/*    program    – optional { title, category } for breadcrumb pre-fill       */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function CustomRequestModal({ open, onClose, program = null }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [trainees,    setTrainees]    = useState("");
  const [timeline,    setTimeline]    = useState("");
  const [files,       setFiles]       = useState([]);
  const [dragOver,    setDragOver]    = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const fileRef = useRef();

  /* reset form whenever modal opens */
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setTrainees("");
      setTimeline("");
      setFiles([]);
      setSubmitted(false);
    }
  }, [open]);

  /* lock body scroll while open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  /* ── file helpers ── */
  const ACCEPTED = ["application/pdf", "image/", "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
  const accept = (f) => ACCEPTED.some(t => f.type.startsWith(t));

  const addFiles = (list) => {
    const valid = [...list].filter(accept);
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  /* ── submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !trainees || !timeline.trim()) return;
    /* TODO: wire to real API */
    console.log("custom request →", { title, description, trainees, timeline, files });
    setSubmitted(true);
  };

  /* ── backdrop click ── */
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* ── success screen ── */
  if (submitted) return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,42,74,0.55)", backdropFilter: "blur(3px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-10 flex flex-col items-center gap-4 text-center"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-3xl">✅</div>
        <h2 className="text-lg font-extrabold text-slate-800">تم إرسال الطلب بنجاح!</h2>
        <p className="text-sm text-slate-500">سيتواصل معك فريقنا في أقرب وقت ممكن لمناقشة تفاصيل البرنامج المخصص.</p>
        <button
          onClick={onClose}
          className="mt-2 px-8 py-2.5 rounded-xl bg-[#0f2a4a] text-white text-sm font-bold hover:bg-[#1a3a5c] transition"
        >
          إغلاق
        </button>
      </div>
    </div>,
    document.body
  );

  /* ── main modal ── */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,42,74,0.55)", backdropFilter: "blur(3px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] mx-4 flex flex-col"
        style={{ maxHeight: "90vh" }}
        dir="rtl"
      >

        {/* ── header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            {/* breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
              <IcoBook />
              <span className="text-[#31AFEA] font-semibold">البرامج التدريبية</span>
              <span>/</span>
              <span className="font-medium text-slate-600">طلب برنامج مخصص</span>
            </div>
            {/* sub-title */}
            {program && (
              <p className="text-[11px] text-slate-400">
                استناداً إلى برنامج{" "}
                <span className="font-semibold text-slate-600">{program.title}</span>
                {program.category && (
                  <> المقدم من فئة <span className="font-semibold text-slate-600">{typeof program.category === 'object' ? program.category?.name : program.category}</span></>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition mt-0.5"
            aria-label="إغلاق"
          >
            <IcoClose />
          </button>
        </div>

        {/* ── scrollable body ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

          {/* عنوان التخصيص */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-700">
              عنوان التخصيص المطلوب <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="مثل: تسويق قطاع السيارات"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 outline-none focus:border-[#31AFEA] focus:ring-2 focus:ring-[#31AFEA]/10 transition"
            />
          </div>

          {/* وصف تفصيلي */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-700">وصف تفصيلي للطلب</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="اشرح لفريق التدريب ما يحتاجه موظفو شركتك بالتفصيل وبالسياق الكافي"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 outline-none focus:border-[#31AFEA] focus:ring-2 focus:ring-[#31AFEA]/10 transition resize-none"
            />
          </div>

          {/* عدد المتدربين */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-700">
              عدد المتدربين <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={trainees}
              onChange={e => setTrainees(e.target.value)}
              required
              placeholder="أدخل عدد المتدربين"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 outline-none focus:border-[#31AFEA] focus:ring-2 focus:ring-[#31AFEA]/10 transition"
            />
          </div>

          {/* الجدول الزمني */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-700">
              الجدول الزمني المتوقع <span className="text-red-500">*</span>
            </label>
            <input
              value={timeline}
              onChange={e => setTimeline(e.target.value)}
              required
              placeholder="مثال: خلال شهر"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 outline-none focus:border-[#31AFEA] focus:ring-2 focus:ring-[#31AFEA]/10 transition"
            />
          </div>

          {/* رفع ملف */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-700">ارفق ملف (اختياري)</label>

            {/* drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-7 cursor-pointer transition
                ${dragOver ? "border-[#31AFEA] bg-[#31AFEA]/5" : "border-slate-200 bg-slate-50 hover:border-[#31AFEA]/50 hover:bg-[#31AFEA]/5"}`}
            >
              <IcoUpload />
              <p className="text-[13px] text-slate-500">
                اسحب الملفات هنا أو{" "}
                <span className="text-[#31AFEA] font-semibold underline underline-offset-2">اختر الملفات</span>
              </p>
              <p className="text-[11px] text-slate-400">PDF، صور، PowerPoint</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,image/*"
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />

            {/* file chips */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {files.map(f => (
                  <span key={f.name}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[11px] text-slate-600 font-medium">
                    📎 {f.name}
                    <button type="button" onClick={() => removeFile(f.name)}
                      className="text-slate-400 hover:text-red-500 transition ml-0.5">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </form>

        {/* ── footer ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 shrink-0" dir="rtl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-[#0f2a4a] text-white text-[13px] font-bold hover:bg-[#1a3a5c] transition disabled:opacity-50"
            disabled={!title.trim() || !trainees || !timeline.trim()}
          >
            ارسال الطلب
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
