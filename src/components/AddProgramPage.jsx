import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastProvider";
import {
  fetchCoaches,
  fetchFields,
  fetchApprovedPrograms,
  createProgram,
  submitProgram,
} from "../services/api";
import { isIndeCoach } from "../services/auth";
import { SESSION_TYPE_TO_INT, isRecordedSession } from "../services/sessionType";
import useZoomAuto from "../hooks/useZoomAuto";
import ZoomSessionLink from "./ZoomSessionLink";
import SessionEditPage from "./SessionEditPage";

// ── draft helpers ─────────────────────────────────────────────────────────────
const DRAFT_KEY = "addProgramDraft";
function loadDraft() {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}
function saveDraft(form, sessions) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, sessions })); } catch { /* noop */ }
}
function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
}

// ── type map ──────────────────────────────────────────────────────────────────
const TYPE_TO_INT = SESSION_TYPE_TO_INT;

// ── CSS ───────────────────────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right";

const SESSION_INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm " +
  "focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right";

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoGrad() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function IcoSlash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
      <line x1="16" y1="4" x2="8" y2="20" />
    </svg>
  );
}
function IcoChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IcoSend() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
function IcoTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}
function IcoX() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── tag input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {tags.map(tag => (
          <span key={tag}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "#EBF7FF", color: "#024677" }}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)}
              className="hover:text-red-400 transition">
              <IcoX />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="أضف كلمة مفتاحية ثم اضغط Enter"
          className={INPUT_CLS}
        />
        <button type="button" onClick={addTag}
          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-400 hover:text-teal-500 hover:border-teal-400 transition">
          <IcoPlus />
        </button>
      </div>
    </div>
  );
}

// ── session card ──────────────────────────────────────────────────────────────
const SESSION_TYPE_OPTIONS = [
  { value: "zoom",     label: "بث تفاعلي (zoom)",  sub: "جلسة حية"             },
  { value: "offline",  label: "حضوري (Offline)",    sub: "حضور فعلي داخل المقر" },
  { value: "recorded", label: "مسجلة",              sub: "يتم رفع فيديو الجلسة" },
];

function SessionCard({ index, data, coaches, onChange, onRemove, autoZoom, hideCoach }) {
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

// ── sessions accordion (preview sidebar) ─────────────────────────────────────
function SessionsAccordion({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4">
        <span className="text-base font-bold text-slate-800">
          المحتوى التدريبي
          {sessions.length > 0 && (
            <span className="mr-2 text-sm font-normal text-slate-400">({sessions.length} جلسة)</span>
          )}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"
          className={`transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-right">لا توجد جلسات مضافة بعد.</p>
          ) : sessions.map((s, i) => (
            <div key={s.id ?? i}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-right">
              <span className="text-xs text-slate-400">{s.date ?? ""}</span>
              <span className="text-sm font-semibold text-slate-700">{s.title || `جلسة ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── program preview sidebar ───────────────────────────────────────────────────
function CheckIcon({ done, warn }) {
  if (warn) return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]"
      style={{ background: "#FEF3C7", color: "#D97706" }}>!</span>
  );
  if (done) return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "#14b8a6" }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
  );
  return (
    <span className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0"/>
  );
}

