import { useState, useRef, useEffect } from "react";
import { fetchSpecializations } from "../services/api";

// -----------------------------------------------------------------------------
// Upload icon
// -----------------------------------------------------------------------------
const IcoUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

// -----------------------------------------------------------------------------
// Shared progress steps component
// -----------------------------------------------------------------------------
const STEPS = [
  { n: 1, pct: "30%",  title: "تفعيل الحساب",      sub: "بريد الهيئة ومسؤول التواصل", done: true  },
  { n: 2, pct: "80%",  title: "بيانات الهيئة",       sub: "اسم الهيئة و تخصصها",        active: true },
  { n: 3, pct: "100%", title: "التراخيص والوثائق",   sub: "ترخيص ووثائق رسمية" },
];

function ProgressSteps() {
  return (
    <div className="flex flex-col" dir="rtl">
      {STEPS.map((s, idx) => {
        const isLast = idx === STEPS.length - 1;
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
                <p className="text-sm font-bold" style={{ color: s.active || s.done ? "#ffffff" : "rgba(255,255,255,0.35)" }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: s.active ? "rgba(255,255,255,0.55)" : s.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>{s.sub}</p>
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
// Reusable text input
// -----------------------------------------------------------------------------
function Field({ label, required, placeholder, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 text-right">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300"
      />
    </div>
  );
}

function normalizeSpecIds(raw) {
  if (Array.isArray(raw)) {
    return raw.map(id => String(id)).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function specLabel(s) {
  if (!s) return "";
  if (typeof s.name === "string") return s.name;
  return s.name?.ar ?? s.name?.en ?? s.title ?? `تخصص ${s.id}`;
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------
export default function RegisterStep3Page({ initialData = {}, onContinue, onBack, onLoginRedirect }) {
  const [logoFile,     setLogoFile]     = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [name,         setName]         = useState(initialData.name ?? "");
  const [officialAddr, setOfficialAddr] = useState(initialData.official_address ?? "");
  const [branchAddr,   setBranchAddr]   = useState(initialData.branch_address ?? "");
  const [bio,          setBio]          = useState(initialData.bio ?? "");
  const [selectedIds,  setSelectedIds]  = useState(() =>
    normalizeSpecIds(initialData.specialization_ids ?? initialData.specIds)
  );
  const [specText, setSpecText] = useState(() => {
    // لو في draft بأسماء محفوظة
    if (typeof initialData.specialization_text === "string") {
      return initialData.specialization_text;
    }
    return "";
  });
  const [specializations, setSpecializations] = useState([]);
  const [specsLoading, setSpecsLoading] = useState(true);
  const [specError, setSpecError] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    let on = true;
    setSpecsLoading(true);
    fetchSpecializations()
      .then(list => {
        if (!on) return;
        const arr = Array.isArray(list) ? list : [];
        setSpecializations(arr);
        // لو عندنا IDs محفوظة من غير نص — عبّي التكست من الأسماء
        if (!specText && selectedIds.length && arr.length) {
          const labels = selectedIds
            .map(id => {
              const found = arr.find(s => String(s.id) === String(id));
              return found ? specLabel(found) : null;
            })
            .filter(Boolean);
          if (labels.length) setSpecText(labels.join("، "));
        }
      })
      .catch(() => { if (on) setSpecializations([]); })
      .finally(() => { if (on) setSpecsLoading(false); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = name && officialAddr;

  const resolveSpecIdsFromText = (text) => {
    const parts = String(text ?? "")
      .split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean);
    const ids = [];
    const missing = [];
    parts.forEach(part => {
      const found = specializations.find(s => {
        const label = specLabel(s).toLowerCase();
        return label === part.toLowerCase();
      });
      if (found) ids.push(String(found.id));
      else missing.push(part);
    });
    return { ids: [...new Set(ids)], missing };
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const handleContinue = () => {
    if (!canSubmit) return;
    const { ids, missing } = resolveSpecIdsFromText(specText);
    if (specText.trim() && missing.length) {
      setSpecError(`تخصص غير معروف: ${missing.join("، ")}. اختر من القائمة المقترحة.`);
      return;
    }
    setSpecError(null);
    setSelectedIds(ids);
    onContinue?.({
      name,
      official_address: officialAddr,
      branch_address:   branchAddr,
      bio,
      specialization_ids: ids,
      specialization_text: specText.trim(),
      logoFile,
    });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6" dir="rtl"
      style={{ background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)" }}>
      {/* dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
      {/* logo bg */}
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
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-3">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-5 p-5 sm:p-8 lg:p-10">

              {/* treedom logo */}
              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom" style={{ height: 48, width: "auto", objectFit: "contain" }} />
              </div>

              {/* heading */}
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>البيانات التعريفية للهيئة</h1>
                <p className="text-xs text-slate-400 mt-1">أدخل التفاصيل الرئيسية الخاصة بنشاطكم التدريبي</p>
              </div>

              {/* logo upload */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 text-right">شعار الهيئة (اختياري)</label>
                <div onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                  style={{ borderColor: "#CBD5E1", background: "#F8FAFC" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#2BBFB3"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD5E1"}>
                  <div className="text-right flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#024677" }}>
                      {logoFile ? logoFile.name : "انقر للاختيار أو اسحب الملف هنا"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, SVG, أو JPEG — حجم أقصى 5 MB</p>
                  </div>
                  {logoPreview
                    ? <img src={logoPreview} alt="preview" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    : <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#E0FAF8", border: "2.32px solid #2BBFB3", color: "#2BBFB3" }}>
                        <IcoUpload />
                      </div>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </div>

              {/* name */}
              <Field label="اسم الهيئة / الأكاديمية التدريبية" required
                placeholder="اسم الهيئة الرسمي" value={name} onChange={e => setName(e.target.value)} />

              {/* specializations — تكست فيلد بالاسم، والـ IDs تتبعت تلقائي */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">التخصصات</label>
                <input
                  type="text"
                  list="provider-specializations"
                  value={specText}
                  onChange={e => { setSpecText(e.target.value); setSpecError(null); }}
                  placeholder={specsLoading ? "جارِ التحميل..." : "اكتب اسم التخصص (مفصولة بفاصلة لو أكتر من واحد)"}
                  disabled={specsLoading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300 disabled:opacity-60"
                />
                <datalist id="provider-specializations">
                  {specializations.map(s => (
                    <option key={s.id} value={specLabel(s)} />
                  ))}
                </datalist>
                {specError && (
                  <p className="text-xs text-red-500 text-right">{specError}</p>
                )}
              </div>

              {/* official address */}
              <Field label="العنوان الرسمي للمقر الرئيسي" required
                placeholder="الرياض - حي العليا" value={officialAddr} onChange={e => setOfficialAddr(e.target.value)} />

              {/* branch address */}
              <Field label="عنوان الفرع (اختياري)"
                placeholder="جدة - فرع التحلية" value={branchAddr} onChange={e => setBranchAddr(e.target.value)} />

              {/* bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 text-right">نبذة عن الهيئة</label>
                <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="اكتب نبذة تعريفية عن الهيئة ومجال عملها"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-right outline-none transition resize-none focus:border-[#024677] focus:ring-2 focus:ring-[#024677]/10 placeholder:text-slate-300" />
              </div>

              {/* buttons */}
              <div className="flex gap-3 mt-1">
                <button onClick={handleContinue} disabled={!canSubmit}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{ background: canSubmit ? "#024677" : "#E2E8F0", color: canSubmit ? "#ffffff" : "#94A3B8", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                  التالي — بيانات المسؤول
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

          {/* ── right side ── */}
          <div className="w-full lg:w-[42%] lg:shrink-0 flex flex-col gap-10 py-1 lg:mt-16">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">انضم كـ هيئة تدريبية</h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                أدر برامجك ومدربيك بكفاءة على Treedom
              </p>
            </div>
            <ProgressSteps />
          </div>

        </div>
      </div>
    </div>
  );
}
