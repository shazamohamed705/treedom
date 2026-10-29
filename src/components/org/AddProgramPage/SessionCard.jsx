import { useState, useEffect, useRef } from "react";
import { SESSION_TYPE_OPTIONS, SESSION_INPUT_CLS } from "./constants";
import { isRecordedSession } from "../../../services/sessionType";
import ZoomSessionLink from "../../shared/ZoomSessionLink";
import { IcoTrash, IcoX, IcoPlus } from "./icons";

// ── session card ──────────────────────────────────────────────────────────────
export default function SessionCard({ index, data, coaches, onChange, onRemove, autoZoom, hideCoach }) {
  const [open,            setOpen]            = useState(true);
  const [typeOpen,        setTypeOpen]        = useState(false);
  const [uploadRecording, setUploadRecording] = useState(true);
  const typeRef = useRef();
  const set = (key, val) => onChange({ [key]: val });

  // close type dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = SESSION_TYPE_OPTIONS.find(t => t.value === (data.type || "zoom")) ?? SESSION_TYPE_OPTIONS[0];

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files ?? []);
    onChange({ attachments: [...(data.attachments ?? []), ...files] });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

      {/* header */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: "#F8FAFC", borderBottom: open ? "1px solid #e2e8f0" : "none" }}>
        <button type="button" onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "#14b8a6" }}>{index}</span>
          <span>{data.title || `جلسة ${index}`}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-400 transition p-1">
          <IcoTrash />
        </button>
      </div>

      {open && (
        <div className="p-5 space-y-4" style={{ background: "#FAFAFA" }}>

          {/* ── نوع الجلسة ── */}
          <div dir="rtl">
            <p className="text-xs text-slate-500 mb-1.5">نوع الجلسه</p>
            <div className="relative" ref={typeRef}>
              <button type="button" onClick={() => setTypeOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white hover:border-teal-400 transition">
                <span className="font-medium text-slate-700">{selected.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {typeOpen && (
                <div className="absolute top-full right-0 left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {SESSION_TYPE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => { set("type", opt.value); setTypeOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
                      style={data.type === opt.value ? { background: "#F0F7FF" } : {}}>
                      <span className={`text-sm ${data.type === opt.value ? "text-[#024677] font-semibold" : "font-medium text-slate-700"}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-slate-400">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── عنوان الجلسة ── */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5 text-right">
              عنوان الجلسة <span className="text-red-400">*</span>
            </p>
            <input value={data.title} onChange={e => set("title", e.target.value)}
              placeholder="أضف عنواناً للجلسة"
              className={SESSION_INPUT_CLS} style={{ background: "#fff" }} />
          </div>

          {/* ── تاريخ دائماً؛ وقت البداية/النهاية مش للمسجّلة ── */}
          {isRecordedSession(data.type) ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1.5 text-right">تاريخ الجلسة</p>
              <input type="date" value={data.date} onChange={e => set("date", e.target.value)}
                className={SESSION_INPUT_CLS} style={{ background: "#fff" }} dir="ltr" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5 text-right">مدة الجلسة (دقيقة)</p>
              <input type="number" min="1" value={data.duration}
                onChange={e => set("duration", e.target.value)}
                placeholder="60" className={SESSION_INPUT_CLS} style={{ background: "#fff" }} dir="ltr" />
            </div>
          </div>
          ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1.5 text-right">تاريخ الجلسة</p>
              <input type="date" value={data.date} onChange={e => set("date", e.target.value)}
                className={SESSION_INPUT_CLS} style={{ background: "#fff" }} dir="ltr" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5 text-right">وقت البدء</p>
              <input type="time" value={data.time} onChange={e => set("time", e.target.value)}
                className={SESSION_INPUT_CLS} style={{ background: "#fff" }} dir="ltr" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5 text-right">
                {data.type === "offline" ? "وقت النهاية" : "مدة الجلسة (دقيقة)"}
              </p>
              {data.type === "offline" ? (
                <input type="time" value={data.timeTo} onChange={e => set("timeTo", e.target.value)}
                  className={SESSION_INPUT_CLS} style={{ background: "#fff" }} dir="ltr" />
              ) : (
                <input type="number" min="1" value={data.duration}
                  onChange={e => set("duration", e.target.value)}
                  placeholder="60" className={SESSION_INPUT_CLS} style={{ background: "#fff" }} dir="ltr" />
              )}
            </div>
          </div>
          )}

          {/* ── رابط Zoom ── */}
          {data.type === "zoom" && (
            <ZoomSessionLink
              autoZoom={autoZoom}
              value={data.zoomLink}
              onChange={v => set("zoomLink", v)}
              inputClassName={SESSION_INPUT_CLS + " flex-1"}
              compact
            />
          )}

          {/* ── مكان الجلسة (offline) ── */}
          {data.type === "offline" && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5 text-right">مكان الجلسة</p>
              <input value={data.location} onChange={e => set("location", e.target.value)}
                placeholder="اسم القاعة أو العنوان..."
                className={SESSION_INPUT_CLS} style={{ background: "#fff" }} />
            </div>
          )}

          {/* ── رفع فيديو (يظهر فقط لو التوجل مفتوح) ── */}
          {uploadRecording && <div dir="rtl">
            <p className="text-xs text-slate-500 mb-2 text-right">رفع ملف الفيديو</p>
            <label className={`
              relative flex flex-col items-center justify-center gap-3
              w-full min-h-[160px] rounded-2xl border-2 border-dashed cursor-pointer
              transition-all duration-200 group
              ${data.videos?.[0] instanceof File
                ? "border-teal-400 bg-teal-50"
                : "border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50"}
            `}>
              <input type="file" accept="video/*" className="hidden"
                onChange={e => set("videos", e.target.files ? [e.target.files[0]] : [])} />

              {data.videos?.[0] instanceof File ? (
                /* ── حالة: تم اختيار فيديو ── */
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "#0d9488" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold text-teal-700 truncate max-w-[220px]">
                      {data.videos[0].name}
                    </p>
                    <p className="text-xs text-teal-500 mt-0.5">
                      {(data.videos[0].size / (1024 * 1024)).toFixed(1)} MB — اضغط لتغيير الفيديو
                    </p>
                  </div>
                </>
              ) : (
                /* ── حالة: لم يتم الاختيار بعد ── */
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors"
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
          </div>}

          {/* ── المدرب ── */}
          {!hideCoach && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5 text-right">المدرب (اختياري)</p>
            <select value={data.coachId} onChange={e => set("coachId", e.target.value)}
              className={SESSION_INPUT_CLS + " appearance-none cursor-pointer"} style={{ background: "#fff" }}>
              <option value="">اختر المدرب...</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          )}

          {/* ── toggle تسجيل ── */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100" dir="rtl">
            <span className="text-sm text-slate-700">هل سيُرفع تسجيل للجلسة بعد انتهائها؟</span>
            <button type="button" onClick={() => setUploadRecording(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0
                ${uploadRecording ? "bg-teal-400" : "bg-slate-200"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all
                ${uploadRecording ? "right-1" : "left-1"}`}/>
            </button>
          </div>

          {/* ── مرفقات الجلسة ── */}
          <div>
            <p className="text-xs text-slate-500 mb-2 text-right">مرفقات الجلسة</p>
            <div className="flex items-center gap-2 flex-wrap">
              {(data.attachments ?? []).map(f => (
                <span key={f.name}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {f.name}
                  <button type="button"
                    onClick={() => onChange({ attachments: (data.attachments ?? []).filter(a => a.name !== f.name) })}
                    className="hover:text-red-400 transition"><IcoX /></button>
                </span>
              ))}
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-slate-500 hover:border-teal-400 hover:text-teal-600 transition cursor-pointer">
                <IcoPlus /> إضافة مرفق
                <input type="file" multiple className="hidden" onChange={handleAttachment} />
              </label>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
