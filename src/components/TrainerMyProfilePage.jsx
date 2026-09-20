import { useState, useEffect, useRef } from "react";
import { fetchMyCoachProfile, fetchTrainerProfile, updateCoachProfile, fetchCoachSessions } from "../services/api";
import { getUserRole, setUser, getUser } from "../services/auth";
import Pagination from "./Pagination";
import { computeStatus } from "./SessionsPage";

// ─────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────
const C = {
  navy:    "#064E71",
  accent:  "#14b8a6",
  text:    "#1E293B",
  muted:   "#64748B",
  border:  "#E8EDF1",
  bg:      "#F8FAFC",
  white:   "#FFFFFF",
};

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
function IcoCamera({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
function IcoFile({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function IcoCheck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}
function IcoCalendar({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IcoMapPin({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function IcoVideo({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  );
}
function IcoClock({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IcoUsers({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

// ─────────────────────────────────────────────
// FormField — reusable label + input
// ─────────────────────────────────────────────
function FormField({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-semibold text-right" style={{ color: C.text }}>
        {label}
        {required && <span className="text-red-400 mr-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = `
  w-full rounded-xl border bg-[#F8FAFC] px-4 py-3 text-base text-right
  outline-none transition
  focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10
  placeholder:text-slate-300
`.replace(/\s+/g, " ").trim();

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function Sk({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}
function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Sk className="w-16 h-16 rounded-full" />
        <div className="flex flex-col gap-2"><Sk className="w-40 h-5" /><Sk className="w-28 h-3" /></div>
      </div>
      <div className="h-px bg-slate-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5"><Sk className="w-24 h-3" /><Sk className="h-11" /></div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5"><Sk className="w-28 h-3" /><Sk className="h-24" /></div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Toast helper
// ─────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const isErr = type === "error";
  return (
    <div className={`flex items-center gap-2 text-base font-medium px-4 py-3 rounded-xl border ${
      isErr
        ? "bg-red-50 border-red-200 text-red-700"
        : "bg-emerald-50 border-emerald-200 text-emerald-700"
    }`} dir="rtl">
      {!isErr && <IcoCheck size={15} />}
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────
// ProfileHeader
// ─────────────────────────────────────────────
function ProfileHeader({ name, email, avatar, initials, roleName, providerName, onAvatarChange }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);

  const handleFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    onAvatarChange?.(f);
  };

  const src = preview ?? avatar;

  return (
      <div className="flex items-center gap-4" dir="rtl">
      <div className="relative shrink-0">
        {src ? (
          <img src={src} alt={name}
            className="w-20 h-20 rounded-full object-cover border-2"
            style={{ borderColor: C.accent }} />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-2"
            style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.accent})`, borderColor: C.accent }}>
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-0.5 -left-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition hover:scale-110"
          style={{ background: C.accent, color: "#fff" }}
          aria-label="تغيير الصورة الشخصية">
          <IcoCamera size={14} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div className="min-w-0 flex flex-col gap-1.5">
        <h2 className="text-xl sm:text-2xl font-extrabold truncate" style={{ color: C.navy }}>{name}</h2>
        {email && <p className="text-base truncate" style={{ color: C.muted }}>{email}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {roleName && (
            <span className="inline-flex items-center text-sm font-bold px-3 py-1 rounded-full text-white"
              style={{ background: C.accent }}>
              {roleName}
            </span>
          )}
          {providerName && (
            <span className="inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: "#EFF6FF", color: C.navy }}>
              {providerName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// IdentityImageUpload
// ─────────────────────────────────────────────
function FileUpload({ label, current, onChange, accept = "image/*", buttonLabel = "استبدال" }) {
  const fileRef = useRef();
  const [file, setFile] = useState(null);

  const handleFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    onChange?.(f);
  };

  const displayName = file?.name ?? (current ? current.split("/").pop() : null);

  return (
    <FormField label={label}>
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-[#F8FAFC]"
        style={{ borderColor: C.border }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#EFF6FF", color: C.navy }}>
          <IcoFile size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium truncate" style={{ color: C.text }}>
            {displayName ?? "لم يتم رفع ملف"}
          </p>
          {!file && current && (
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>الملف الحالي</p>
          )}
          {file && (
            <p className="text-sm mt-0.5 text-emerald-600">جاهز للرفع</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 text-sm font-bold px-4 py-2 rounded-lg transition hover:opacity-90 text-white"
          style={{ background: C.navy }}>
          {buttonLabel}
        </button>
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      </div>
    </FormField>
  );
}

// ─────────────────────────────────────────────
// PersonalInfoForm
// ─────────────────────────────────────────────
function PersonalInfoForm({ profile, loading, onSaved }) {
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [spec,       setSpec]       = useState("");
  const [exp,        setExp]        = useState("");
  const [bio,        setBio]        = useState("");
  const [company,    setCompany]    = useState("");
  const [idFile,     setIdFile]     = useState(null);
  const [cvFile,     setCvFile]     = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name   ?? "");
    setPhone(profile.phone  ?? "");
    setSpec(profile.specialization?.name ?? "");
    setExp(String(profile.years_of_experience ?? ""));
    setBio(profile.bio     ?? "");
    setCompany(profile.company_name ?? "");
  }, [profile]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name",                name);
      fd.append("phone",               phone);
      fd.append("bio",                 bio);
      fd.append("years_of_experience", exp);
      fd.append("lang",                profile?.lang ?? "ar");
      fd.append("company_name",        company);
      if (profile?.country_code) fd.append("country_code", profile.country_code);
      if (profile?.specialization_id) fd.append("specialization_id", profile.specialization_id);
      if (idFile)     fd.append("id_card_image", idFile);
      if (cvFile)     fd.append("cv",             cvFile);
      if (avatarFile) fd.append("image",          avatarFile);

      const res  = await updateCoachProfile(fd);
      const data = res.data ?? res;
      // refresh stored user
      const current = getUser();
      setUser({ ...current, ...data });
      showToast("تم حفظ التغييرات بنجاح");
      onSaved?.();
    } catch (err) {
      showToast(err.message ?? "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonProfile />;

  return (
    <form onSubmit={handleSave} className="space-y-5" dir="rtl">
      {/* profile header */}
      <ProfileHeader
        name={name || profile?.name || "—"}
        email={profile?.email}
        avatar={profile?.image}
        roleName={profile?.role?.name}
        providerName={profile?.provider?.name}
        initials={(profile?.name ?? "م").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
        onAvatarChange={setAvatarFile} />

      <div className="h-px" style={{ background: C.border }} />

      {/* 2-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="الاسم الكامل" required>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="الاسم الكامل"
            className={inputCls} style={{ borderColor: C.border }} dir="rtl" />
        </FormField>

        <FormField label="رقم الجوال">
          <div className="relative">
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="رقم الجوال" type="tel"
              className={`${inputCls} pl-14`} style={{ borderColor: C.border }} dir="ltr" />
            {profile?.country_code && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold"
                style={{ color: C.muted }} dir="ltr">
                +{profile.country_code}
              </span>
            )}
          </div>
        </FormField>

        <FormField label="التخصص">
          <input value={spec} onChange={e => setSpec(e.target.value)}
            placeholder="تخصصك المهني"
            className={inputCls} style={{ borderColor: C.border }} dir="rtl" />
        </FormField>

        <FormField label="سنوات الخبرة">
          <input value={exp} onChange={e => setExp(e.target.value.replace(/\D/g, ""))}
            placeholder="8" type="text" inputMode="numeric"
            className={inputCls} style={{ borderColor: C.border }} dir="ltr" />
        </FormField>

        <FormField label="اسم الجهة / الشركة">
          <input value={company} onChange={e => setCompany(e.target.value)}
            placeholder="اسم الجهة التابعة لها"
            className={inputCls} style={{ borderColor: C.border }} dir="rtl" />
        </FormField>
      </div>

      {/* bio full width */}
      <FormField label="النبذة الشخصية">
        <textarea value={bio} onChange={e => setBio(e.target.value)}
          placeholder="أدخل نبذة تعريفية عنك…"
          rows={4}
          className={`${inputCls} resize-none`}
          style={{ borderColor: C.border }} dir="rtl" />
      </FormField>

      {/* id card upload */}
      <FileUpload label="صورة الهوية" current={profile?.id_card_image} onChange={setIdFile} />

      {/* cv upload */}
      <FileUpload label="السيرة الذاتية (CV)"
        current={profile?.cv}
        onChange={setCvFile}
        accept=".pdf,.doc,.docx,image/*"
        buttonLabel="رفع السيرة الذاتية" />

      {/* toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* save button */}
      <div className="flex justify-start">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: C.accent }}>
          {saving ? <IcoSpinner /> : <IcoCheck size={16} />}
          حفظ التغييرات
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Sessions section (coach's sessions)
// ─────────────────────────────────────────────
const NAVY = "#024677";

const TYPE_MAP = {
  offline:  { label: "حضوري",  bg: "#f1f5f9", color: "#64748b" },
  online:   { label: "أونلاين", bg: "#e0f2fe", color: "#0284c7" },
  recorded: { label: "مسجل",   bg: "#f0fdf4", color: "#16a34a" },
};

function typeKey(s) {
  const raw = String(s?.type?.delivery_mode ?? s?.delivery_mode ?? s?.type?.key ?? s?.type ?? "").toLowerCase();
  if (raw === "online" || raw === "interactive" || raw === "zoom" || raw === "0") return "online";
  if (raw === "recorded" || raw === "1") return "recorded";
  return "offline";
}

function sessionStatus(s) {
  const st = computeStatus(s);
  const raw = typeof s.status_label === "object"
    ? (s.status_label?.text ?? s.status_label?.value ?? "")
    : (s.status_label ?? "");
  if (st === "live") return { key: "live", label: "جارية الآن", color: "#16a34a" };
  if (st === "ended") return { key: "ended", label: raw || "انتهت", color: "#64748b" };
  return { key: "upcoming", label: raw || "قادمة", color: NAVY };
}

function ProfileSessionCard({ s, upcoming = false }) {
  const type = TYPE_MAP[typeKey(s)] || TYPE_MAP.offline;
  const st = sessionStatus(s);
  const isLive = st.key === "live";
  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2 ${isLive ? "border-teal-300" : "border-slate-200"}`}
      style={{ background: upcoming ? "#02467708" : "#F2F5F8" }}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate" style={{ color: NAVY }}>{s.title}</p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0"
              style={{ background: type.bg, color: type.color }}
            >
              <IcoVideo size={11} />
              {s.type?.text ?? type.label}
            </span>
          </div>
          {s.program_name && (
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{s.program_name}</p>
          )}
        </div>
        <span className="text-[11px] font-bold shrink-0 whitespace-nowrap" style={{ color: st.color }}>
          {st.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 flex-wrap">
        {s.date && (
          <span className="flex items-center gap-1">
            <span className="text-[#5AEACF] flex items-center"><IcoCalendar size={13} /></span>
            {s.date}
          </span>
        )}
        {s.starts_at && (
          <span className="flex items-center gap-1">
            <span className="text-[#5AEACF] flex items-center"><IcoClock /></span>
            {s.starts_at}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="text-[#5AEACF] flex items-center"><IcoUsers /></span>
          {s.trainees_count ?? 0} متدرب
        </span>
        {s.location && (
          <span className="flex items-center gap-1">
            <span className="text-[#5AEACF] flex items-center"><IcoMapPin size={13} /></span>
            {s.location}
          </span>
        )}
      </div>
    </div>
  );
}

function SessionsSection() {
  const [coming,   setComing]   = useState([]);
  const [list,     setList]     = useState([]);
  const [page,     setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = p => {
    setLoading(true);
    fetchCoachSessions({ status: "all", page: p })
      .then(res => {
        const data = res?.data ?? res;
        setComing(data.coming_sessions ?? []);
        const all = data.all_sessions ?? {};
        setList(all.data ?? []);
        setLastPage(all.meta?.last_page ?? 1);
        setError(null);
      })
      .catch(err => setError(err.message ?? "حدث خطأ أثناء تحميل الجلسات"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoachSessions({ status: "all", page: 1 })
      .then(res => {
        const data = res?.data ?? res;
        setComing(data.coming_sessions ?? []);
        const all = data.all_sessions ?? {};
        setList(all.data ?? []);
        setLastPage(all.meta?.last_page ?? 1);
      })
      .catch(err => setError(err.message ?? "حدث خطأ أثناء تحميل الجلسات"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Sk className="h-16" />
        <Sk className="h-16" />
        <Sk className="h-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-10 gap-3 text-center">
        <p className="text-sm font-medium text-red-500">{error}</p>
        <button
          type="button"
          onClick={() => { setError(null); load(page); }}
          className="text-sm font-bold px-4 py-2 rounded-xl text-white"
          style={{ background: C.navy }}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const hasComing = coming.length > 0;
  const hasList   = list.length > 0;

  if (!hasComing && !hasList) {
    return (
      <p className="text-center text-base text-slate-400 py-8">لا توجد جلسات</p>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {hasComing && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: NAVY }}>الجلسات القادمة</span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#02467714", color: NAVY }}
            >
              {coming.length}
            </span>
          </div>
          <div className="space-y-2">
            {coming.map(s => <ProfileSessionCard key={s.id} s={s} upcoming />)}
          </div>
        </div>
      )}

      {hasList && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">كل الجلسات</span>
          </div>
          <div className="space-y-2">
            {list.map(s => <ProfileSessionCard key={s.id} s={s} />)}
          </div>
          <Pagination
            page={page}
            totalPages={lastPage}
            onChange={p => { setPage(p); load(p); }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Card wrapper
// ─────────────────────────────────────────────
function Card({ children }) {
  return (
    <div className="rounded-2xl border-2 p-5 sm:p-7"
      style={{ borderColor: C.border }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TrainerMyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const isCoach = getUserRole() === "coach";
    const fetcher = isCoach ? fetchMyCoachProfile : fetchTrainerProfile;
    fetcher()
      .then(res => setProfile(res?.data ?? null))
      .catch(err => setError(err.message ?? "حدث خطأ أثناء التحميل"))
      .finally(() => setLoading(false));
  }, []);

  const refreshProfile = () => {
    const isCoach = getUserRole() === "coach";
    const fetcher = isCoach ? fetchMyCoachProfile : fetchTrainerProfile;
    fetcher().then(res => setProfile(res?.data ?? null)).catch(() => {});
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5"
      style={{ background: "#F8FAFC", fontFamily: "'Cairo', system-ui, sans-serif" }}
      dir="rtl">

      <div className="w-full max-w-[900px] mx-auto space-y-6">

        {/* page title */}
        <h1 className="text-2xl font-extrabold" style={{ color: C.navy }}>
          الملف الشخصي
        </h1>

        {/* error state */}
        {error && !loading && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <p className="text-base font-semibold text-red-500">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); refreshProfile(); }}
              className="text-sm font-bold px-4 py-2.5 rounded-xl text-white"
              style={{ background: C.navy }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* ── Profile Card ── */}
            <Card>
              <PersonalInfoForm
                profile={profile}
                loading={loading}
                onSaved={refreshProfile} />
            </Card>

            {/* ── Sessions Card (coaches only) ── */}
            {getUserRole() === "coach" && (
              <Card>
                <div className="flex items-center gap-3 mb-4" dir="rtl">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#02467714", color: NAVY }}>
                    <IcoCalendar size={19} />
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: NAVY }}>
                    الجلسات
                  </h2>
                </div>
                <div className="h-px mb-5" style={{ background: C.border }} />
                <SessionsSection />
              </Card>
            )}
          </>
        )}

      </div>
    </main>
  );
}
