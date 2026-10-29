import { useState, useRef, useEffect } from "react";
import { registerTrainee } from "../../services/api";
import { normalizePhone, isPhoneValid, PHONE_ERROR_AR } from "../../services/registerDraft";

// ── icons ─────────────────────────────────────────────────────────────────────
const IcoUpload = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── progress steps ────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",               sub: "البريد وكلمة المرور",     done: true  },
  { n: 2, pct: "80%",  title: "البيانات الشخصية",            sub: "الاسم والهوية والاهتمامات", active: true },
  { n: 3, pct: "100%", title: "تفعيل الحساب",               sub: "رمز التحقق على بريدك"      },
];

function ProgressSteps() {
  return (
    <div className="flex flex-col" dir="rtl">
      {STEPS.map((s, idx) => {
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={s.n}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2"
                style={{
                  borderColor: s.active || s.done ? "#5AEACF" : "rgba(255,255,255,0.2)",
                  background:  s.done ? "#5AEACF" : "transparent",
                  color:       s.done ? "#024677" : s.active ? "#5AEACF" : "rgba(255,255,255,0.3)",
                }}>
                {s.done ? <IcoCheck /> : s.n}
              </div>
              <div className="text-right flex-1">
                <p className="text-sm font-bold"
                  style={{ color: s.active || s.done ? "#fff" : "rgba(255,255,255,0.35)" }}>{s.title}</p>
                <p className="text-xs mt-0.5"
                  style={{ color: s.active ? "rgba(255,255,255,0.55)" : s.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>{s.sub}</p>
              </div>
              <span className="text-base font-bold w-12 text-left shrink-0"
                style={{ color: s.active || s.done ? "#5AEACF" : "rgba(255,255,255,0.3)" }}>{s.pct}</span>
            </div>
            {!isLast && (
              <div className="flex items-center py-3">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <svg width="14" height="32" viewBox="0 0 14 32" fill="none">
                    <line x1="7" y1="0" x2="7" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M3 20l4 8 4-8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── shared input class ────────────────────────────────────────────────────────
const INP = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300";

// ── main ──────────────────────────────────────────────────────────────────────
export default function RegisterTraineeStep3Page({ regData, initialData = {}, onContinue, onBack, onLoginRedirect }) {
  const draft = { ...regData, ...initialData };
  // personal
  const [name,        setName]        = useState(draft.name ?? "");
  const [birthDate,   setBirthDate]   = useState(draft.birth_date ?? "");
  const [nationalityId, setNationalityId] = useState(String(draft.nationality_id ?? "1"));
  const [cityId,      setCityId]      = useState(String(draft.city_id ?? "1"));
  // fields (interests)
  const [fieldIds,    setFieldIds]    = useState(Array.isArray(draft.field_ids) ? draft.field_ids : []);
  // identity
  const [idType,      setIdType]      = useState(draft.identity_document_type ?? "national_id");
  const [idNumber,    setIdNumber]    = useState(draft.identity_number ?? "");
  const [idFile,      setIdFile]      = useState(null);
  const [terms,       setTerms]       = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const idRef = useRef();

  const FIELDS_OPTIONS = [
    { id: "1", label: "تدريب"        },
    { id: "2", label: "استشارات"     },
    { id: "3", label: "تقنية المعلومات" },
    { id: "4", label: "إدارة الأعمال"  },
    { id: "5", label: "التسويق"       },
  ];

  const ID_TYPES = [
    { value: "national_id", label: "بطاقة هوية وطنية" },
    { value: "passport",    label: "جواز سفر"         },
    { value: "iqama",       label: "إقامة"            },
  ];

  const toggleField = (id) => {
    setFieldIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const canSubmit = name && birthDate && idNumber && terms && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const phone = normalizePhone(regData?.phone);
      if (!isPhoneValid(phone)) {
        throw new Error(PHONE_ERROR_AR);
      }
      const fd = new FormData();
      fd.append("name",                  name);
      fd.append("email",                 regData.email);
      fd.append("phone",                 phone);
      fd.append("country_code",          regData.country_code || "966");
      fd.append("password",              regData.password);
      fd.append("password_confirmation", regData.password_confirmation || regData.password);
      fd.append("birth_date",            birthDate);
      fd.append("nationality_id",        nationalityId);
      fd.append("city_id",               cityId);
      fieldIds.forEach(id => fd.append("field_ids[]", id));
      fd.append("identity_document_type", idType);
      fd.append("identity_number",        idNumber);
      if (idFile) fd.append("identity_document", idFile);
      fd.append("terms_accepted", "1");

      await registerTrainee(fd);
      onContinue?.({
        email: regData.email,
        name,
        birth_date: birthDate,
        nationality_id: nationalityId,
        city_id: cityId,
        field_ids: fieldIds,
        identity_document_type: idType,
        identity_number: idNumber,
      });
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{ background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)" }}>

      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}/>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "url('/logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center 60%",
        backgroundSize: "250%",
        opacity: 0.06,
      }}/>

      <div className="relative w-full max-w-6xl flex flex-col items-center gap-4">
        <div className="w-full flex flex-col lg:flex-row-reverse items-start gap-6 lg:gap-8">

          {/* ── white card ── */}
          <div className="w-full lg:flex-1 flex flex-col gap-3">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-4 p-5 sm:p-8 lg:p-10">

              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom" style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>البيانات الشخصية</h1>
                <p className="text-xs text-slate-400 mt-1">أكمل بياناتك لإنشاء حسابك</p>
              </div>

              {/* الاسم */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">الاسم الكامل <span className="text-red-400">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="أحمد محمد محمود" className={INP} />
              </div>

              {/* تاريخ الميلاد */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">تاريخ الميلاد <span className="text-red-400">*</span></label>
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={INP} dir="ltr" />
              </div>

              {/* الجنسية والمدينة */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 text-right">الجنسية</label>
                  <select value={nationalityId} onChange={e => setNationalityId(e.target.value)} className={INP + " cursor-pointer"}>
                    <option value="1">سعودي</option>
                    <option value="2">مصري</option>
                    <option value="3">إماراتي</option>
                    <option value="4">أخرى</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 text-right">المدينة</label>
                  <select value={cityId} onChange={e => setCityId(e.target.value)} className={INP + " cursor-pointer"}>
                    <option value="1">الرياض</option>
                    <option value="2">جدة</option>
                    <option value="3">الدمام</option>
                    <option value="4">مكة المكرمة</option>
                  </select>
                </div>
              </div>

              {/* مجالات الاهتمام */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 text-right">مجالات الاهتمام</label>
                <div className="flex flex-wrap gap-2">
                  {FIELDS_OPTIONS.map(f => {
                    const active = fieldIds.includes(f.id);
                    return (
                      <button key={f.id} type="button" onClick={() => toggleField(f.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
                        style={{
                          background:   active ? "#024677" : "#f8fafc",
                          color:        active ? "#fff"    : "#64748b",
                          borderColor:  active ? "#024677" : "#e2e8f0",
                        }}>
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* نوع الوثيقة */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">نوع وثيقة الهوية <span className="text-red-400">*</span></label>
                <select value={idType} onChange={e => setIdType(e.target.value)} className={INP + " cursor-pointer"}>
                  {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* رقم الهوية */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">رقم الهوية <span className="text-red-400">*</span></label>
                <input value={idNumber} onChange={e => setIdNumber(e.target.value)}
                  placeholder="1234567890" className={INP} dir="ltr" />
              </div>

              {/* رفع صورة الهوية */}
              <div className="flex flex-col gap-2 min-w-0 w-full">
                <label className="text-sm font-medium text-slate-700 text-right">
                  صورة وثيقة الهوية <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div onClick={() => idRef.current?.click()}
                  className="flex items-center gap-3 sm:gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-w-0 overflow-hidden"
                  style={{ borderColor: "#CBD5E1", background: "#F8FAFC" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#024677"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD5E1"}>
                  <div className="text-right flex-1 min-w-0 overflow-hidden">
                    <p
                      className="text-sm font-semibold break-all"
                      style={{ color: "#024677", overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" }}
                      title={idFile?.name || undefined}
                      dir={idFile ? "ltr" : "rtl"}
                    >
                      {idFile ? idFile.name : "انقر للاختيار أو اسحب الملف هنا"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF, JPG — حجم أقصى 5 MB</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#E0FAF8", border: "2px solid #2BBFB3", color: "#2BBFB3" }}>
                    <IcoUpload />
                  </div>
                </div>
                <input ref={idRef} type="file" accept=".pdf,image/*" className="hidden"
                  onChange={e => setIdFile(e.target.files?.[0] || null)} />
              </div>

              {/* الشروط والأحكام */}
              <div className="flex items-center justify-end gap-3">
                <label className="text-sm text-slate-600 cursor-pointer select-none" onClick={() => setTerms(v => !v)}>
                  أوافق على <span className="font-bold" style={{ color: "#024677" }}>الشروط والأحكام</span> وسياسة الخصوصية
                </label>
                <button type="button" onClick={() => setTerms(v => !v)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition"
                  style={{ borderColor: terms ? "#024677" : "#cbd5e1", background: terms ? "#024677" : "#fff" }}>
                  {terms && <IcoCheck />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-right">{error}</p>
              )}

              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={!canSubmit}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  style={{ background: canSubmit ? "#024677" : "#E2E8F0", color: canSubmit ? "#fff" : "#94A3B8", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                  {loading && (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                  )}
                  إنشاء الحساب
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

            <div className="flex items-center justify-center gap-2 pt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full"
                  style={{ width: 6, height: 6, background: i === 1 ? "#5AEACF" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          </div>

          {/* ── right side ── */}
          <div className="w-full lg:w-[42%] lg:shrink-0 flex flex-col gap-10 py-1 lg:mt-16">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">أكمل ملفك الشخصي</h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                أضف بياناتك لنقترح عليك المحتوى التدريبي المناسب
              </p>
            </div>
            <ProgressSteps />
          </div>

        </div>
      </div>
    </div>
  );
}
