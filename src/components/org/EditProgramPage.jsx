import { useState, useEffect, useRef } from "react";
import { useToast } from "../shared/ToastProvider";
import {
  fetchProgram,
  fetchCoaches,
  updateProgram,
  submitProgram,
} from "../../services/api";
import { isIndeCoach } from "../../services/auth";

// ── constants ─────────────────────────────────────────────────────────────────
const DESC_MAX = 339;

const CARD_CLS =
  "bg-white border border-slate-200 rounded-2xl p-5 space-y-3";

const INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm " +
  "focus:outline-none focus:border-teal-400 transition " +
  "placeholder:text-slate-400 text-right";

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoGrad() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function IcoSlash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
      <line x1="16" y1="4" x2="8" y2="20" />
    </svg>
  );
}
function IcoChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin shrink-0" width="14" height="14"
      viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
function IcoSpinnerDark() {
  return (
    <svg className="animate-spin" width="30" height="30"
      viewBox="0 0 24 24" fill="none" stroke="#024677"
      strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ── sessions accordion (read-only) ────────────────────────────────────────────
function SessionsAccordion({ sessions = [] }) {
  const [open, setOpen] = useState(false);

  function typeLabel(raw) {
    if (!raw) return "";
    if (typeof raw === "object") return raw.text ?? "";
    return ({ 0: "أونلاين (Zoom)", 1: "مسجلة", 2: "حضوري" })[raw] ?? String(raw);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" dir="ltr">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
        <span className={`transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`}>
          <IcoChevron />
        </span>
        <span className="text-base font-bold" style={{ color: "#024677" }}>
          المحتوى التدريبي ({sessions.length} جلسة)
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-right px-5 py-4">لا توجد جلسات.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((s, i) => (
                <div key={s.id ?? i} className="px-5 py-3 flex items-center justify-between gap-3" dir="rtl">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "#14b8a6" }}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {s.title || "جلسة بدون عنوان"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{typeLabel(s.type)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-400">{s.date ?? ""}</p>
                    <p className="text-[11px] text-slate-400">{s.starts_at ?? ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function EditProgramPage({ programId, onBack }) {
  const showToast = useToast();
  const id = programId ?? sessionStorage.getItem("viewProgramId") ?? null;
  const indeCoach = isIndeCoach();

  const [form, setForm] = useState({
    name: "", nameEn: "", trainer: "", trainerId: "", trainerInitial: "",
    sessions: "12", hours: "36",
    startDate: "", endDate: "", desc: "",
    price: "", maxCapacity: "15",
  });
  const [sessionList, setSessionList] = useState([]);
  const [coaches,     setCoaches]     = useState([]);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const dropRef = useRef();
  const charsLeft = DESC_MAX - (form.desc?.length ?? 0);

  // load program + coaches
  useEffect(() => {
    if (!id) { setLoading(false); return; }

    const load = indeCoach
      ? fetchProgram(id).then(progRes => [progRes, null])
      : Promise.all([fetchProgram(id), fetchCoaches({ per_page: 100 })]);

    load
      .then(([progRes, coachRes]) => {
        const p = progRes?.data;
        if (p) {
          const coachName = p.trainer?.name ?? p.coach?.name ?? "";
          setForm({
            name:           p.name_translations?.ar ?? p.name ?? "",
            nameEn:         p.name_translations?.en ?? "",
            trainer:        coachName,
            trainerId:      p.trainer?.id ?? p.coach?.id ?? "",
            trainerInitial: coachName.trim().charAt(0) || "م",
            sessions:       String(p.sessions_count_planned ?? p.sessions_count ?? 12),
            hours:          String(p.hours_count ?? 36),
            startDate:      p.start_date     ?? "",
            endDate:        p.end_date       ?? "",
            desc:           p.description_translations?.ar ?? p.description ?? "",
            price:          p.price_amount != null ? String(Number(p.price_amount)) : "",
            maxCapacity:    p.max_capacity != null ? String(p.max_capacity) : "15",
          });
          setSessionList(p.sessions ?? []);
        }
        setCoaches(coachRes?.data?.coaches ?? []);
      })
      .catch(err => setError(err.message || "حدث خطأ أثناء تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name[ar]",               form.name);
    fd.append("name[en]",               form.name);
    fd.append("description[ar]",        form.desc);
    fd.append("description[en]",        form.desc);
    fd.append("coach_id",               form.trainerId);
    fd.append("hours_count",            form.hours);
    fd.append("sessions_count_planned", form.sessions);
    fd.append("start_date",             form.startDate);
    fd.append("end_date",               form.endDate);
    return fd;
  };

  const buildIndePayload = () => ({
    name: {
      ar: form.name,
      en: form.nameEn || form.name,
    },
    price_amount: Number(form.price) || 0,
    max_capacity: Number(form.maxCapacity) || 15,
  });

  const handleSave = async () => {
    if (!form.name) { setError("اسم البرنامج مطلوب"); return; }
    setSaving(true);
    setError(null);
    try {
      if (indeCoach) {
        await updateProgram(id, buildIndePayload());
        showToast("تم تحديث بيانات البرنامج التدريبي بنجاح", "success");
      } else {
        await updateProgram(id, buildFormData());
        await submitProgram(id);
        showToast("تم حفظ التعديلات وإرسالها للمراجعة", "success");
      }
      setTimeout(() => onBack?.(), 1200);
    } catch (err) {
      showToast(err.message || "حدث خطأ", "error");
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-50" dir="rtl">
        <IcoSpinnerDark />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50" dir="rtl">
      <div className="max-w-4xl mx-auto px-3 py-6 space-y-4">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          <IcoGrad />
          <button onClick={onBack}
            className="text-sm font-semibold text-slate-500 hover:text-teal-600 transition">
            البرامج التدريبية
          </button>
          <IcoSlash />
          <span className="text-sm text-slate-500">{form.name}</span>
          <IcoSlash />
          <span className="text-sm font-bold" style={{ color: "#024677" }}>تعديل</span>
        </div>

        {/* page title */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#024677" }}>
            تعديل بيانات البرنامج والمنهج التدريبي
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تعديل بيانات البرنامج والمحتوى التدريبي من هنا قبل إرساله مجدداً
          </p>
        </div>

        {/* ── program name ── */}
        <div className={CARD_CLS}>
          <label className="block text-sm font-bold text-slate-700 text-right">
            اسم البرنامج التدريبي
          </label>
          <input
            value={form.name}
            onChange={e => set("name", e.target.value)}
            className={INPUT_CLS}
            style={{ background: "#F8FAFC" }}
          />
        </div>

        {/* ── trainer ── */}
        {!indeCoach && (
        <div className={CARD_CLS}>
          <label className="block text-sm font-bold text-slate-700 text-right">
            المدرب المسؤول
          </label>
          <div className="relative" ref={dropRef}>
            <div
              onClick={() => setDropOpen(o => !o)}
              className={INPUT_CLS + " flex items-center justify-between cursor-pointer"}
              style={{ background: "#F8FAFC" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "#14b8a6" }}>
                  {form.trainerInitial}
                </div>
                <span className="text-sm text-slate-700">
                  {form.trainer || "اختر المدرب..."}
                </span>
              </div>
              <IcoChevron />
            </div>

            {dropOpen && coaches.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-1.5 z-50 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                {coaches.map(coach => (
                  <div key={coach.id}
                    onClick={() => {
                      set("trainerId",      coach.id);
                      set("trainer",        coach.name);
                      set("trainerInitial", coach.name.trim().charAt(0));
                      setDropOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                    style={form.trainerId === coach.id ? { background: "#f0fdf4" } : {}}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "#14b8a6" }}>
                      {coach.name.trim().charAt(0)}
                    </div>
                    <span className="text-sm text-slate-700 flex-1 text-right">{coach.name}</span>
                    {form.trainerId === coach.id && <IcoCheck />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {indeCoach && (
        <div className={CARD_CLS}>
          <label className="block text-sm font-bold text-slate-700 text-right">
            السعر والسعة
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1.5">السعر لكل متدرب</p>
              <input
                value={form.price}
                onChange={e => set("price", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition text-right"
                style={{ background: "#F8FAFC" }}
                dir="ltr"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">الحد الأقصى للمتدربين</p>
              <input
                type="number"
                min="1"
                value={form.maxCapacity}
                onChange={e => set("maxCapacity", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition text-right"
                style={{ background: "#F8FAFC" }}
                dir="ltr"
              />
            </div>
          </div>
        </div>
        )}

        {!indeCoach && (
        <div className={CARD_CLS}>
          <label className="block text-sm font-bold text-slate-700 text-right">
            الجدول الزمني والمدة
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "إجمالي الجلسات",  key: "sessions"  },
              { label: "إجمالي الساعات",   key: "hours"     },
              { label: "تاريخ البدء",       key: "startDate", type: "date" },
              { label: "تاريخ الانتهاء",    key: "endDate",   type: "date" },
            ].map(f => (
              <div key={f.key}>
                <p className="text-xs text-slate-500 mb-1.5">{f.label}</p>
                <input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400"
                  style={{ background: "#F8FAFC" }}
                />
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── description ── */}
        {!indeCoach && (
        <div className={CARD_CLS}>
          <label className="block text-sm font-bold text-slate-700 text-right">
            وصف البرنامج وأهدافه التعليمية
          </label>
          <textarea
            value={form.desc}
            onChange={e => set("desc", e.target.value.slice(0, DESC_MAX))}
            placeholder="اكتب وصفاً شاملاً للبرنامج وأهدافه..."
            rows={5}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none"
            style={{ background: "#F8FAFC" }}
          />
          <p className="text-[11px] text-slate-400 text-left" dir="ltr">
            {charsLeft} حرف
          </p>
        </div>
        )}

        {/* ── sessions list (read-only) ── */}
        <SessionsAccordion sessions={sessionList} />

        {/* error */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-right">
            {error}
          </p>
        )}

        {/* actions */}
        <div className="flex items-center gap-3 pb-8 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#024677" }}
          >
            {saving && <IcoSpinner />}
            {indeCoach ? "حفظ التعديلات" : "حفظ وإرسال للمراجعة"}
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            إلغاء
          </button>
        </div>

      </div>
    </main>
  );
}
