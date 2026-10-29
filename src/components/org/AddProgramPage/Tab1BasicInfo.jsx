import { useState, useEffect, useRef } from "react";
import { INPUT_CLS } from "./constants";
import { IcoChevron, IcoCheck } from "./icons";

// ════ TAB 1: المعلومات الأساسية ════
export default function Tab1BasicInfo({
  indeCoach, approvedPrograms, form, set, setForm, coaches, fields,
  setActiveTab, onBack, error, setError,
}) {
  const [coachOpen, setCoachOpen]           = useState(false);
  const [backupCoachOpen, setBackupCoachOpen] = useState(false);
  const [categoryOpen, setCategoryOpen]     = useState(false);
  const [tab1Touched, setTab1Touched]       = useState(false);
  const coachRef       = useRef();
  const backupCoachRef = useRef();
  const categoryRef    = useRef();

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (coachRef.current       && !coachRef.current.contains(e.target))       setCoachOpen(false);
      if (backupCoachRef.current && !backupCoachRef.current.contains(e.target)) setBackupCoachOpen(false);
      if (categoryRef.current    && !categoryRef.current.contains(e.target))    setCategoryOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCoach = (coach) => {
    set("coachId",    coach.id);
    set("coachName",  coach.name);
    set("coachAvatar", coach.name.split(" ").map(w => w[0]).join("").slice(0, 2));
    setCoachOpen(false);
  };

  return (
    <>
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
        <div className="relative" ref={backupCoachRef}>
          <div
            onClick={() => setBackupCoachOpen(o => !o)}
            className={INPUT_CLS + " flex items-center justify-between cursor-pointer"}
          >
            {form.backupCoachId ? (
              <div className="flex items-center gap-2.5">
                {(() => {
                  const sel = coaches.find(c => String(c.id) === String(form.backupCoachId));
                  return sel?.image
                    ? <img src={sel.image} alt={sel.name} className="w-7 h-7 rounded-full object-cover shrink-0" onError={e => { e.target.style.display="none"; }} />
                    : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "#31AFEA" }}>{form.backupCoachName?.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>;
                })()}
                <span className="text-sm text-slate-700">{form.backupCoachName}</span>
              </div>
            ) : (
              <span className="text-slate-400 text-sm">اختر المدرب الاحتياطي...</span>
            )}
            <div className="flex items-center gap-1">
              {form.backupCoachId && (
                <span
                  onClick={e => { e.stopPropagation(); set("backupCoachId", ""); set("backupCoachName", ""); }}
                  className="text-slate-300 hover:text-red-400 transition p-0.5 rounded"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              )}
              <IcoChevron />
            </div>
          </div>
          {backupCoachOpen && (
            <div className="absolute top-full right-0 left-0 mt-1.5 z-50 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
              {coaches.length === 0
                ? <p className="text-xs text-slate-400 text-center py-4">لا يوجد مدربون</p>
                : coaches
                    .filter(c => String(c.id) !== String(form.coachId))
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => { set("backupCoachId", c.id); set("backupCoachName", c.name); setBackupCoachOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                        style={String(form.backupCoachId) === String(c.id) ? { background: "#eff6ff" } : {}}
                      >
                        <img src={c.image} alt={c.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          onError={e => { e.target.style.display = "none"; }} />
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-sm font-semibold text-slate-700 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 truncate">{c.specialization?.name ?? ""}</p>
                        </div>
                        {String(form.backupCoachId) === String(c.id) && <IcoCheck />}
                      </div>
                    ))
              }
            </div>
          )}
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
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-right">
          ⚠️ {error}
        </p>
      )}
    </>
  );
}