function ProgramPreview({ form, sessions, doneCount, indeCoach = false }) {
  const totalSessions  = Number(form.totalSessions) || 0;
  const recordedSessions = sessions.filter(s => s.type === "recorded").length;
  const liveSessions     = sessions.filter(s => s.type === "zoom").length;
  const uploadedVideos   = sessions.filter(s => s.type === "recorded" && s.videos?.[0]).length;

  // جاهزية الجلسات — كل جلسة ليها حالة
  const sessionReadiness = sessions.map(s => {
    const hasTitle = !!s.title;
    const recorded = isRecordedSession(s.type);
    const hasDate  = !!s.date;
    if (!hasTitle) return { label: s.title || "جلسة بدون عنوان", sub: "جلسة تفاعلية غير مسجله", status: "warn" };
    if (!hasDate)  return { label: s.title, sub: "جلسة تفاعلية غير مسجله", status: "warn" };
    return { label: s.title, sub: recorded ? "مسجل" : "جلسة تفاعلية غير مسجله", status: "done" };
  });

  const readinessPct = sessions.length === 0 ? 0
    : Math.round((sessionReadiness.filter(s => s.status === "done").length / sessions.length) * 100);

  // قائمة الإرسال للمراجعة
  const submitChecks = [
    { label: "عنوان البرنامج",       done: !!form.name },
    { label: "وصف البرنامج",         done: !!form.desc },
    { label: "المدرب المسؤول",        done: indeCoach || !!form.coachId },
    { label: "تاريخ البدء والانتهاء", done: !!(form.startDate && form.endDate) },
    { label: "السعر المحدد",          done: !!form.price },
    { label: "جميع الجلسات مكتملة",  done: sessions.length > 0 && sessionReadiness.every(s => s.status === "done") },
  ];

  return (
    <div className="w-full xl:w-72 xl:shrink-0 space-y-3 xl:sticky xl:top-6" dir="rtl">

      {/* ── نظرة عامة على البرنامج ── */}
      <div className="bg-white rounded-2xl p-4 space-y-3 border border-brand-border">
        <h3 className="text-sm font-bold text-slate-800 text-center border-b border-brand-border pb-2">
          نظرة عامة على البرنامج
        </h3>
        {[
          { label: "السعر",              val: form.price ? `${form.price} /متدرب` : "—" },
          { label: "إجمالي الجلسات",    val: form.totalSessions ? `${form.totalSessions} جلسة` : "—" },
          { label: "إجمالي الساعات",    val: form.hours ? `${form.hours} ساعة` : "—" },
          { label: "جلسات مسجلة",       val: `${recordedSessions} جلسة` },
          { label: "جلسات مباشرة",      val: `${liveSessions} جلسة` },
          { label: "فيديوهات مرفوعة",   val: `${uploadedVideos} / ${recordedSessions}` },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{row.val}</span>
            <span className="text-slate-700 font-semibold">{row.label}</span>
          </div>
        ))}
      </div>

      {/* ── جاهزية الجلسات ── */}
      <div className="bg-white rounded-2xl p-4 space-y-2 border border-brand-border">
        <h3 className="text-sm font-bold text-slate-800 text-center border-b border-brand-border pb-2">
          جاهزية الجلسات
        </h3>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">لا توجد جلسات مضافة بعد</p>
        ) : (
          <>
            {sessionReadiness.map((s, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <CheckIcon done={s.status === "done"} warn={s.status === "warn"} />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {i + 1}. {s.label}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: s.status === "warn" ? "#D97706" : "#94a3b8" }}>
                    {s.sub}
                  </p>
                </div>
              </div>
            ))}
            {/* progress bar */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>{readinessPct}%</span>
                <span>جاهزية المنهج</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${readinessPct}%`, background: "#14b8a6" }}/>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── قائمة الإرسال للمراجعة ── */}
      <div className="bg-white rounded-2xl p-4 space-y-2 border border-brand-border">
        <h3 className="text-sm font-bold text-slate-800 text-center border-b border-brand-border pb-2 flex items-center justify-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          قائمة الإرسال للمراجعة
        </h3>
        {submitChecks.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-2">
            <CheckIcon done={item.done} />
            <span className={`text-xs flex-1 text-right ${item.done ? "text-slate-700" : "text-slate-400"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function newSession() {
  return {
    id: Date.now() + Math.random(),
    type: "zoom",
    title: "", coachId: "", date: "", time: "", timeTo: "",
    duration: "", zoomLink: "", location: "",
    videos: [], autoRecord: true, attachments: [],
  };
}

const DEFAULT_FORM = {
  name: "", desc: "",
  coachId: "", coachName: "", coachAvatar: "",
  categoryId: "", categoryName: "",
  totalSessions: "12", hours: "36",
  startDate: "", endDate: "",
  price: "",
  tags: [],
};

function buildFormData(form, sessions, isDraft, autoZoom = false) {
  const inde = isIndeCoach();
  const fd = new FormData();
  fd.append("name[ar]",               form.name);
  fd.append("name[en]",               form.name);
  fd.append("description[ar]",        form.desc);
  fd.append("description[en]",        form.desc);
  if (inde) {
    if (form.categoryId) fd.append("field_id", form.categoryId);
  } else {
    fd.append("field_id", form.categoryId || "1");
    fd.append("coach_id", form.coachId);
  }
  fd.append("price_amount",           form.price || "0");
  fd.append("hours_count",            form.hours || "0");
  fd.append("max_capacity",           "15");
  fd.append("sessions_count_planned", form.totalSessions);
  fd.append("start_date",             form.startDate);
  fd.append("end_date",               form.endDate);
  if (inde && form.endDate) fd.append("registration_deadline", form.endDate);
  fd.append("is_draft",               isDraft ? "1" : "0");
  if (form.coverImage instanceof File) fd.append("cover_image", form.coverImage);
  form.tags.forEach(tag => fd.append("keywords[]", tag));

  const contentType = sessions.length > 0 ? (TYPE_TO_INT[sessions[0].type] ?? 0) : 0;
  fd.append("content_type", String(contentType));

  const skipMeetingUrl = autoZoom || inde;

  sessions.forEach((s, idx) => {
    const p = `sessions[${idx}]`;
    const recorded = isRecordedSession(s.type);
    fd.append(`${p}[title][ar]`, s.title || "جلسة");
    fd.append(`${p}[title][en]`, s.title || "Session");
    fd.append(`${p}[type]`,      String(TYPE_TO_INT[s.type] ?? 0));
    if (s.date) fd.append(`${p}[date]`, s.date);
    if (!recorded && s.time) fd.append(`${p}[starts_at]`, s.time);

    if (!recorded && s.type === "offline" && s.time && s.timeTo) {
      const [sh, sm] = s.time.split(":").map(Number);
      const [eh, em] = s.timeTo.split(":").map(Number);
      const mins = eh * 60 + em - (sh * 60 + sm);
      fd.append(`${p}[duration_minutes]`, mins > 0 ? String(mins) : "60");
    } else {
      fd.append(`${p}[duration_minutes]`, s.duration || "60");
    }

    if (inde) fd.append(`${p}[attendance_enabled]`, "1");
    if (s.type === "zoom" && !skipMeetingUrl && s.zoomLink) fd.append(`${p}[meeting_url]`, s.zoomLink);
    if (s.type === "offline"  && s.location)             fd.append(`${p}[location]`,    s.location);
    if (recorded && s.videos?.[0] instanceof File) fd.append(`${p}[video]`, s.videos[0]);
    if (!inde && s.coachId)                              fd.append(`${p}[coach_id]`,    s.coachId);

    (s.attachments ?? []).forEach(file => {
      if (file instanceof File) fd.append(`${p}[attachments][]`, file);
    });
  });

  return fd;
}

function extractErrorMsg(err) {
  const msg = err?.message ?? err?.data?.message;
  if (msg == null) return null;
  if (typeof msg === "string") return msg;
  if (typeof msg === "object") {
    const first = Object.values(msg).find(v => v != null && v !== "" && typeof v === "string");
    if (first) return first;
    try { return JSON.stringify(msg); } catch { return ""; }
  }
  return String(msg);
}

// ── unit accordion row (in main content area) ────────────────────────────────
// ── unit accordion row (in main content area) ────────────────────────────────
function UnitAccordionRow({ unit, index, onSelectLesson, selectedLesson }) {
  const [open, setOpen] = useState(false);
  const lessonList = unit.lessonNames?.length > 0
    ? unit.lessonNames
    : Array.from({ length: unit.lessons || 0 }, (_, j) => `درس ${j + 1}`);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden" dir="rtl">
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition cursor-pointer">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="1.8" strokeLinecap="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-sm font-semibold text-slate-700">{unit.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">({unit.lessons ?? 0} دروس)</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {lessonList.length === 0 ? (
            <p className="text-xs text-slate-400 px-6 py-3 text-right">لا توجد دروس في هذه الوحدة</p>
          ) : lessonList.map((name, j) => {
            const lessonKey = `${unit.id ?? index}-${j}`;
            const isSelected = selectedLesson?.key === lessonKey;
            return (
              <div key={j}
                onClick={() => onSelectLesson?.({ key: lessonKey, name, unitTitle: unit.title, unitIndex: index, lessonIndex: j })}
                className="flex items-center gap-3 px-6 py-2.5 cursor-pointer transition"
                style={{ background: isSelected ? "#EFF6FF" : "white" }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "white"; }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: isSelected ? "#024677" : "#14b8a6" }}>{j + 1}</span>
                <span className="text-sm text-right flex-1"
                  style={{ color: isSelected ? "#024677" : "#475569", fontWeight: isSelected ? 600 : 400 }}>
                  {name}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function UnitsSidebar({ units = [], onSelectLesson, selectedLesson }) {
  const [openUnit, setOpenUnit] = useState(null);

  return (
    <div className="w-64 shrink-0 border border-slate-200 rounded-2xl overflow-hidden bg-white" dir="rtl">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-700 text-right">قائمة الوحدات</p>
      </div>
      <div className="p-2 space-y-1">
        {units.map((unit, i) => {
          const isOpen = openUnit === (unit.id ?? i);
          const lessonList = unit.lessonNames?.length > 0
            ? unit.lessonNames
            : Array.from({ length: unit.lessons || 0 }, (_, j) => `درس ${j + 1}`);
          return (
            <div key={unit.id ?? i}>
              {/* unit row */}
              <div
                onClick={() => setOpenUnit(isOpen ? null : (unit.id ?? i))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 transition"
                style={isOpen ? { background: "#EFF6FF" } : {}}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "#024677" }}>{i + 1}</span>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs font-semibold text-slate-700 truncate">{unit.title}</p>
                  <p className="text-[10px] text-slate-400">{unit.lessons ?? 0} دروس • {unit.hours ?? 0} ساعات</p>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
                  className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {/* lessons list */}
              {isOpen && (
                <div className="pr-4 pb-1 space-y-0.5">
                  {lessonList.length === 0 ? (
                    <p className="text-[10px] text-slate-400 px-3 py-1.5 text-right">لا توجد دروس</p>
                  ) : lessonList.map((name, j) => {
                    const lessonKey = `${unit.id ?? i}-${j}`;
                    const isSelected = selectedLesson?.key === lessonKey;
                    return (
                      <div key={j}
                        onClick={() => onSelectLesson?.({ key: lessonKey, name, unitTitle: unit.title, unitIndex: i, lessonIndex: j })}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition"
                        style={{ background: isSelected ? "#EFF6FF" : "transparent" }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: isSelected ? "#024677" : "#14b8a6" }}>{j + 1}</span>
                        <p className="text-[11px] font-medium text-right truncate flex-1"
                          style={{ color: isSelected ? "#024677" : "#475569" }}>{name}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── multi-date picker calendar ────────────────────────────────────────────────
function MultiDatePicker({ selected = [], onChange }) {
  // guard: ensure selected is always an array (draft may have stored a string)
  const safeSelected = Array.isArray(selected) ? selected : [];
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef();

  // close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const AR_DAYS   = ["ح","ن","ث","ر","خ","ج","س"]; // sun→sat

  const toKey = (y, m, d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const toggleDate = (key) => {
    if (safeSelected.includes(key)) onChange(safeSelected.filter(k => k !== key));
    else onChange([...safeSelected, key].sort());
  };

  const prevMonth = () => setViewDate(v => {
    const m = v.month === 0 ? 11 : v.month - 1;
    const y = v.month === 0 ? v.year - 1 : v.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setViewDate(v => {
    const m = v.month === 11 ? 0 : v.month + 1;
    const y = v.month === 11 ? v.year + 1 : v.year;
    return { year: y, month: m };
  });

  // build days grid
  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay(); // 0=sun
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // display label
  const label = safeSelected.length === 0
    ? "اختر التواريخ"
    : safeSelected.length === 1
      ? safeSelected[0]
      : `${safeSelected.length} تواريخ مختارة`;

  return (
    <div className="relative" ref={ref}>
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white hover:border-teal-400 focus:outline-none focus:border-teal-400 transition text-right"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className={safeSelected.length === 0 ? "text-slate-400" : "text-slate-700 font-medium"}>
          {label}
        </span>
      </button>

      {/* dropdown calendar */}
      {open && (
        <div className="absolute top-full right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72" dir="rtl"
          onClick={e => e.stopPropagation()}>

          {/* month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition text-slate-500">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-bold text-slate-700">
              {AR_MONTHS[viewDate.month]} {viewDate.year}
            </span>
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition text-slate-500">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* day headers */}
          <div className="grid grid-cols-7 mb-1">
            {AR_DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const key = toKey(viewDate.year, viewDate.month, day);
              const isSelected = safeSelected.includes(key);
              const isToday = (() => {
                const t = new Date();
                return t.getFullYear() === viewDate.year && t.getMonth() === viewDate.month && t.getDate() === day;
              })();
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDate(key)}
                  className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs transition font-medium"
                  style={
                    isSelected
                      ? { background: "#ef4444", color: "#fff" }
                      : isToday
                      ? { background: "#F0F7FF", color: "#024677", fontWeight: 700 }
                      : { color: "#475569" }
                  }
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? "#F0F7FF" : ""; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* selected chips */}
          {safeSelected.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-1.5">
                {safeSelected.map(k => (
                  <span key={k}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#FEE2E2", color: "#b91c1c" }}>
                    {k}
                    <button type="button" onClick={() => onChange(safeSelected.filter(s => s !== k))}
                      className="hover:text-red-700 transition leading-none">×</button>
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => onChange([])}
                className="mt-2 text-[11px] text-slate-400 hover:text-red-400 transition">
                مسح الكل
              </button>
            </div>
          )}

          {/* done */}
          <button type="button" onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: "#024677" }}>
            تم
          </button>
        </div>
      )}
    </div>
  );
}


export default function AddProgramPage({ onBack }) {
  const navigate  = useNavigate();
  const showToast = useToast();
  const { autoZoom: autoZoomSetting } = useZoomAuto();
  const indeCoach = isIndeCoach();
  // للمدرب المستقل الـ API بتولّد رابط Zoom تلقائياً — لا يحتاج يدخل رابط يدوياً
  const autoZoom = indeCoach ? true : autoZoomSetting;

  const draft = loadDraft();
  const [sessions,  setSessions]  = useState(draft?.sessions ?? []);
  const [form,      setForm]      = useState(draft?.form     ?? { ...DEFAULT_FORM });
  const [coaches,   setCoaches]   = useState([]);
  const [fields,    setFields]    = useState([]);
  const [approvedPrograms, setApprovedPrograms] = useState([]);

  const [coachOpen,    setCoachOpen]    = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeTab,    setActiveTab]    = useState(1);
  const coachRef    = useRef();
  const categoryRef = useRef();

  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [tab1Touched, setTab1Touched] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // auto-save draft
  useEffect(() => { saveDraft(form, sessions); }, [form, sessions]);

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (coachRef.current    && !coachRef.current.contains(e.target))    setCoachOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // load dropdowns
  useEffect(() => {
    if (isIndeCoach()) {
      fetchApprovedPrograms()
        .then(r => setApprovedPrograms(r.data?.programs ?? []))
        .catch(() => {});
    } else {
      fetchCoaches({ per_page: 100 }).then(r => setCoaches(r.data?.coaches ?? [])).catch(() => {});
    }
    fetchFields({  per_page: 100 }).then(r => {
      const list = r.data?.fields ?? [];
      const seen = new Set();
      setFields(list.filter(f => {
        const key = String(f.id ?? "").trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
    }).catch(() => {});
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const selectCoach = (coach) => {
    set("coachId",    coach.id);
    set("coachName",  coach.name);
    set("coachAvatar", coach.name.split(" ").map(w => w[0]).join("").slice(0, 2));
    setCoachOpen(false);
  };

  const doneCount =
    +!!form.name + +!!form.desc + +(indeCoach || !!form.coachId) +
    +!!form.categoryId + (form.startDate && form.endDate ? 1 : 0);

  // ── save as draft ─────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!form.name) { setError("اسم البرنامج مطلوب"); return; }
    setSaving(true); setError(null); setSuccessMsg(null);
    try {
      await createProgram(buildFormData(form, sessions, true, autoZoom));
      showToast("تم حفظ البرنامج كمسودة", "success");
      setTimeout(() => onBack?.(), 1500);
    } catch (err) {
      showToast(err.message || "حدث خطأ أثناء الحفظ", "error");
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── submit for review ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setError("اسم البرنامج وتاريخ البدء والانتهاء مطلوبة");
      return;
    }
    setSaving(true); setError(null); setSuccessMsg(null);
    try {
      const created = await createProgram(buildFormData(form, sessions, false, autoZoom));
      const result  = await submitProgram(created.data.id);
      clearDraft();
      const msg = extractErrorMsg(result) || "تم إرسال البرنامج للمراجعة، وهو بانتظار موافقة الجهة التدريبية";
      setSubmitMsg(msg);
      showToast("تم إرسال البرنامج للمراجعة بنجاح", "success");
    } catch (err) {
      showToast(err.message || "حدث خطأ أثناء الإرسال", "error");
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── لو في درس مختار: عرض صفحة التعديل كاملة ──
  if (selectedLesson) {
    return (
      <SessionEditPage
        key={selectedLesson.key}
        lesson={selectedLesson}
        unitTitle={selectedLesson.unitTitle}
        programName="إضافة برنامج جديد"
        onSave={(data) => setSelectedLesson(prev => ({ ...prev, ...data }))}
        onCancel={() => setSelectedLesson(null)}
      />
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">

        {/* ── title ── */}
        <div className="flex items-center gap-2 mb-6" dir="rtl">
          <IcoGrad />
          <button onClick={onBack}
            className="text-sm font-semibold text-slate-500 hover:text-teal-600 transition">
            البرامج التدريبية
          </button>
          <IcoSlash />
          <span className="text-sm font-bold" style={{ color: "#024677" }}>
            إضافة برنامج جديد
          </span>
        </div>

        {/* ── 3-step tabs ── */}
        <div className="flex items-center mb-8" dir="rtl"
          style={{ gap: 0, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", display: "inline-flex", marginTop: 16 }}>
          {[
            { n: 1, label: "المعلومات الأساسية" },
            { n: 2, label: "الجدول الزمني"      },
            { n: 3, label: "المحتوى والتقييمات" },
          ].map((tab, idx) => {
            const active = activeTab === tab.n;
            const done   = activeTab > tab.n;
            return (
              <>
                {idx > 0 && (
                  <div key={`sep-${tab.n}`} style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch", flexShrink: 0 }} />
                )}
                <button
                  key={tab.n}
                  type="button"
                  onClick={() => setActiveTab(tab.n)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "18px 48px",
                    background: active ? "#024677" : done ? "#f0fdf4" : "#f8fafc",
                    color: active ? "#fff" : done ? "#14b8a6" : "#94a3b8",
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    border: "none",
                    transition: "background 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: active ? "rgba(255,255,255,0.2)" : done ? "#14b8a6" : "#e2e8f0",
                    color: active ? "#fff" : done ? "#fff" : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : tab.n}
                  </span>
                  {tab.label}
                </button>
              </>
            );
          })}
        </div>

        <div className={`flex flex-col xl:flex-row gap-6 xl:gap-16 items-start ${activeTab === 3 ? "xl:flex-row-reverse" : ""}`}>

          {/* ── form ── */}
          <div className={`w-full xl:shrink-0 space-y-6 xl:mr-6 ${activeTab === 3 ? "xl:w-full" : "xl:w-[720px]"}`}>

            {/* ════ TAB 1: المعلومات الأساسية ════ */}
            {activeTab === 1 && (<>

            {/* approved programs — inde_coach picker */}
            {indeCoach && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">البرنامج / المنهج</label>
              <select
                value={form.linkedProgramId || ""}
                onChange={e => {
                  const id = e.target.value;
                  const p = approvedPrograms.find(x => String(x.id) === String(id));
                  setForm(prev => ({
                    ...prev,
                    linkedProgramId: id,
                    ...(p ? {
                      name:      typeof p.name === "object" ? (p.name?.ar ?? p.name?.en ?? prev.name) : (p.name ?? prev.name),
                      desc:      typeof p.description === "object" ? (p.description?.ar ?? p.description?.en ?? prev.desc) : (p.description ?? prev.desc),
                      price:     p.price_amount != null ? String(p.price_amount) : prev.price,
                      hours:     p.hours_count != null ? String(p.hours_count) : prev.hours,
                      startDate: p.start_date ?? prev.startDate,
                      endDate:   p.end_date ?? prev.endDate,
                      totalSessions: p.sessions_count_planned != null ? String(p.sessions_count_planned) : prev.totalSessions,
                      categoryId:    p.field?.id ?? prev.categoryId,
                      categoryName:  p.field?.name ?? prev.categoryName,
                    } : {}),
                  }));
                }}
                className={INPUT_CLS + " appearance-none cursor-pointer"}
              >
                <option value="">اختر البرنامج...</option>
                {approvedPrograms.map(p => (
                  <option key={p.id} value={p.id}>
                    {typeof p.name === "object" ? (p.name?.ar ?? p.name?.en ?? "—") : (p.name ?? "—")}
                  </option>
                ))}
              </select>
            </div>
            )}

            {/* اسم البرنامج */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">اسم البرنامج</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="أضف اسم البرنامج" className={INPUT_CLS} />
            </div>

            {/* وصف البرنامج */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">وصف البرنامج</label>
              <textarea value={form.desc} onChange={e => set("desc", e.target.value)}
                placeholder="اكتب وصف شامل للبرنامج التدريبي"
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none" />
            </div>

            {/* نوع البرنامج */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">نوع البرنامج</label>
              <div className="relative">
                <select
                  value={form.programType || "zoom"}
                  onChange={e => set("programType", e.target.value)}
                  className={INPUT_CLS + " appearance-none cursor-pointer"}
                >
                  <option value="zoom">بث تفاعلي (zoom)</option>
                  <option value="offline">حضوري (Offline)</option>
                  <option value="recorded">مسجل</option>
                  <option value="mixed">مختلط</option>
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IcoChevron />
                </span>
              </div>
            </div>

            {/* صورة الغلاف */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                صورة الغلاف <span className="text-red-400">*</span>
              </label>
              <label className="block cursor-pointer">
                {form.coverImage instanceof File ? (
                  <div className="relative border-2 border-teal-400 rounded-xl overflow-hidden bg-teal-50/30 transition"
                    style={{ height: 180 }}>
                    <img
                      src={URL.createObjectURL(form.coverImage)}
                      alt="غلاف البرنامج"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 opacity-0 hover:opacity-100 transition">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <p className="text-xs text-white font-semibold">اضغط لتغيير الصورة</p>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {form.coverImage.name}
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-10 transition
                    ${tab1Touched ? "border-red-300 bg-red-50 hover:border-red-400" : "border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/30"}`}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                      stroke={tab1Touched ? "#f87171" : "#94a3b8"}
                      strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p className={`text-sm ${tab1Touched ? "text-red-400 font-semibold" : "text-slate-400"}`}>
                      {tab1Touched ? "مطلوب — اسحب الصورة هنا أو انقر للاختيار" : "اسحب الصورة هنا أو انقر للاختيار"}
                    </p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => set("coverImage", e.target.files?.[0] ?? null)} />
              </label>
            </div>

            {/* المدرب المسؤول */}
            {!indeCoach && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                المدرب المسؤول <span className="text-red-400">*</span>
              </label>
              <div className="relative" ref={coachRef}>
                <div onClick={() => setCoachOpen(o => !o)}
                  className={INPUT_CLS + " flex items-center justify-between cursor-pointer"}
                  style={tab1Touched && !form.coachId ? { borderColor: "#fca5a5", background: "#fff5f5" } : {}}>
                  {form.coachId ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "#14b8a6" }}>{form.coachAvatar}</div>
                      <span className="text-sm text-slate-700">{form.coachName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">اختر المدرب...</span>
                  )}
                  <IcoChevron />
                </div>
                {coachOpen && (
                  <div className="absolute top-full right-0 left-0 mt-1.5 z-50 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                    {coaches.length === 0
                      ? <p className="text-xs text-slate-400 text-center py-4">لا يوجد مدربون</p>
                      : coaches.map(coach => (
                        <div key={coach.id} onClick={() => selectCoach(coach)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                          style={form.coachId === coach.id ? { background: "#f0fdf4" } : {}}>
                          <img src={coach.image} alt={coach.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                            onError={e => { e.target.style.display = "none"; }} />
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-sm font-semibold text-slate-700 truncate">{coach.name}</p>
                            <p className="text-xs text-slate-400 truncate">{coach.specialization?.name ?? ""}</p>
                          </div>
                          {form.coachId === coach.id && <IcoCheck />}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
            )}

            {/* المدرب الاحتياطي */}
            {!indeCoach && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">المدرب الاحتياطي</label>
              <div className="relative">
                <div className={INPUT_CLS + " flex items-center justify-between cursor-pointer opacity-60"}>
                  <span className="text-slate-400 text-sm">اختر المدرب الاحتياطي...</span>
                  <IcoChevron />
                </div>
              </div>
            </div>
            )}

            {/* عدد المتدربين */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">عدد المتدربين</label>
              <div className="relative" dir="ltr">
                <input
                  type="number" min="1"
                  value={form.maxCapacity || ""}
                  onChange={e => set("maxCapacity", e.target.value)}
                  placeholder="000"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </span>
              </div>
            </div>

            {/* السعر لكل متدرب */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">السعر لكل متدرب</label>
              <div className="relative" dir="ltr">
                <input value={form.price} onChange={e => set("price", e.target.value)}
                  placeholder="000"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none">﷼</span>
              </div>
            </div>

            {/* التصنيف */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                التصنيف <span className="text-red-400">*</span>
              </label>
              <div className="relative" ref={categoryRef}>
                <div onClick={() => setCategoryOpen(o => !o)}
                  className={INPUT_CLS + " flex items-center justify-between cursor-pointer"}
                  style={tab1Touched && !form.categoryId ? { borderColor: "#fca5a5", background: "#fff5f5" } : {}}>
                  {form.categoryId
                    ? <span className="text-sm text-slate-700">{form.categoryName}</span>
                    : <span className="text-slate-400 text-sm">اختر التصنيف...</span>}
                  <IcoChevron />
                </div>
                {categoryOpen && (
                  <div className="absolute top-full right-0 left-0 mt-1.5 z-50 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-lg">
                    {fields.length === 0
                      ? <p className="text-xs text-slate-400 text-center py-4">جاري التحميل...</p>
                      : fields.map(field => (
                        <div key={field.id}
                          onClick={() => { set("categoryId", field.id); set("categoryName", field.name); setCategoryOpen(false); }}
                          className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition text-sm text-right"
                          style={form.categoryId === field.id
                            ? { background: "#f0fdf4", fontWeight: 600, color: "#024677" }
                            : { color: "#64748b" }}>
                          {field.name}
                          {form.categoryId === field.id && <span className="inline mr-2"><IcoCheck /></span>}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Next button */}
            <div className="flex items-center gap-3 pt-4 pb-2">
              <button type="button" onClick={() => {
                setTab1Touched(true);
                const missing = [];
                if (!form.categoryId)                              missing.push("التصنيف");
                if (!indeCoach && !form.coachId)                   missing.push("المدرب المسؤول");
                if (!(form.coverImage instanceof File))            missing.push("صورة الغلاف");
                if (missing.length > 0) {
                  setError(`يرجى إكمال الحقول التالية: ${missing.join(" — ")}`);
                  return;
                }
                setError(null);
                setActiveTab(2);
              }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#024677" }}>
                التالي: الجدول الزمني
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={onBack} type="button"
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition">
                إلغاء
              </button>
            </div>

            {/* validation error */}
            {error && activeTab === 1 && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-right">
                ⚠️ {error}
              </p>
            )}

            </>)}

            {/* ════ TAB 2: الجدول الزمني ════ */}
            {activeTab === 2 && (<>

            {/* ── بوكس الجدول الزمني ── */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4" style={{ background: "#fff" }}>
              <h3 className="text-sm font-bold text-slate-800 text-right">الجدول الزمني</h3>

              {/* صف 1: تاريخ البداية + التكرار */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">تاريخ البداية <span className="text-red-400">*</span></p>
                  <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">التكرار <span className="text-red-400">*</span></p>
                  <div className="relative">
                    <select value={form.recurrence || "weekly"} onChange={e => set("recurrence", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right appearance-none cursor-pointer">
                      <option value="weekly">أسبوعي</option>
                      <option value="biweekly">كل أسبوعين</option>
                      <option value="monthly">شهري</option>
                      <option value="daily">يومي</option>
                    </select>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcoChevron /></span>
                  </div>
                </div>
              </div>

              {/* صف 2: وقت بداية الجلسة + مدة الجلسة */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">وقت بداية الجلسة</p>
                  <input type="time" value={form.sessionTime || ""} onChange={e => set("sessionTime", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">مدة الجلسة</p>
                  <div className="relative">
                    <select value={form.sessionDuration || "60"} onChange={e => set("sessionDuration", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right appearance-none cursor-pointer">
                      <option value="30">30 دقيقة</option>
                      <option value="60">60 دقيقة</option>
                      <option value="90">90 دقيقة</option>
                      <option value="120">120 دقيقة</option>
                      <option value="180">180 دقيقة</option>
                    </select>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcoChevron /></span>
                  </div>
                </div>
              </div>

              {/* صف 3: عدد الجلسات + تواريخ مستثناة */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">عدد الجلسات</p>
                  <input type="number" min="1" value={form.totalSessions} onChange={e => set("totalSessions", e.target.value)}
                    placeholder="14"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">تواريخ مستثناة (إجازات)</p>
                  <MultiDatePicker
                    selected={form.excludedDates || []}
                    onChange={val => set("excludedDates", val)}
                  />
                </div>
              </div>

              {/* أيام الجلسات الأسبوعية */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium text-right">أيام الجلسات الأسبوعية</p>
                <div className="flex items-center gap-4 flex-wrap" dir="rtl">
                  {["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"].map(day => (
                    <label key={day} className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={(form.weekDays || []).includes(day)}
                        onChange={e => {
                          const days = form.weekDays || [];
                          set("weekDays", e.target.checked ? [...days, day] : days.filter(d => d !== day));
                        }}
                        className="w-4 h-4 rounded border-slate-300 accent-teal-500"
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* nav buttons */}
            <div className="flex items-center gap-3 pt-4 pb-2">
              <button type="button" onClick={() => setActiveTab(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
                style={{ background: "#024677" }}>
                التالي: مراجعة نهائية
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button type="button" onClick={() => setActiveTab(1)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
                السابق
              </button>
            </div>

            </>)}

            {/* ════ TAB 3: المحتوى والتقييمات ════ */}
            {activeTab === 3 && (<>

            <div className="flex flex-row-reverse gap-4 items-start">

              {/* sidebar: قائمة الوحدات — على الشمال — يظهر فقط لو في وحدات */}
              {form.units?.length > 0 && (
                <UnitsSidebar
                  units={form.units}
                  selectedLesson={selectedLesson}
                  onSelectLesson={setSelectedLesson}
                />
              )}

              {/* main — على اليمين */}
              <div className="flex-1 min-w-0 space-y-3" dir="rtl">

                {/* ── هيكل المحتوى — يظهر فقط لو في وحدات مضافة ── */}
                {form.units?.length > 0 && !form.addingUnit && (
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 text-right">هيكل المحتوى التدريبي</h3>
                      <p className="text-xs text-slate-400 text-right mt-1">قم ببناء هيكل المحتوى بإضافة الوحدات والدروس والتقييمات</p>
                    </div>
                    <div className="space-y-2">
                      {form.units.map((unit, i) => (
                        <UnitAccordionRow
                          key={unit.id ?? i}
                          unit={unit}
                          index={i}
                          onSelectLesson={setSelectedLesson}
                          selectedLesson={selectedLesson}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => set("addingUnit", true)}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl py-3 text-sm font-medium text-slate-500 hover:border-teal-400 hover:text-teal-600 transition">
                      <IcoPlus />
                      إضافة وحدة جديدة للمنهج
                    </button>
                  </div>
                )}

                {/* فورم إضافة وحدة — يظهر تلقائياً لو مفيش وحدات، أو لما يضغط "إضافة وحدة" */}
                {(form.addingUnit || !form.units?.length) && (
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4" dir="rtl">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 text-right">إضافة وحدة</h3>
                      <p className="text-xs text-slate-400 text-right mt-1">أملأ البيانات التالية لإنشاء جلسة تدريبية وتقسيمها إلى أقسام</p>
                    </div>

                    {/* اسم الوحدة */}
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1.5 text-right">اسم الوحدة</label>
                      <input
                        value={form.newUnitTitle || ""}
                        onChange={e => set("newUnitTitle", e.target.value)}
                        placeholder="مثال: مقدمة في لغة البرمجة جافا سكريبت"
                        className={INPUT_CLS}
                      />
                    </div>

                    {/* وصف الوحدة */}
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1.5 text-right">وصف الوحدة</label>
                      <textarea
                        value={form.newUnitDesc || ""}
                        onChange={e => set("newUnitDesc", e.target.value)}
                        placeholder="اكتب وصفاً موجزاً للمفاهيم التي سيتم تغطيتها خلال هذه الجلسات.."
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none"
                      />
                    </div>

                    {/* عدد الدروس */}
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2 text-right">عدد الدروس داخل الوحدة</label>
                      <div className="flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl bg-white" dir="ltr">
                        <div className="flex items-center gap-3">
                          <button type="button"
                            onClick={() => set("newUnitLessons", Math.max(1, (form.newUnitLessons || 3) - 1))}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 transition text-base font-bold">
                            −
                          </button>
                          <button type="button"
                            onClick={() => set("newUnitLessons", (form.newUnitLessons || 3) + 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 transition text-base font-bold">
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-slate-700" dir="rtl">
                          {form.newUnitLessons || 3} دروس
                        </span>
                      </div>
                    </div>

                    {/* أسماء الدروس */}
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2 text-right">أسماء الدروس</label>
                      <div className="space-y-2">
                        {Array.from({ length: form.newUnitLessons || 3 }, (_, i) => (
                          <div key={i} className="flex items-center gap-2" dir="rtl">
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: "#024677" }}>{i + 1}</span>
                            <input
                              value={(form.newUnitLessonNames || [])[i] || ""}
                              onChange={e => {
                                const names = [...(form.newUnitLessonNames || Array(form.newUnitLessons || 3).fill(""))];
                                names[i] = e.target.value;
                                set("newUnitLessonNames", names);
                              }}
                              placeholder={`الجلسة ${['الأولى','الثانية','الثالثة','الرابعة','الخامسة'][i] || i + 1}`}
                              dir="rtl"
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* أزرار */}
                    <div className="flex items-center gap-3 pt-2">
                      <button type="button"
                        onClick={() => {
                          const units = form.units || [];
                          const n = units.length + 1;
                          const names = ["الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابعة","الثامنة"];
                          set("units", [...units, {
                            id: Date.now(),
                            title: form.newUnitTitle || `الوحدة ${names[n-1] || n}`,
                            desc: form.newUnitDesc || "",
                            lessons: form.newUnitLessons || 3,
                            hours: 0,
                            lessonNames: form.newUnitLessonNames || [],
                          }]);
                          set("addingUnit", false);
                          set("newUnitTitle", "");
                          set("newUnitDesc", "");
                          set("newUnitLessons", 3);
                          set("newUnitLessonNames", []);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-dashed border-slate-300 text-slate-500 hover:border-teal-400 hover:text-teal-600 transition">
                        <IcoPlus />
                        إضافة درس
                      </button>
                      <button type="button"
                        onClick={() => { set("addingUnit", false); set("newUnitTitle",""); set("newUnitDesc",""); }}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
                        style={{ background: "#024677" }}
                        hidden={!form.units?.length}>
                        تخطي
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* error */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-right">{error}</p>
            )}

            {/* actions */}
            <div className="flex items-center gap-3 pt-4 pb-8">
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#024677" }}>
                {saving ? <IcoSpinner /> : <IcoSend />}
                إرسال للمراجعة
              </button>
              <button onClick={onBack}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
                إلغاء
              </button>
            </div>

            </>)}

          </div>

          {/* ── preview sidebar — only on tabs 1 & 2 ── */}
          {activeTab !== 3 && (
            <ProgramPreview form={form} sessions={sessions} doneCount={doneCount} indeCoach={indeCoach} />
          )}
        </div>
      </div>

      {/* submit success modal */}
      {submitMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setSubmitMsg(null)}>
          <div dir="rtl" onClick={e => e.stopPropagation()}
            className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#F0F7FF", color: "#024677" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.5 7h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-4m-8-13a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h4" />
                <line x1="2" y1="2" x2="2" y2="16" />
                <line x1="2" y1="6" x2="2" y2="10" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">تم إرسال البرنامج للمراجعة</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">{submitMsg}</p>
            <button
              onClick={() => { setSubmitMsg(null); onBack?.(); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "#024677" }}>
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
