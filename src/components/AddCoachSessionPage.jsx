import { useState, useEffect } from "react";
import { useToast } from "./ToastProvider";
import { fetchCoachPrograms, createCoachSession } from "../services/api";
import { SESSION_TYPE_TO_INT, isRecordedSession } from "../services/sessionType";

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

function IcoUpload() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ── session type dropdown ─────────────────────────────────────────────────────
const SESSION_TYPES = [
  { value: "zoom",     label: "أونلاين (Zoom)" },
  { value: "offline",  label: "حضوري"          },
  { value: "recorded", label: "مسجّل"           },
];

function SessionTypeSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right appearance-none cursor-pointer"
      dir="rtl"
    >
      {SESSION_TYPES.map(t => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  );
}

// ── type-specific fields ──────────────────────────────────────────────────────
function SessionTypeFields({ type, data, set }) {
  if (type === "zoom") {
    return (
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
          رابط Zoom
        </label>
        <input
          value={data.zoomLink}
          onChange={e => set("zoomLink", e.target.value)}
          placeholder="https://zoom.us/j/..."
          className={INPUT_CLS}
          dir="ltr"
        />
      </div>
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
      </div>
    );
  }

  return null;
}

// ── video upload section (shown for all session types) ────────────────────────
function VideoUploadSection({ data, set, uploadRecording, setUploadRecording }) {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      {/* toggle */}
      <div className="flex items-center justify-between">
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

      {/* upload zone — only when toggle is on */}
      {uploadRecording && (
        <div>
          <p className="text-xs text-slate-500 mb-1.5 text-right">
            رفع تسجيل الجلسة (المرحلة الثانية)
          </p>
          <input
            id="coach-session-video-input"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => set("videos", e.target.files ? [e.target.files[0]] : [])}
          />
          <label
            htmlFor="coach-session-video-input"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition hover:border-teal-400 hover:bg-teal-50/40"
            style={{ borderColor: "#cbd5e1" }}
          >
            <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#EFF6FF", color: "#024677" }}>
              <IcoUpload />
            </span>
            {data.videos?.[0] ? (
              <>
                <p className="text-sm font-bold text-slate-700">{data.videos[0].name}</p>
                <p className="text-xs text-emerald-600">جاهز للرفع</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-700">اضغط لرفع الفيديو أو اسحبه هنا</p>
                <p className="text-xs text-slate-400">MP4, MOV, AVI مدعومة</p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
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

// ── attachments list ──────────────────────────────────────────────────────────
function AttachmentsList({ attachments, onAdd, onRemove }) {
  return (
    <div className="space-y-2 border-t border-slate-100 pt-3">
      <p className="text-xs font-semibold text-slate-700 text-right">
        مرفقات الجلسة
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {attachments.map((f, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {f.name}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="hover:text-red-400 transition ml-0.5"
            >
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
            className="hidden"
            onChange={e => onAdd(Array.from(e.target.files ?? []))}
          />
        </label>
      </div>
      {attachments.length > 0 && (
        <p className="text-[10px] text-slate-400 text-right">
          {attachments.length} ملف مرفق
        </p>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function AddCoachSessionPage({ onBack }) {
  const showToast = useToast();

  const [type,    setType]    = useState("zoom");
  const [data,    setData]    = useState({
    title: "", programId: "",
    date: "", time: "", timeTo: "",
    duration: "60",
    zoomLink: "", location: "", capacity: "",
    videos: [],
    attachments: [],
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [uploadRecording, setUploadRecording] = useState(false);

  // load coach programs
  useEffect(() => {
    fetchCoachPrograms({ per_page: 100 })
      .then(res => {
        const d = res.data ?? res;
        setPrograms(Array.isArray(d) ? d : (d.programs ?? d.data ?? []));
      })
      .catch(() => {});
  }, []);

  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const recorded = isRecordedSession(type);
    if (!data.title || !data.date) {
      showToast("عنوان الجلسة والتاريخ مطلوبين", "error");
      return;
    }
    if (!data.programId) {
      showToast("اختر البرنامج أولاً", "error");
      return;
    }

    const toHm = (v) => {
      const m = String(v || "").trim().match(/(\d{1,2}):(\d{2})/);
      return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
    };
    const time = recorded ? "" : toHm(data.time);
    const timeTo = recorded ? "" : toHm(data.timeTo);
    const durationMins = (() => {
      if (recorded || !time || !timeTo) return Number(data.duration) || 60;
      const [sh, sm] = time.split(":").map(Number);
      const [eh, em] = timeTo.split(":").map(Number);
      let mins = eh * 60 + em - (sh * 60 + sm);
      if (mins <= 0) mins += 24 * 60;
      return mins;
    })();

    const isVideo = (f) =>
      f instanceof File && ((f.type && f.type.startsWith("video/")) || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(f.name || ""));
    const pickedVideo = data.videos?.[0] instanceof File ? data.videos[0] : null;
    const videoFile = pickedVideo && isVideo(pickedVideo) && (recorded || uploadRecording)
      ? pickedVideo
      : null;
    const attachFiles = [
      ...(pickedVideo && !videoFile ? [pickedVideo] : []),
      ...(data.attachments ?? []).filter(f => f instanceof File),
    ];

    const buildFd = ({ withVideo = true, attachMode = "none" } = {}) => {
      const fd = new FormData();
      fd.append("title[ar]", data.title);
      fd.append("title[en]", data.title);
      fd.append("type", String(TYPE_TO_INT[type] ?? 0));
      fd.append("program_id", data.programId);
      if (data.date) fd.append("date", data.date);
      if (!recorded && time) fd.append("starts_at", time);
      if (!recorded && timeTo) fd.append("ends_at", timeTo);
      fd.append("duration_minutes", String(durationMins));
      fd.append("delivery_mode",
        type === "offline" ? "offline" : recorded ? "recorded" : "online"
      );
      if (type === "zoom" && data.zoomLink) fd.append("meeting_url", data.zoomLink);
      if (type === "offline" && data.location) fd.append("location", data.location);
      if (type === "offline" && data.capacity) fd.append("max_capacity", data.capacity);
      if (withVideo && videoFile) fd.append("video", videoFile);
      if (attachMode === "array") {
        attachFiles.forEach(file => fd.append("attachments[]", file));
      } else if (attachMode === "single") {
        attachFiles.forEach(file => fd.append("attachment", file));
      }
      return fd;
    };

    setSaving(true);
    try {
      try {
        await createCoachSession(buildFd({
          withVideo: true,
          attachMode: attachFiles.length ? "array" : "none",
        }));
      } catch (err) {
        if (attachFiles.length) {
          try {
            await createCoachSession(buildFd({ withVideo: true, attachMode: "single" }));
          } catch {
            await createCoachSession(buildFd({ withVideo: true, attachMode: "none" }));
            showToast("تم حفظ الجلسة بدون المرفقات. السيرفر رفض الملفات المرفقة.", "error");
          }
        } else if (videoFile) {
          await createCoachSession(buildFd({ withVideo: false, attachMode: "none" }));
          showToast("تم حفظ الجلسة بدون الفيديو. السيرفر رفض الملف.", "error");
        } else {
          const slim = new FormData();
          slim.append("title[ar]", data.title);
          slim.append("title[en]", data.title);
          slim.append("type", String(TYPE_TO_INT[type] ?? 0));
          slim.append("program_id", data.programId);
          if (data.date) slim.append("date", data.date);
          if (!isRecordedSession(type) && time) slim.append("starts_at", time);
          if (!isRecordedSession(type) && timeTo) slim.append("ends_at", timeTo);
          slim.append("duration_minutes", String(durationMins));
          if (type === "zoom" && data.zoomLink) slim.append("meeting_url", data.zoomLink);
          if (type === "offline" && data.location) slim.append("location", data.location);
          await createCoachSession(slim);
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
      <main className="flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-6 sm:py-6" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* breadcrumb */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-teal-600 transition"
              >
                <IcoBack />
                جلساتي
              </button>
              <span className="text-sm text-slate-400">/</span>
              <h1 className="text-base font-bold" style={{ color: "#024677" }}>
                إضافة جلسة جديدة
              </h1>
            </div>
          </div>

          {/* form card */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">

            {/* card header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#F8FAFC" }}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "#14b8a6" }}>
                  1
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  جلسة جديدة
                </span>
              </div>
            </div>

            {/* fields */}
            <div className="px-4 pt-3 pb-4 space-y-4" style={{ background: "#FAFAFA" }}>

              {/* session type */}
              <div>
                <p className="text-xs text-slate-500 mb-2">نوع الجلسة</p>
                <SessionTypeSelector value={type} onChange={setType} />
              </div>

              {/* title */}
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

              {/* program */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  البرنامج / المنهج <span className="text-red-400">*</span>
                </label>
                <select
                  value={data.programId}
                  onChange={e => set("programId", e.target.value)}
                  className={INPUT_CLS + " appearance-none cursor-pointer"}
                >
                  <option value="">اختر البرنامج...</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name?.ar ?? p.name?.en ?? p.name ?? "—"}
                    </option>
                  ))}
                </select>
              </div>

              {/* type-specific fields */}
              <SessionTypeFields type={type} data={data} set={set} />

              {/* date always; hide start/end times for recorded */}
              <DateTimeFields data={data} set={set} hideTimes={isRecordedSession(type)} />

              {/* video upload — all session types */}
              <VideoUploadSection
                data={data}
                set={set}
                uploadRecording={uploadRecording}
                setUploadRecording={setUploadRecording}
              />

              {/* attachments */}
              <AttachmentsList
                attachments={data.attachments ?? []}
                onAdd={files => set("attachments", [...(data.attachments ?? []), ...files])}
                onRemove={idx => set("attachments", (data.attachments ?? []).filter((_, i) => i !== idx))}
              />
            </div>

            {/* actions */}
            <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-slate-100"
              style={{ background: "#FAFAFA" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                  text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#024677" }}
              >
                {saving && <IcoSpinner />}
                حفظ الجلسة
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition"
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
          onClose={() => { setSuccess(false); onBack?.(); }}
        />
      )}
    </>
  );
}