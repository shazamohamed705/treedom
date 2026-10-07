import { useState } from "react";
import { updateSession } from "../services/api";
import { useToast } from "./ToastProvider";

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoX() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IcoBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function SessionAddContentPage({ session = {}, onBack }) {
  const showToast = useToast();

  // session info
  const sessionId = session?.id ?? null;
  const title     = session?.title ?? session?.name ?? "الجلسة";
  const date      = session?.date  ?? "";
  const timeFrom  = session?.starts_at ?? session?.timeFrom ?? "";
  const timeTo    = session?.ends_at   ?? session?.timeTo   ?? "";

  // form state
  const [video,       setVideo]       = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [saving,      setSaving]      = useState(false);

  const handleAttach = (e) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttach = (fileName) =>
    setAttachments(prev => prev.filter(f => f.name !== fileName));

  const handleSave = async () => {
    if (!sessionId) {
      showToast("لا يمكن تحديد معرف الجلسة", "error");
      return;
    }
    if (!video && attachments.length === 0) {
      showToast("أضف فيديو أو مرفق على الأقل", "error");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (video instanceof File)        fd.append("video",           video);
      attachments.forEach(f => {
        if (f instanceof File)          fd.append("attachments[]",   f);
      });

      await updateSession(sessionId, fd);
      showToast("تم رفع المحتوى بنجاح", "success");
      setTimeout(() => onBack?.(), 1200);
    } catch (err) {
      showToast(err?.message || "حدث خطأ أثناء الرفع", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50" dir="rtl">
      <div className="w-full max-w-4xl mx-auto px-4 py-5 space-y-5">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={onBack}
            className="flex items-center gap-1 text-slate-500 hover:text-teal-600 transition font-semibold">
            <IcoBack /> إدارة الجلسات
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold" style={{ color: "#024677" }}>إضافة محتوى</span>
        </div>

        {/* header card */}
        <div className="rounded-2xl px-6 py-5 text-white" style={{ background: "#024677" }}>
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-5 mt-2 text-sm opacity-80">
            {date && (
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {date}
              </span>
            )}
            {(timeFrom || timeTo) && (
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {timeFrom}{timeTo ? ` — ${timeTo}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* content area */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* RIGHT: رفع فيديو + مرفقات */}
          <div className="flex-1 space-y-4">

            {/* رفع الفيديو */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <h3 className="text-sm font-bold text-slate-700">رفع تسجيل الفيديو</h3>
              <label className={`
                relative flex flex-col items-center justify-center gap-3
                w-full min-h-[160px] rounded-2xl border-2 border-dashed cursor-pointer transition-all group
                ${video instanceof File
                  ? "border-teal-400 bg-teal-50"
                  : "border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50"}
              `}>
                <input type="file" accept="video/*" className="hidden"
                  onChange={e => setVideo(e.target.files?.[0] ?? null)} />
                {video instanceof File ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "#0d9488" }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white"
                        strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-bold text-teal-700 truncate max-w-[240px]">{video.name}</p>
                      <p className="text-xs text-teal-500 mt-0.5">
                        {(video.size / (1024 * 1024)).toFixed(1)} MB — اضغط لتغيير الفيديو
                      </p>
                    </div>
                    <button type="button"
                      onClick={e => { e.preventDefault(); setVideo(null); }}
                      className="absolute top-3 left-3 w-6 h-6 rounded-full bg-red-100 text-red-400 flex items-center justify-center hover:bg-red-200 transition">
                      <IcoX />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "#F1F5F9" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        className="group-hover:stroke-teal-500 transition-colors">
                        <polyline points="16 16 12 12 8 16"/>
                        <line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-semibold text-slate-600 group-hover:text-teal-600 transition-colors">
                        اسحب الفيديو هنا أو اضغط للرفع
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">MP4, MOV, AVI — حجم أقصى 2GB</p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* المرفقات */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <h3 className="text-sm font-bold text-slate-700">المرفقات والملفات المساعدة</h3>
              <label className="flex flex-col items-center justify-center gap-2 w-full min-h-[90px]
                rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50
                hover:border-teal-400 hover:bg-teal-50 transition cursor-pointer">
                <input type="file" multiple className="hidden" onChange={handleAttach} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <p className="text-xs text-slate-500">اسحب الملفات هنا أو اضغط للرفع</p>
                <p className="text-[10px] text-slate-400">PDF, DOCX, PPTX, ZIP</p>
              </label>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((f, i) => (
                    <div key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-white">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "#F0F7FF" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="#024677" strokeWidth="2" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs font-semibold text-slate-700 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {f.name.split(".").pop()?.toUpperCase()} • {(f.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button type="button"
                        onClick={() => removeAttach(f.name)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ background: "#ef4444" }}>
                        <IcoX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LEFT: ملخص */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                ملخص المحتوى
              </h3>
              <div className="flex items-center justify-between text-xs">
                <span className={video instanceof File ? "text-teal-600 font-semibold" : "text-slate-400"}>
                  {video instanceof File ? "✓ تم اختيار فيديو" : "لم يتم اختيار فيديو"}
                </span>
                <span className="text-slate-500 font-medium">فيديو</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={attachments.length > 0 ? "text-teal-600 font-semibold" : "text-slate-400"}>
                  {attachments.length > 0 ? `✓ ${attachments.length} ملف` : "لا توجد مرفقات"}
                </span>
                <span className="text-slate-500 font-medium">مرفقات</span>
              </div>
            </div>

            {/* أزرار */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (!video && attachments.length === 0)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#024677" }}>
              {saving ? <IcoSpinner /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {saving ? "جاري الرفع..." : "حفظ المحتوى"}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
              إلغاء
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
