import { useState } from "react";

function IcoX() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── SessionEditPage ───────────────────────────────────────────────────────────
// Props:
//   lesson      — { name, date, time, desc, video, attachments }
//   unitTitle   — string
//   programName — string (for breadcrumb)
//   onSave      — (data) => void
//   onCancel    — () => void
// ─────────────────────────────────────────────────────────────────────────────
export default function SessionEditPage({ lesson = {}, unitTitle = "", programName = "", onSave, onCancel }) {
  const [name,        setName]        = useState(lesson.name || "");
  const [desc,        setDesc]        = useState(lesson.desc || "");
  const [video,       setVideo]       = useState(lesson.video || null);
  const [attachments, setAttachments] = useState(lesson.attachments || []);

  const handleAttach = (e) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttach = (fileName) => setAttachments(prev => prev.filter(f => {
    const n = f instanceof File ? f.name : (f.original_name ?? f.name ?? f.file_name ?? "");
    return n !== fileName;
  }));

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50" dir="rtl">
      <div className="w-full px-4 py-4 sm:px-6 sm:py-5 space-y-4">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <button onClick={onCancel} className="font-semibold text-slate-500 hover:text-teal-600 transition">
            {programName || "البرامج التدريبية"}
          </button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
            <line x1="16" y1="4" x2="8" y2="20"/>
          </svg>
          <span className="font-bold" style={{ color: "#024677" }}>{lesson.name || "تعديل الجلسة"}</span>
        </div>

        {/* هيدر الجلسة */}
        <div className="rounded-2xl px-6 py-5 text-white" style={{ background: "#024677" }}>
          <h2 className="text-xl font-bold text-right">
            {lesson.name || "الجلسة"}{unitTitle ? ` - ${unitTitle}` : ""}
          </h2>
          <div className="flex items-center gap-4 mt-1.5 text-sm opacity-80 justify-end">
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {lesson.date || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {lesson.time || "—"}
            </span>
          </div>
        </div>

        {/* body */}
        <div className="flex gap-4 items-start" dir="ltr">

          {/* LEFT: فيديو + مرفقات */}
          <div className="flex-1 space-y-4">

            {/* رفع الفيديو */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <h3 className="text-sm font-bold text-slate-700 text-right">رفع تسجيل الفيديو</h3>
              <label className={`
                relative flex flex-col items-center justify-center gap-3
                w-full min-h-[150px] rounded-2xl border-2 border-dashed cursor-pointer transition-all group
                ${video instanceof File ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50"}
              `}>
                <input type="file" accept="video/*" className="hidden"
                  onChange={e => setVideo(e.target.files?.[0] ?? null)} />
                {video instanceof File ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#0d9488" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-bold text-teal-700 truncate max-w-[200px]">{video.name}</p>
                      <p className="text-xs text-teal-500 mt-0.5">{(video.size/(1024*1024)).toFixed(1)} MB — اضغط لتغيير الفيديو</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        className="group-hover:stroke-teal-500 transition-colors">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                    </div>
                    <div className="text-center px-4" dir="rtl">
                      <p className="text-sm font-semibold text-slate-600 group-hover:text-teal-600 transition-colors">اسحب الفيديو هنا أو اضغط للرفع</p>
                      <p className="text-xs text-slate-400 mt-0.5">MP4, MOV - الحد الأقصى 2 جيجا</p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* المرفقات */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <h3 className="text-sm font-bold text-slate-700 text-right">المرفقات والملفات المساعدة</h3>
              <label className="flex flex-col items-center justify-center gap-2 w-full min-h-[90px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50 transition cursor-pointer">
                <input type="file" multiple className="hidden" onChange={handleAttach} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <p className="text-xs text-slate-500" dir="rtl">اسحب الملفات هنا أو اضغط للرفع</p>
                <p className="text-[10px] text-slate-400">PDF, DOCX, PPTX, ZIP</p>
              </label>
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2" dir="rtl">
                  {attachments.map((f, i) => {
                    const fileName = f instanceof File
                      ? f.name
                      : (f.original_name ?? f.name ?? f.file_name ?? "ملف");
                    const fileExt  = fileName.split(".").pop()?.toUpperCase() ?? "";
                    const fileSize = f.size ? (f.size / (1024 * 1024)).toFixed(1) + " MB" : "";
                    const fileUrl  = f instanceof File ? null : (f.url ?? f.path ?? null);
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-white">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F0F7FF" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="2" strokeLinecap="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-xs font-semibold text-slate-700 truncate">{fileName}</p>
                          <p className="text-[10px] text-slate-400">{fileExt}{fileSize ? ` • ${fileSize}` : ""}</p>
                        </div>
                        {fileUrl && (
                          <a href={fileUrl} target="_blank" rel="noreferrer"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-500 transition shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </a>
                        )}
                        <button type="button" onClick={() => removeAttach(fileName)}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ background: "#ef4444" }}>
                          <IcoX />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: اسم + وصف */}
          <div className="w-72 shrink-0 space-y-4" dir="rtl">
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-2">
              <h3 className="text-sm font-bold text-slate-700 text-right">اسم الجلسة</h3>
              <div className="relative">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="أدخل اسم الجلسة"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right"
                />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-400 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-2">
              <h3 className="text-sm font-bold text-slate-700 text-right">وصف الجلسة وتفاصيلها</h3>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="أكتب وصفاً للجلسة..."
                rows={7}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none"
              />
            </div>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex items-center gap-3 pb-6" dir="ltr">
          <button type="button"
            onClick={() => onSave?.({ name, desc, video, attachments })}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
            style={{ background: "#14b8a6" }}>
            حفظ التعديلات
          </button>
          <button type="button" onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            إلغاء
          </button>
        </div>

      </div>
    </main>
  );
}
