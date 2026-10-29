import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../shared/ToastProvider";
import {
  fetchCoaches,
  fetchApprovedPrograms,
  createSession,
  updateSession,
  createCoachSession,
  fetchCoachPrograms,
  fetchSession,
  fetchProgramUnits,
} from "../../services/api";
import { getUserRole, isIndeCoach } from "../../services/auth";
import { SESSION_TYPE_TO_INT, sessionTypeToInt, isRecordedSession } from "../../services/sessionType";
import useZoomAuto from "../../hooks/useZoomAuto";
import ZoomSessionLink from "../shared/ZoomSessionLink";

// 0 Zoom | 1 recorded | 2 offline
const TYPE_TO_INT = SESSION_TYPE_TO_INT;

// ── shared input class ────────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:border-teal-400 transition text-right " +
  "placeholder:text-slate-400";

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
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

function IcoCheck() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── session type selector — dropdown ─────────────────────────────────────────
const SESSION_TYPES = [
  { value: "zoom",     label: "أونلاين (Zoom)" },
  { value: "offline",  label: "حضوري"          },
  { value: "recorded", label: "مسجّل"           },
];

function SessionTypeSelector({ value, onChange }) {
  return (
    <div className="relative" dir="rtl">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={INPUT_CLS + " appearance-none cursor-pointer pr-4 pl-8"}
      >
        {SESSION_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      {/* chevron */}
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </div>
  );
}

function isVideoFile(f) {
  if (!f || typeof f !== "object") return false;
  if (f.type && String(f.type).startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(f.name || "");
}

function splitUploadFiles(list = []) {
  const files = Array.from(list || []).filter(f => f instanceof File);
  return {
    videos: files.filter(isVideoFile),
    attachments: files.filter(f => !isVideoFile(f)),
  };
}

function uniqueFiles(files = []) {
  const seen = new Set();
  return files.filter(f => f instanceof File).filter(file => {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function appendSessionAttachments(fd, files = []) {
  uniqueFiles(files).forEach(file => {
    fd.append("attachments[]", file);
  });
}

// ── attachments list ──────────────────────────────────────────────────────────
function AttachmentsList({ attachments = [], onAdd, onRemove }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-700">مرفقات الجلسة</p>
      <div className="flex items-center gap-2 flex-wrap">
        {attachments.map((f, idx) => (
          <span
            key={`${f.name}-${idx}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {f.name}
            <button type="button" onClick={() => onRemove(idx)} className="hover:text-red-400 transition ml-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </span>
        ))}
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-slate-500 hover:border-teal-400 hover:text-teal-600 transition cursor-pointer">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          إضافة مرفق
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*,application/pdf"
            className="hidden"
            onChange={e => {
              onAdd(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {attachments.length > 0 && (
        <p className="text-[10px] text-slate-400">{attachments.length} ملف مرفق</p>
      )}
    </div>
  );
}

// ── video upload drop-zone ────────────────────────────────────────────────────
function VideoDropZone({ files = [], onChange, label = "رفع فيديو للجلسة (اختياري)" }) {
  const [dragging, setDragging] = useState(false);

  const addFiles = newFiles => {
    const { videos, attachments } = splitUploadFiles(newFiles);
    const merged = [...files];
    videos.forEach(f => {
      if (!merged.find(x => x.name === f.name && x.size === f.size)) merged.push(f);
    });
    onChange(merged, attachments);
  };

  const removeFile = idx => onChange(files.filter((_, i) => i !== idx));

  const handleDrop = e => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{label}</label>

      {/* drop area */}
      <label
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed cursor-pointer transition-colors"
        style={{
          minHeight: 130,
          borderColor: dragging ? "#14b8a6" : files.length ? "#14b8a6" : "#cbd5e1",
          background:  dragging ? "#f0fdfa" : files.length ? "#f0fdfa" : "#fafafa",
        }}>
        <input
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "#e2e8f0" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-slate-700">اسحب الملفات هنا</p>
          <p className="text-xs text-slate-400 mt-0.5">أو اضغط للاختيار من الجهاز</p>
        </div>
        <span className="text-[11px] text-slate-300">فيديو فقط — المرفقات من القسم التالي</span>
      </label>

      {/* file list */}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <li key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 bg-white"
              dir="rtl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-xs text-slate-700 flex-1 truncate">{f.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`}
              </span>
              <button type="button" onClick={() => removeFile(i)}
                className="text-slate-300 hover:text-red-400 transition shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function SessionTypeFields({ type, data, set, autoZoom, indeCoach }) {
  if (type === "zoom") {
    return (
      <ZoomSessionLink
        autoZoom={autoZoom}
        value={data.zoomLink}
        onChange={v => set("zoomLink", v)}
        inputClassName={INPUT_CLS}
      />
    );
  }

  if (type === "offline") {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
            مكان الجلسة
          </label>
          <input
            value={data.location}
            onChange={e => set("location", e.target.value)}
            placeholder="اسم القاعة أو العنوان..."
            className={INPUT_CLS}
          />
        </div>
        {indeCoach ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">خط العرض</label>
              <input
                value={data.latitude}
                onChange={e => set("latitude", e.target.value)}
                placeholder="24.7136"
                className={INPUT_CLS}
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">خط الطول</label>
              <input
                value={data.longitude}
                onChange={e => set("longitude", e.target.value)}
                placeholder="46.6753"
                className={INPUT_CLS}
                dir="ltr"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              الطاقة الاستيعابية
            </label>
            <input
              type="number"
              min="1"
              value={data.capacity}
              onChange={e => set("capacity", e.target.value)}
              placeholder="عدد المقاعد"
              className={INPUT_CLS}
              dir="ltr"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ── date + time fields (hide times for recorded) ──────────────────────────────
function DateTimeFields({ data, set, hideTimes = false }) {
  return (
    <div className={`grid grid-cols-1 ${hideTimes ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3`}>
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
          تاريخ الجلسة <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={data.date}
          onChange={e => set("date", e.target.value)}
          className={INPUT_CLS}
          dir="ltr"
        />
      </div>
      {!hideTimes && (
        <>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              وقت البداية
            </label>
            <input
              type="time"
              value={data.time}
              onChange={e => set("time", e.target.value)}
              className={INPUT_CLS}
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              وقت النهاية
            </label>
            <input
              type="time"
              value={data.timeTo}
              onChange={e => set("timeTo", e.target.value)}
              className={INPUT_CLS}
              dir="ltr"
            />
          </div>
        </>
      )}
      {hideTimes && (
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
            مدة الجلسة (دقيقة)
          </label>
          <input
            type="number"
            min="1"
            value={data.duration || "60"}
            onChange={e => set("duration", e.target.value)}
            placeholder="60"
            className={INPUT_CLS}
            dir="ltr"
          />
        </div>
      )}
    </div>
  );
}

// ── success modal ─────────────────────────────────────────────────────────────
function SuccessModal({ title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4 shadow-2xl"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
          <IcoCheck />
        </div>
        <h2 className="text-lg font-bold text-slate-800 text-center">
          تم حفظ الجلسة بنجاح
        </h2>
        {title && (
          <p className="text-sm text-slate-500 text-center">{title}</p>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "#024677" }}
        >
          حسناً
        </button>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function toDateInput(v) {
  if (!v) return "";
  const s = String(v).trim();
  const iso = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const dmy = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

function toTimeInput(v) {
  if (!v) return "";
  const s = String(v).trim();
  const m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!m) return "";
  let h = Number(m[1]);
  const min = m[2];
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function durationMinutes(data) {
  if (data.time && data.timeTo) {
    const [sh, sm] = data.time.split(":").map(Number);
    const [eh, em] = data.timeTo.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (mins > 0) return String(mins);
  }
  return String(data.duration || "60");
}

function resolveTypeString(rawType) {
  if (rawType == null) return "zoom";
  const n = sessionTypeToInt(rawType);
  if (n === 1) return "recorded";
  if (n === 2) return "offline";
  return "zoom";
}

// ── main component ────────────────────────────────────────────────────────────
export default function AddSessionPage({ onBack, session }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  // ممكن يجي programId + unitId من navigate state (من TrainingContentPage)
  const navState   = location.state ?? {};
  const showToast  = useToast();
  const isEdit     = !!session?.id;
  const { autoZoom } = useZoomAuto();

  const [type,    setType]    = useState("zoom");
  const [data,    setData]    = useState({
    title: "", titleEn: "", coachId: "",
    programId: navState.programId ? String(navState.programId) : "",
    unitId:    navState.unitId    ? String(navState.unitId)    : "",
    date: "", time: "", timeTo: "",
    duration: "60",
    zoomLink: "", location: "", capacity: "", latitude: "", longitude: "",
    videos: [], recordingFile: null, attachments: [],
  });
  const [uploadRecording, setUploadRecording] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [units,   setUnits]   = useState([]);  // وحدات البرنامج المختار

  // دالة الرجوع — تراعي لو جاي من المحتوى التدريبي
  const goBack = () => {
    if (navState.backTo) navigate(`/dashboard/${navState.backTo}`);
    else onBack?.();
  };

  const isCoach   = getUserRole() === "coach";
  const indeCoach = isIndeCoach();

  // load dropdowns + prefill when editing
  useEffect(() => {
    let active = true;

    if (!indeCoach) {
      fetchCoaches({ per_page: 100 })
        .then(r => { if (active) setCoaches(r.data?.coaches ?? []); })
        .catch(() => {});
    }

    if (isCoach) {
      fetchCoachPrograms({ per_page: 100 })
        .then(r => { if (active) setPrograms(r.data?.programs ?? []); })
        .catch(() => {});
    } else {
      fetchApprovedPrograms()
        .then(r => { if (active) setPrograms(r.data?.programs ?? []); })
        .catch(() => {});
    }

    const applySession = (raw) => {
      if (!raw) return;
      const dateSrc = raw.date ?? raw.timing?.scheduled?.date ?? raw.starts_at ?? "";
      const timeSrc = raw.timeFrom ?? raw.starts_at ?? raw.timing?.scheduled?.starts_at_time ?? "";
      const endSrc  = raw.timeTo ?? raw.ends_at ?? raw.timing?.scheduled?.ends_at_time ?? "";
      const titleAr = raw.title_translations?.ar
        ?? (typeof raw.title === "object" ? (raw.title?.ar ?? raw.title?.en ?? "") : (raw.title ?? ""));
      const titleEn = raw.title_translations?.en ?? "";
      setType(resolveTypeString(raw.type ?? raw.delivery_mode));
      setData({
        title:      titleAr,
        titleEn,
        coachId:    raw.coachId ?? raw.coach_id ?? raw.coach?.id ?? "",
        programId:  raw.programId ?? raw.program_id ?? raw.program?.id ?? "",
        unitId:     raw.program_unit_id ?? raw.unit_id ?? "",
        date:       toDateInput(dateSrc),
        time:       toTimeInput(timeSrc),
        timeTo:     toTimeInput(endSrc),
        duration:   String(raw.duration_minutes ?? raw.timing?.scheduled?.duration_minutes ?? "60"),
        zoomLink:   raw.meeting_url  ?? raw.meetingUrl ?? "",
        location:   raw.location     ?? raw.venue     ?? "",
        capacity:   raw.max_capacity ?? "",
        latitude:   raw.latitude     ?? "",
        longitude:  raw.longitude    ?? "",
        videos:     [],
        recordingFile: null,
        attachments: [],
      });
    };

    if (isEdit && session) {
      applySession(session);
      fetchSession(session.id)
        .then(r => { if (active) applySession(r?.data ?? r); })
        .catch(() => {});
    }

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // جلب وحدات البرنامج لما programId يتغير
  useEffect(() => {
    const pid = data.programId;
    if (!pid) { setUnits([]); return; }
    fetchProgramUnits(pid)
      .then(res => {
        // API shape: { data: { units: [...] } }
        const list = res?.data?.units ?? res?.data?.data?.units ?? res?.data?.data ?? res?.data ?? [];
        const arr = Array.isArray(list) ? list : [];
        setUnits(arr);
        // لو جاي من TrainingContentPage وعنده unitId محدد → سيليكته تلقائياً
        if (navState.unitId && !data.unitId) {
          setData(prev => ({ ...prev, unitId: String(navState.unitId) }));
        }
      })
      .catch(() => setUnits([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.programId]);

  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const recorded = isRecordedSession(type);
    if (!data.title || !data.date) {
      showToast("عنوان الجلسة والتاريخ مطلوبان", "error");
      return;
    }
    const recording = splitUploadFiles([...(data.videos ?? []), data.recordingFile]);
    const videoFile = recording.videos[0] || null;
    const attachFiles = [
      ...recording.attachments,
      ...recording.videos.slice(1),
      ...(data.attachments ?? []).filter(f => f instanceof File),
    ];

    if (recorded && !indeCoach && !videoFile) {
      showToast("ملف الفيديو مطلوب للجلسة المسجّلة", "error");
      return;
    }
    if (!isCoach && !indeCoach && !data.coachId) {
      showToast("اختر المدرب المسؤول", "error");
      return;
    }
    setSaving(true);
    try {
      const date = toDateInput(data.date);
      const time = recorded ? "" : toTimeInput(data.time);
      const timeTo = recorded ? "" : toTimeInput(data.timeTo);
      const shouldSendVideo = !!videoFile && (recorded || uploadRecording);
      const filesToAttach = uniqueFiles(attachFiles);

      const buildFd = (withAttachments) => {
        const fd = new FormData();
        // unitId: من data (user picked) أو من navState (جاي من TrainingContentPage)
        const unitId = (!isEdit && (data.unitId || navState.unitId))
          ? String(data.unitId || navState.unitId)
          : null;
        if (indeCoach) {
          fd.append("title[ar]", data.title);
          fd.append("title[en]", data.titleEn || data.title);
          if (data.programId) fd.append("program_id", data.programId);
          if (unitId) fd.append("program_unit_id", unitId);
          if (date) fd.append("date", date);
          if (!recorded && time) fd.append("starts_at", time);
          if (!recorded && timeTo) fd.append("ends_at", timeTo);
          fd.append("duration_minutes", recorded
            ? String(Number(data.duration) || 60)
            : durationMinutes({ ...data, time, timeTo }));
          fd.append("type", String(TYPE_TO_INT[type] ?? 0));
          fd.append("attendance_enabled", "1");
          if (type === "zoom" && data.zoomLink) fd.append("meeting_url", data.zoomLink);
          if (type === "offline" && data.location) fd.append("location", data.location);
          if (type === "offline" && data.latitude) fd.append("latitude", data.latitude);
          if (type === "offline" && data.longitude) fd.append("longitude", data.longitude);
        } else if (isCoach) {
          fd.append("title[ar]",   data.title);
          fd.append("title[en]",   data.title);
          if (data.programId) fd.append("program_id", data.programId);
          if (unitId) fd.append("program_unit_id", unitId);
          if (date) fd.append("date", date);
          if (!recorded && time) fd.append("starts_at", time);
          if (!recorded && timeTo) fd.append("ends_at", timeTo);
          fd.append("duration_minutes", String(Number(data.duration) || 60));
          fd.append("type",        String(TYPE_TO_INT[type] ?? 0));
          if (type === "zoom" && data.zoomLink) fd.append("meeting_url", data.zoomLink);
          if (type === "offline" && data.location) fd.append("location",    data.location);
        } else {
          const payload = {
            "title[ar]":        data.title,
            "title[en]":        data.title,
            type:               TYPE_TO_INT[type],
            ...(date ? { date } : {}),
            ...(!recorded && time   ? { starts_at: time } : {}),
            ...(!recorded && timeTo ? { ends_at:   timeTo } : {}),
            coach_id:           data.coachId,
            program_id:         data.programId || null,
            ...(unitId          ? { program_unit_id: unitId } : {}),
            duration_minutes:   Number(data.duration) || 60,
            delivery_mode:      type === "offline" ? "offline" : recorded ? "recorded" : "online",
            ...(type === "zoom" && !autoZoom && data.zoomLink ? { meeting_url:  data.zoomLink } : {}),
            ...(type === "offline" && data.location ? { location:     data.location } : {}),
            ...(type === "offline" && data.capacity ? { max_capacity: data.capacity } : {}),
          };
          Object.entries(payload).forEach(([k, v]) => { if (v != null && v !== "") fd.append(k, v); });
        }
        if (shouldSendVideo) fd.append("video", videoFile);
        if (withAttachments) appendSessionAttachments(fd, filesToAttach);
        return fd;
      };

      const save = (fd) => {
        if (isEdit) return updateSession(session.id, fd);
        return isCoach ? createCoachSession(fd) : createSession(fd);
      };

      try {
        await save(buildFd(filesToAttach.length > 0));
      } catch (err) {
        if (!filesToAttach.length) throw err;
        try {
          const fd = buildFd(false);
          filesToAttach.forEach(file => fd.append("attachment", file));
          await save(fd);
        } catch {
          await save(buildFd(false));
          showToast("تم حفظ الجلسة بدون المرفقات. السيرفر رفض الملفات المرفقة.", "error");
        }
      }

      setSuccess(true);
    } catch (err) {
      showToast(err.message || "حدث خطأ أثناء الإضافة", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 sm:px-4 sm:py-4" dir="rtl">
        <div className="w-full space-y-4">

          {/* breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button onClick={goBack}
              className="flex items-center gap-1 text-slate-500 hover:text-teal-600 transition font-semibold">
              <IcoBack />
              {navState.backTo ? "المحتوى التدريبي" : "إدارة الجلسات"}
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-bold" style={{ color: "#024677" }}>
              {isEdit ? "تعديل جلسة" : "إضافة جلسة جديدة"}
            </span>
          </div>

          {/* header card */}
          <div className="rounded-xl px-4 py-3 text-white" style={{ background: "#024677" }}>
            <h2 className="text-base font-bold">
              {data.title || (isEdit ? "تعديل الجلسة" : "جلسة جديدة")}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-xs opacity-80 flex-wrap">
              {data.date && (
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {data.date}
                </span>
              )}
              {data.time && (
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {data.time}{data.timeTo ? ` — ${data.timeTo}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* content area */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">

            {/* RIGHT: الحقول + فيديو + مرفقات */}
            <div className="w-full lg:flex-1 min-w-0 space-y-4">

              {/* نوع الجلسة */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">تفاصيل الجلسة</h3>

                <div>
                  <p className="text-xs text-slate-500 mb-2">نوع الجلسة</p>
                  <SessionTypeSelector value={type} onChange={setType} />
                </div>

                {/* عنوان */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    عنوان الجلسة <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={data.title}
                    onChange={e => set("title", e.target.value)}
                    placeholder="أضف عنواناً للجلسة"
                    className={INPUT_CLS}
                  />
                </div>

                {/* البرنامج */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">البرنامج / المنهج</label>
                  <select
                    value={data.programId}
                    onChange={e => { set("programId", e.target.value); set("unitId", ""); }}
                    className={INPUT_CLS + " appearance-none cursor-pointer"}
                  >
                    <option value="">اختر البرنامج...</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name?.ar ?? p.name ?? "—"}</option>
                    ))}
                  </select>
                </div>

                {/* الوحدة — تظهر لما يختار برنامج */}
                {data.programId && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      الوحدة التدريبية
                    </label>
                    <select
                      value={data.unitId}
                      onChange={e => set("unitId", e.target.value)}
                      className={INPUT_CLS + " appearance-none cursor-pointer"}
                      disabled={units.length === 0}
                    >
                      <option value="">
                        {units.length === 0 ? "جارٍ التحميل…" : "بدون وحدة (جلسة مستقلة)"}
                      </option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.title?.ar ?? u.title?.en ?? `وحدة ${u.id}`}
                          {u.sessions_count != null ? ` (${u.sessions_count} جلسات)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* المدرب */}
                {!isCoach && !indeCoach && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      المدرب المسؤول <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={data.coachId}
                      onChange={e => set("coachId", e.target.value)}
                      className={INPUT_CLS + " appearance-none cursor-pointer"}
                    >
                      <option value="">اختر المدرب...</option>
                      {coaches.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* حقول حسب نوع الجلسة */}
                <SessionTypeFields
                  type={type}
                  data={data}
                  set={set}
                  autoZoom={!isCoach && !indeCoach && autoZoom}
                  indeCoach={indeCoach}
                />

                {/* التاريخ والوقت */}
                <DateTimeFields data={data} set={set} hideTimes={isRecordedSession(type)} />
              </div>

              {/* رفع الفيديو */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="text-sm font-bold text-slate-700">رفع تسجيل الفيديو</h3>

                {type !== "recorded" && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-slate-700">هل سيُرفع تسجيل للجلسة؟</span>
                    <button
                      type="button"
                      onClick={() => setUploadRecording(v => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0
                        ${uploadRecording ? "bg-teal-400" : "bg-slate-200"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all
                        ${uploadRecording ? "right-1" : "left-1"}`} />
                    </button>
                  </div>
                )}

                {(type === "recorded" || uploadRecording) && (
                  <VideoDropZone
                    files={data.videos}
                    onChange={(files, extraDocs = []) => {
                      setData(prev => {
                        const existing = prev.attachments ?? [];
                        const nextAtt = extraDocs.length
                          ? [...existing, ...extraDocs.filter(d => !existing.find(x => x.name === d.name && x.size === d.size))]
                          : existing;
                        return { ...prev, videos: files, attachments: nextAtt };
                      });
                    }}
                    label={type === "recorded" ? "رفع ملف الفيديو *" : "رفع تسجيل الجلسة (اختياري)"}
                  />
                )}
              </div>

              {/* المرفقات */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="text-sm font-bold text-slate-700">المرفقات والملفات المساعدة</h3>
                <AttachmentsList
                  attachments={data.attachments ?? []}
                  onAdd={files => set("attachments", [...(data.attachments ?? []), ...files])}
                  onRemove={idx => set("attachments", (data.attachments ?? []).filter((_, i) => i !== idx))}
                />
              </div>
            </div>

            {/* LEFT: ملخص + أزرار */}
            <div className="w-full lg:w-56 shrink-0 space-y-3">
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">ملخص الجلسة</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className={data.title ? "text-teal-600 font-semibold" : "text-slate-400"}>
                    {data.title || "—"}
                  </span>
                  <span className="text-slate-500 font-medium">العنوان</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={data.date ? "text-teal-600 font-semibold" : "text-slate-400"}>
                    {data.date || "لم يُحدد"}
                  </span>
                  <span className="text-slate-500 font-medium">التاريخ</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={data.videos?.length > 0 ? "text-teal-600 font-semibold" : "text-slate-400"}>
                    {data.videos?.length > 0 ? "✓ تم اختيار فيديو" : "لا يوجد فيديو"}
                  </span>
                  <span className="text-slate-500 font-medium">فيديو</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={data.attachments?.length > 0 ? "text-teal-600 font-semibold" : "text-slate-400"}>
                    {data.attachments?.length > 0 ? `✓ ${data.attachments.length} ملف` : "لا توجد مرفقات"}
                  </span>
                  <span className="text-slate-500 font-medium">مرفقات</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#024677" }}
              >
                {saving ? <IcoSpinner /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {saving ? "جارٍ الحفظ..." : (isEdit ? "حفظ التعديلات" : "حفظ الجلسة")}
              </button>

              <button
                onClick={goBack}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* success modal */}
      {success && (
        <SuccessModal
          title={data.title}
          onClose={() => { setSuccess(false); goBack(); }}
        />
      )}
    </>
  );
}

