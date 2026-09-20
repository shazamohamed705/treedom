import { useState, useEffect, useRef } from "react";
import { fetchCoaches, fetchFields, createProgram, submitProgram } from "../services/api";
import { SESSION_TYPE_TO_INT, isRecordedSession } from "../services/sessionType";
import { useToast } from "./ToastProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const I = ({ d, size = 14, stroke = "currentColor", sw = 2, fill = "none", cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>{d}</svg>
);
const IcoGrad    = () => <I size={18} stroke="#14b8a6" d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>}/>;
const IcoChevron = () => <I d={<polyline points="6 9 12 15 18 9"/>}/>;
const IcoCheck   = () => <I stroke="#14b8a6" d={<polyline points="20 6 9 17 4 12"/>}/>;
const IcoSlash   = () => <I d={<line x1="16" y1="4" x2="8" y2="20"/>} stroke="#cbd5e1"/>;
const IcoPlus    = () => <I size={13} sw={2.5} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>;
const IcoX       = () => <I size={10} sw={2.5} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const IcoTrash   = () => <I size={13} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>}/>;
const IcoSend    = () => <I size={15} stroke="white" sw={2.5} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>;
const IcoSpinner = () => (
  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Session type map
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_TYPES = [
  { key: "zoom",     label: "أونلاين (Zoom)",  typeNum: 0 },
  { key: "recorded", label: "مسجلة",            typeNum: 1 },
  { key: "offline",  label: "حضوري",            typeNum: 2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tag input
// ─────────────────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  return (
    <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl bg-white min-h-[48px]">
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg"
          style={{ background: "#E6F0F8", color: "#024677" }}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}
            className="hover:text-red-500 transition"><IcoX /></button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        placeholder="أضف كلمة واضغط Enter"
        className="flex-1 min-w-[120px] text-xs outline-none placeholder:text-slate-400 bg-transparent text-right"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single session card (inside the program form)
// ─────────────────────────────────────────────────────────────────────────────
function SessionCard({ index, data, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "#14b8a6" }}>{index}</span>
          <span className="text-sm font-semibold text-slate-700">
            {data.title || `جلسة ${index}`}
          </span>
        </div>
        <button type="button" onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition p-1">
          <IcoTrash />
        </button>
      </div>

      {/* body */}
      <div className="p-4 space-y-4">
        {/* type selector */}
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">نوع الجلسة</p>
          <div className="flex gap-2 flex-wrap">
            {SESSION_TYPES.map(t => (
              <button key={t.key} type="button" onClick={() => set("type", t.key)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={data.type === t.key
                  ? { background: "#024677", color: "#fff", borderColor: "#024677" }
                  : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* title */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
            عنوان الجلسة <span className="text-red-400">*</span>
          </label>
          <input value={data.title} onChange={e => set("title", e.target.value)}
            placeholder="أضف عنوان الجلسة"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right" />
        </div>

        {/* date always; start/end times not for recorded */}
        {isRecordedSession(data.type) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5">التاريخ</p>
            <input type="date" value={data.date ?? ""}
              onChange={e => set("date", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">مدة الجلسة (دقيقة)</p>
            <input type="number" value={data.duration ?? "60"} onChange={e => set("duration", e.target.value)}
              placeholder="60"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
          </div>
        </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "التاريخ", key: "date", type: "date" },
            { label: "وقت البدء", key: "time", type: "time" },
            { label: "وقت الانتهاء", key: "timeTo", type: "time" },
          ].map(f => (
            <div key={f.key}>
              <p className="text-xs text-slate-500 mb-1.5">{f.label}</p>
              <input type={f.type} value={data[f.key] ?? ""}
                onChange={e => set(f.key, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
            </div>
          ))}
        </div>
        )}

        {/* type-specific fields */}
        {data.type === "zoom" && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">رابط Zoom</p>
            <input value={data.zoomLink ?? ""} onChange={e => set("zoomLink", e.target.value)}
              placeholder="https://zoom.us/j/..." dir="ltr"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400" />
          </div>
        )}
        {data.type === "offline" && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">مكان الجلسة / القاعة</p>
            <input value={data.location ?? ""} onChange={e => set("location", e.target.value)}
              placeholder="مثال: قاعة A - الطابق الثالث"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar icons
// ─────────────────────────────────────────────────────────────────────────────
const IcoCheckFill = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="#14b8a6" />
    <polyline points="4.5 8 7 10.5 11.5 5.5"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoWarn = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="#f59e0b" />
    <line x1="8" y1="5" x2="8" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="8" cy="11.5" r="0.9" fill="white" />
  </svg>
);
const IcoCircle = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#cbd5e1" strokeWidth="1.5" />
  </svg>
);

// helper: session type label in Arabic
function sessionTypeLabel(type) {
  if (type === "zoom")     return "جلسة تفاعلية عبر زووم";
  if (type === "recorded") return "جلسة مسجلة";
  if (type === "offline")  return "جلسة حضورية";
  return "جلسة";
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress sidebar
// ─────────────────────────────────────────────────────────────────────────────
function ProgressSidebar({ form, sessions }) {
  // ── section 1: program overview stats ──────────────────────────────────────
  const totalHours = parseInt(form.hours || 0);
  const totalSess  = parseInt(form.totalSessions || 0);
  const liveCount  = sessions.filter(s => s.type === "zoom").length;
  const recCount   = sessions.filter(s => s.type === "recorded").length;
  // videos uploaded: recorded sessions that have a title (proxy for "uploaded")
  const vidUploaded = sessions.filter(s => s.type === "recorded" && s.title).length;
  const priceNum   = parseFloat(form.price || 0);

  // ── section 2: session readiness ───────────────────────────────────────────
  const sessionItems = sessions.map((s, i) => {
    const hasTitle = !!s.title;
    const recorded = isRecordedSession(s.type);
    const hasDate  = !!s.date;
    const hasTime  = !!s.time;
    const isReady  = recorded ? (hasTitle && hasDate) : (hasTitle && hasDate && hasTime);
    const isWarn   = hasTitle && !isReady;
    return {
      num: i + 1,
      label: s.title || `جلسة ${i + 1}`,
      subLabel: sessionTypeLabel(s.type),
      status: isReady ? "done" : isWarn ? "warn" : "empty",
      typeText: recorded ? "مسجل" : s.type === "offline" ? "حضوري" : "",
    };
  });

  // readiness %
  const readyCount = sessionItems.filter(s => s.status === "done").length;
  const readinessPct = sessions.length > 0
    ? Math.round((readyCount / sessions.length) * 100)
    : 0;

  // ── section 3: review checklist ────────────────────────────────────────────
  const checklist = [
    { label: "عنوان البرنامج",        done: !!form.name },
    { label: "وصف البرنامج",          done: !!form.desc },
    { label: "المدرب المسؤول",        done: !!form.coachId },
    { label: "تاريخ البدء والانتهاء", done: !!(form.startDate && form.endDate) },
    { label: "السعر المحدد",          done: !!form.price },
    { label: "جميع الجلسات مكتملة",  done: sessions.length > 0 && readyCount === sessions.length },
  ];

  return (
    <div className="sticky top-4 flex flex-col gap-4 w-full xl:w-[272px] shrink-0" dir="rtl">

      {/* ── Card 1: نظرة عامة على البرنامج ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-extrabold text-slate-800">نظرة عامة على البرنامج</p>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { label: "السعر",              value: priceNum   ? `${priceNum.toLocaleString()} /متدرب` : "—" },
            { label: "إجمالي الجلسات",    value: totalSess  ? `${totalSess} جلسة` : "—" },
            { label: "إجمالي الساعات",    value: totalHours ? `${totalHours} ساعة` : "—" },
            { label: "جلسات مسجلة",       value: recCount   ? `${recCount} جلسة` : "—" },
            { label: "جلسات مباشرة",      value: liveCount  ? `${liveCount} جلسة` : "—" },
            { label: "فيديوهات مرفوعة",   value: `${vidUploaded} / ${recCount || 0}` },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-slate-400">{r.label}</span>
              <span className="text-xs font-bold text-slate-700">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Card 2: جاهزية الجلسات ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-extrabold text-slate-800">جاهزية الجلسات</p>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">لم تُضف جلسات بعد</p>
          ) : (
            sessionItems.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {/* status icon */}
                <div className="shrink-0 mt-0.5">
                  {s.status === "done"  && <IcoCheckFill />}
                  {s.status === "warn"  && <IcoWarn />}
                  {s.status === "empty" && <IcoCircle />}
                </div>
                {/* text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-700 truncate leading-snug">
                      {s.num}. {s.label}
                    </p>
                    {s.typeText && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: "#E6F0F8", color: "#024677" }}>
                        {s.typeText}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-500 mt-0.5 truncate">{s.subLabel}</p>
                </div>
              </div>
            ))
          )}

          {/* readiness progress bar */}
          {sessions.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400">جاهزية المنهج</span>
                <span className="text-[11px] font-bold text-slate-600">{readinessPct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${readinessPct}%`, background: "#14b8a6" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Card 3: قائمة الإرسال للمراجعة ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-sm font-extrabold text-slate-800">قائمة الإرسال للمراجعة</p>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {checklist.map((c, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="shrink-0">
                {c.done ? <IcoCheckFill /> : <IcoCircle />}
              </div>
              <span className={`text-xs leading-snug ${c.done ? "text-slate-700 font-semibold" : "text-slate-400"}`}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const newSession = () => ({
  id: Date.now() + Math.random(),
  type: "zoom",
  title: "",
  date: "",
  time: "",
  timeTo: "",
  duration: "60",
  zoomLink: "",
  location: "",
});

export default function CompanyAddProgramPage({ onBack }) {
  const showToast = useToast();

  const [form, setForm] = useState({
    name: "", desc: "", coachId: "", coachName: "", coachAvatar: "",
    fieldId: "", fieldName: "",
    totalSessions: "12", hours: "36",
    startDate: "", endDate: "", price: "",
    tags: [],
  });
  const [sessions,   setSessions]   = useState([]);
  const [coaches,    setCoaches]    = useState([]);
  const [fields,     setFields]     = useState([]);
  const [coachOpen,  setCoachOpen]  = useState(false);
  const [fieldOpen,  setFieldOpen]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const coachRef = useRef();
  const fieldRef = useRef();

  // close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (coachRef.current && !coachRef.current.contains(e.target)) setCoachOpen(false);
      if (fieldRef.current && !fieldRef.current.contains(e.target)) setFieldOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // load coaches + fields
  useEffect(() => {
    fetchCoaches({ per_page: 100 }).then(r => setCoaches(r.data?.coaches ?? [])).catch(() => {});
    fetchFields({ per_page: 100 }).then(r => setFields(r.data?.fields ?? [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // build FormData
  const buildFormData = (isDraft) => {
    const fd = new FormData();
    fd.append("name[ar]", form.name);
    fd.append("name[en]", form.name);
    fd.append("description[ar]", form.desc);
    fd.append("description[en]", form.desc);
    fd.append("field_id",              form.fieldId || "1");
    fd.append("coach_id",              form.coachId);
    fd.append("price_amount",          form.price || "0");
    fd.append("hours_count",           form.hours);
    fd.append("max_capacity",          "15");
    fd.append("sessions_count_planned",form.totalSessions);
    fd.append("start_date",            form.startDate);
    fd.append("end_date",              form.endDate);
    fd.append("is_draft",              isDraft ? "1" : "0");
    form.tags.forEach(t => fd.append("keywords[]", t));

    const typeMap = SESSION_TYPE_TO_INT;
    const contentType = sessions.length > 0 ? (typeMap[sessions[0].type] ?? 0) : 0;
    fd.append("content_type", String(contentType));

    sessions.forEach((s, i) => {
      const prefix = `sessions[${i}]`;
      const recorded = isRecordedSession(s.type);
      fd.append(`${prefix}[title][ar]`, s.title || "جلسة");
      fd.append(`${prefix}[title][en]`, s.title || "Session");
      fd.append(`${prefix}[type]`,      String(typeMap[s.type] ?? 0));
      if (s.date) fd.append(`${prefix}[date]`, s.date);
      if (!recorded && s.time) fd.append(`${prefix}[starts_at]`, s.time);

      if (!recorded && s.type === "offline" && s.time && s.timeTo) {
        const [sh, sm] = s.time.split(":").map(Number);
        const [eh, em] = s.timeTo.split(":").map(Number);
        const mins = eh * 60 + em - (sh * 60 + sm);
        fd.append(`${prefix}[duration_minutes]`, mins > 0 ? String(mins) : "60");
      } else {
        fd.append(`${prefix}[duration_minutes]`, s.duration || "60");
      }
      if (s.type === "zoom"    && s.zoomLink)  fd.append(`${prefix}[meeting_url]`, s.zoomLink);
      if (s.type === "offline" && s.location)  fd.append(`${prefix}[location]`,    s.location);
    });
    return fd;
  };

  const handleSaveDraft = async () => {
    if (!form.name) { setError("اسم البرنامج مطلوب"); return; }
    setLoading(true); setError(null);
    try {
      await createProgram(buildFormData(true));
      showToast("تم حفظ البرنامج كمسودة", "success");
      setTimeout(() => onBack?.(), 1500);
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setError("اسم البرنامج وتاريخ البدء والانتهاء مطلوبة");
      return;
    }
    setLoading(true); setError(null);
    try {
      const created = await createProgram(buildFormData(false));
      const result  = await submitProgram(created.data.id);
      const msg = result?.message ?? "تم إرسال البرنامج للمراجعة";
      setSuccessMsg(msg);
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <IcoGrad />
          <button onClick={onBack}
            className="text-sm font-semibold text-slate-500 hover:text-teal-600 transition">
            البرامج التدريبية
          </button>
          <IcoSlash />
          <span className="text-sm font-bold" style={{ color: "#024677" }}>إضافة برنامج جديد</span>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 xl:gap-10 items-start">

          {/* ── form column ── */}
          <div className="w-full xl:flex-1 space-y-6">

            {/* program name */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">اسم البرنامج</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="أضف اسم البرنامج"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right" />
            </div>

            {/* description */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">وصف البرنامج</label>
              <textarea value={form.desc} onChange={e => set("desc", e.target.value)}
                placeholder="اكتب وصفاً شاملاً للبرنامج التدريبي" rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none" />
            </div>

            {/* coach dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">المدرب المسؤول</label>
              <div className="relative" ref={coachRef}>
                <div onClick={() => setCoachOpen(o => !o)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white flex items-center justify-between cursor-pointer hover:border-teal-400 transition">
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
                      : coaches.map(c => (
                        <div key={c.id}
                          onClick={() => {
                            set("coachId", c.id);
                            set("coachName", c.name);
                            set("coachAvatar", c.name.trim()[0] ?? "م");
                            setCoachOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                          style={form.coachId === c.id ? { background: "#f0fdf4" } : {}}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: "#14b8a6" }}>{c.name.trim()[0]}</div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-sm font-semibold text-slate-700 truncate">{c.name}</p>
                            <p className="text-xs text-slate-400 truncate">{c.specialization?.name ?? ""}</p>
                          </div>
                          {form.coachId === c.id && <IcoCheck />}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* field dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">التصنيف</label>
              <div className="relative" ref={fieldRef}>
                <div onClick={() => setFieldOpen(o => !o)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white flex items-center justify-between cursor-pointer hover:border-teal-400 transition">
                  {form.fieldId
                    ? <span className="text-sm text-slate-700">{form.fieldName}</span>
                    : <span className="text-slate-400 text-sm">اختر التصنيف...</span>}
                  <IcoChevron />
                </div>
                {fieldOpen && (
                  <div className="absolute top-full right-0 left-0 mt-1.5 z-50 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                    {fields.length === 0
                      ? <p className="text-xs text-slate-400 text-center py-4">جاري التحميل...</p>
                      : fields.map(f => (
                        <div key={f.id}
                          onClick={() => { set("fieldId", f.id); set("fieldName", f.name); setFieldOpen(false); }}
                          className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition text-sm text-right"
                          style={form.fieldId === f.id ? { background: "#f0fdf4", fontWeight: 600, color: "#024677" } : { color: "#64748b" }}>
                          {f.name}
                          {form.fieldId === f.id && <IcoCheck />}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* tags */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">الكلمات المفتاحية</label>
              <TagInput tags={form.tags} onChange={v => set("tags", v)} />
            </div>

            {/* schedule */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">الجدول الزمني</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { label: "إجمالي الجلسات", key: "totalSessions", ph: "12" },
                  { label: "إجمالي الساعات", key: "hours",         ph: "36" },
                  { label: "تاريخ البدء",     key: "startDate",    type: "date" },
                  { label: "تاريخ الانتهاء",  key: "endDate",      type: "date" },
                ].map(f => (
                  <div key={f.key}>
                    <p className="text-xs text-slate-500 mb-1.5 font-medium">{f.label}</p>
                    <input type={f.type || "text"} value={form[f.key]}
                      onChange={e => set(f.key, e.target.value)} placeholder={f.ph || ""}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400" />
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

              <div className="space-y-3">
                {sessions.map((s, i) => (
                  <SessionCard
                    key={s.id}
                    index={i + 1}
                    data={s}
                    onChange={updated => setSessions(ss => ss.map(x => x.id === s.id ? { ...x, ...updated } : x))}
                    onRemove={() => setSessions(ss => ss.filter(x => x.id !== s.id))}
                  />
                ))}
              </div>

              <button type="button"
                onClick={() => setSessions(ss => [...ss, newSession()])}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl py-3.5 text-sm font-medium text-slate-500 hover:border-teal-400 hover:text-teal-600 transition mt-3">
                <IcoPlus />إضافة جلسة جديدة للمنهج
              </button>
            </div>

            {/* errors / messages */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-right">{error}</p>
            )}

            {/* action buttons */}
            <div className="flex items-center gap-3 pt-4 pb-8 flex-wrap">
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#024677" }}>
                {loading ? <IcoSpinner /> : <IcoSend />}
                إرسال للمراجعة
              </button>
              <button onClick={handleSaveDraft} disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                حفظ كمسودة
              </button>
              <button onClick={onBack}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition">
                إلغاء
              </button>
            </div>
          </div>

          {/* ── progress sidebar ── */}
          <ProgressSidebar form={form} sessions={sessions} />
        </div>
      </div>

      {/* success modal */}
      {successMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setSuccessMsg(null)}>
          <div dir="rtl" onClick={e => e.stopPropagation()}
            className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#F0F7FF", color: "#024677" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.5 7h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-4m-8-13a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h4"/>
                <line x1="2" y1="2" x2="2" y2="16"/>
                <line x1="2" y1="6" x2="2" y2="10"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">تم إرسال البرنامج للمراجعة</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">{successMsg}</p>
            <button onClick={() => { setSuccessMsg(null); onBack?.(); }}
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