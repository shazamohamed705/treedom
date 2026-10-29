import { useState, useRef, useEffect } from "react";
import { fetchSpecializations } from "../../services/api";

// -----------------------------------------------------------------------------
// Upload icon
// -----------------------------------------------------------------------------
const IcoUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

// -----------------------------------------------------------------------------
// Progress steps — step 2 active
// -----------------------------------------------------------------------------
const TRAINER_STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",               sub: "البريد الإلكتروني وكلمة المرور", done: true },
  { n: 2, pct: "80%",  title: "البيانات الشخصية والاهتمامات", sub: "الاسم ومجالات الاهتمام",        active: true },
  { n: 3, pct: "100%", title: "إثبات الهوية",                sub: "توثيق الشخصية لإصدار الشهادات" },
];

function ProgressSteps({ steps }) {
  return (
    <div className="flex flex-col" dir="rtl">
      {steps.map((s, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={s.n}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all"
                style={{
                  borderColor: s.active || s.done ? "#5AEACF" : "rgba(255,255,255,0.2)",
                  background:  s.done ? "#5AEACF" : "transparent",
                  color:       s.done ? "#024677" : s.active ? "#5AEACF" : "rgba(255,255,255,0.3)",
                }}>
                {s.done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : s.n}
              </div>
              <div className="text-right flex-1">
                <p className="text-sm font-bold"
                  style={{ color: s.active || s.done ? "#ffffff" : "rgba(255,255,255,0.35)" }}>
                  {s.title}
                </p>
                <p className="text-xs mt-0.5"
                  style={{ color: s.active ? "rgba(255,255,255,0.55)" : s.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>
                  {s.sub}
                </p>
              </div>
              <span className="text-base font-bold w-12 text-left shrink-0"
                style={{ color: s.active ? "#5AEACF" : s.done ? "#5AEACF" : "rgba(255,255,255,0.3)" }}>
                {s.pct}
              </span>
            </div>
            {!isLast && (
              <div className="flex items-center py-3">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <svg width="14" height="32" viewBox="0 0 14 32" fill="none">
                    <line x1="7" y1="0" x2="7" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M3 20l4 8 4-8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <span className="flex-1" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main page
// Collects: name, city, bio, specialization_id, years_of_experience, image (optional)
// -----------------------------------------------------------------------------
export default function RegisterStep3Individual({ role = "trainer", initialData = {}, onContinue, onBack, onLoginRedirect }) {
  const [name,              setName]              = useState(initialData.name ?? "");
  const [city,              setCity]              = useState(initialData.city ?? "");
  const [bio,               setBio]               = useState(initialData.bio ?? "");
  const [specializationId,  setSpecializationId]  = useState(initialData.specialization_id ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData.years_of_experience ?? "");
  const [avatarFile,        setAvatarFile]        = useState(null);
  const [avatarPreview,     setAvatarPreview]     = useState(null);
  const [specializations,   setSpecializations]   = useState([]);
  const avatarRef = useRef();

  useEffect(() => {
    fetchSpecializations()
      .then(list => setSpecializations(list))
      .catch(() => setSpecializations([]));
  }, []);

  const yearsNum = parseInt(yearsOfExperience, 10);
  const yearsValid = yearsOfExperience === "" || (yearsNum >= 0 && yearsNum <= 50);
  const canSubmit = name.trim() && city.trim() && specializationId && yearsOfExperience && yearsValid;

  const handleAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6" dir="rtl"
      style={{ background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "url('/logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center 60%",
        backgroundSize: "250%",
        opacity: 0.06,
      }}/>

      <div className="relative w-full max-w-6xl flex flex-col items-center gap-4">
        <div className="w-full flex flex-col lg:flex-row-reverse items-start gap-6 lg:gap-8">

          {/* white card */}
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-3">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-5 p-5 sm:p-8 lg:p-10">

              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom" style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>
                  البيانات الشخصية
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  أدخل معلوماتك ومجالات تدريبك
                </p>
              </div>

              {/* avatar upload */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 text-right">
                  الصورة الشخصية <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div onClick={() => avatarRef.current?.click()}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                  style={{ borderColor: "#CBD5E1", background: "#F8FAFC" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#2BBFB3"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD5E1"}>
                  <div className="text-right flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#024677" }}>
                      {avatarFile ? avatarFile.name : "انقر للاختيار أو اسحب الصورة هنا"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, JPG — حجم أقصى 5 MB</p>
                  </div>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="preview" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                    : <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#E0FAF8", border: "2.32px solid #2BBFB3", color: "#2BBFB3" }}>
                        <IcoUpload />
                      </div>
                  }
                </div>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </div>

              {/* full name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">
                  الاسم الكامل <span className="text-red-400">*</span>
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="أحمد خالد الزهراني"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300" />
              </div>

              {/* city */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">
                  المدينة <span className="text-red-400">*</span>
                </label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="الرياض"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300" />
              </div>

              {/* specialization */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">
                  التخصص <span className="text-red-400">*</span>
                </label>
                <select
                  value={specializationId}
                  onChange={e => setSpecializationId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10"
                  style={{ color: specializationId ? "#1e293b" : "#94a3b8" }}>
                  <option value="" disabled>اختر التخصص</option>
                  {specializations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* years of experience */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">
                  سنوات الخبرة <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsOfExperience}
                  onChange={e => setYearsOfExperience(e.target.value)}
                  placeholder="مثال: 5"
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300 ${
                    yearsOfExperience && !yearsValid ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#024677]"
                  }`} />
                {yearsOfExperience && !yearsValid && (
                  <p className="text-xs text-red-500 text-right">سنوات الخبرة يجب أن تكون بين 0 و 50</p>
                )}
              </div>

              {/* bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">
                  نبذة عن المدرب <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="اكتب نبذة تعريفية عن خبرتك ومسيرتك المهنية"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition resize-none focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300" />
              </div>

              {/* buttons */}
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => canSubmit && onContinue?.({
                    name: name.trim(),
                    city: city.trim(),
                    bio: bio.trim(),
                    specialization_id: specializationId,
                    years_of_experience: yearsNum,
                    image: avatarFile || null,
                  })}
                  disabled={!canSubmit}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: canSubmit ? "#024677" : "#E2E8F0",
                    color:      canSubmit ? "#ffffff"  : "#94A3B8",
                    cursor:     canSubmit ? "pointer"  : "not-allowed",
                  }}>
                  المتابعة
                </button>
                <button onClick={onBack}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all"
                  style={{ borderColor: "#CBD5E1", color: "#024677", background: "white" }}>
                  رجوع
                </button>
              </div>

              {/* login link */}
              <p className="text-center text-sm text-slate-500">
                هل لديك حساب بالفعل؟{" "}
                <button onClick={onLoginRedirect} className="font-bold" style={{ color: "#024677" }}>
                  تسجل الدخول
                </button>
              </p>

            </div>

            {/* step dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full"
                  style={{ width: 6, height: 6, background: i === 1 ? "#5AEACF" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          </div>

          {/* right side */}
          <div className="w-full lg:w-[42%] lg:shrink-0 flex flex-col gap-10 py-1 lg:mt-16">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                أكمل ملفك كمدرب
              </h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                أضف تفاصيل خبرتك لتظهر للمتدربين
              </p>
            </div>
            <ProgressSteps steps={TRAINER_STEPS} />
          </div>

        </div>
      </div>
    </div>
  );
}
