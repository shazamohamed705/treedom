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
  tags: ["تصميم واجهات", "UX Design", "Figma", "الأنيميشن"],
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

// ── main ──────────────────────────────────────────────────────────────────────
export default function AddProgramPage({ onBack }) {
  const navigate  = useNavigate();
  const showToast = useToast();
  const { autoZoom } = useZoomAuto();
  const indeCoach = isIndeCoach();

  const draft = loadDraft();
  const [sessions,  setSessions]  = useState(draft?.sessions ?? []);
  const [form,      setForm]      = useState(draft?.form     ?? { ...DEFAULT_FORM });
  const [coaches,   setCoaches]   = useState([]);
  const [fields,    setFields]    = useState([]);
  const [approvedPrograms, setApprovedPrograms] = useState([]);

  const [coachOpen,    setCoachOpen]    = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const coachRef    = useRef();
  const categoryRef = useRef();

  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitMsg, setSubmitMsg] = useState(null);

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
        const key = String(f.name ?? f.name_translations?.ar ?? "").trim();
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

  return (
    <main className="flex-1 overflow-y-auto bg-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 flex-wrap">
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

        <div className="flex flex-col xl:flex-row gap-6 xl:gap-16 items-start">

          {/* ── form ── */}
          <div className="w-full xl:w-[720px] xl:shrink-0 space-y-6 xl:mr-6">

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

            {/* name */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">اسم البرنامج</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="أضف اسم البرنامج" className={INPUT_CLS} />
            </div>

            {/* description */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">وصف البرنامج</label>
              <textarea value={form.desc} onChange={e => set("desc", e.target.value)}
                placeholder="اكتب وصف شامل للبرنامج التدريبي"
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none" />
            </div>

            {/* coach — inde_coach is the trainer; API does not take coach_id */}
            {!indeCoach && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">المدرب المسؤول</label>
              <div className="relative" ref={coachRef}>
                <div onClick={() => setCoachOpen(o => !o)}
                  className={INPUT_CLS + " flex items-center justify-between cursor-pointer"}>
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

            {/* category */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">التصنيف</label>
              <div className="relative" ref={categoryRef}>
                <div onClick={() => setCategoryOpen(o => !o)}
                  className={INPUT_CLS + " flex items-center justify-between cursor-pointer"}>
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
                          <span>{field.name}</span>
                          {form.categoryId === field.id && (
                            <span className="inline mr-2"><IcoCheck /></span>
                          )}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* tags */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">الكلمات المفتاحية والفئات</label>
              <TagInput tags={form.tags} onChange={tags => set("tags", tags)} />
            </div>

            {/* schedule */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">الجدول الزمني</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { label: "إجمالي الجلسات",  key: "totalSessions", ph: "12"      },
                  { label: "إجمالي الساعات",   key: "hours",         ph: "36"      },
                  { label: "تاريخ البدء",       key: "startDate",     type: "date" },
                  { label: "تاريخ الانتهاء",    key: "endDate",       type: "date" },
                ].map(f => (
                  <div key={f.key}>
                    <p className="text-xs text-slate-500 mb-1.5 font-medium">{f.label}</p>
                    <input
                      type={f.type || "text"}
                      value={form[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder={f.ph || ""}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* price */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">السعر لكل متدرب</label>
              <div className="relative" dir="ltr">
                <input value={form.price} onChange={e => set("price", e.target.value)}
                  placeholder="000"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none">﷼</span>
              </div>
            </div>

            {/* sessions */}
            <div className="pt-1 border-t border-slate-100">
              <h2 className="text-xl font-bold mt-4 mb-1" style={{ color: "#024677" }}>
                المحتوى التدريبي (الجلسات)
              </h2>
              <p className="text-xs text-slate-400 mb-4">أضف ورتّب جلسات البرنامج التدريبية</p>

              {sessions.map((session, i) => (
                <div key={session.id} className="mb-3">
                  <SessionCard
                    index={i + 1}
                    data={session}
                    coaches={coaches}
                    autoZoom={autoZoom || indeCoach}
                    hideCoach={indeCoach}
                    onChange={changes => setSessions(prev =>
                      prev.map(s => s.id === session.id ? { ...s, ...changes } : s)
                    )}
                    onRemove={() => setSessions(prev => prev.filter(s => s.id !== session.id))}
                  />
                </div>
              ))}

              <button
                onClick={() => setSessions(prev => [...prev, newSession()])}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl py-3.5 text-sm font-medium text-slate-500 hover:border-teal-400 hover:text-teal-600 transition mt-2">
                <IcoPlus />
                إضافة جلسة جديدة للمنهج
              </button>
            </div>

            {/* error / success */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-right">{error}</p>
            )}
            {successMsg && (
              <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2 text-right">{successMsg}</p>
            )}

            {/* actions */}
            <div className="flex items-center gap-3 pt-4 pb-8 flex-wrap">
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#024677" }}>
                {saving ? <IcoSpinner /> : <IcoSend />}
                إرسال للمراجعة
              </button>
              <button onClick={handleSaveDraft} disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                حفظ كمسودة
              </button>
              <button onClick={onBack}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition">
                إلغاء
              </button>
            </div>
          </div>

          {/* ── preview sidebar ── */}
          <ProgramPreview form={form} sessions={sessions} doneCount={doneCount} indeCoach={indeCoach} />
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
