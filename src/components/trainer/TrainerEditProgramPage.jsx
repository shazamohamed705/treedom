import { useState, useEffect } from "react";
import { fetchCoachProgram, fetchFields } from "../../services/api";
import { getToken } from "../../services/auth";

const BASE_URL = "https://treedom.storge-ai.com/api";

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
const IcoGrad  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IcoSlash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"><line x1="16" y1="4" x2="8" y2="20"/></svg>;
function IcoSpinner() {
  return (
    <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────
const card = "bg-white border border-slate-200 rounded-2xl p-5 space-y-4";
const inp  = `w-full border border-slate-200 rounded-xl px-4 py-3 text-sm
  focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10
  transition placeholder:text-slate-400 bg-[#F8FAFC]`;

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function Sk({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

// ─────────────────────────────────────────────
// Sessions accordion (read-only)
// ─────────────────────────────────────────────
function SessionsAccordion({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
        <span className="text-sm font-bold text-slate-800">
          الجلسات
          <span className="mr-2 text-xs font-normal text-slate-400">({sessions.length} جلسة)</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"
          className={`transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50" dir="rtl">
          {sessions.length === 0
            ? <p className="text-sm text-slate-400 text-right px-5 py-4">لا توجد جلسات.</p>
            : sessions.map((s, i) => (
              <div key={s.id ?? i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "#14b8a6" }}>{i + 1}</span>
                  <p className="text-sm font-semibold text-slate-700">{s.title}</p>
                </div>
                <p className="text-xs text-slate-400">{s.date}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function TrainerEditProgramPage({ programId, onBack, onSaved }) {
  const [program,    setProgram]    = useState(null);
  const [fields,     setFields]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);

  // form fields
  const [nameAr,  setNameAr]  = useState("");
  const [nameEn,  setNameEn]  = useState("");
  const [price,   setPrice]   = useState("");
  const [fieldId, setFieldId] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── fetch program on mount ──────────────────
  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    setError(null);

    fetchCoachProgram(programId)
      .then(res => {
        const p = res.data ?? res;
        setProgram(p);
        setNameAr(p.name_translations?.ar ?? p.name ?? "");
        setNameEn(p.name_translations?.en ?? p.name ?? "");
        setPrice(p.price_amount ? String(parseFloat(p.price_amount)) : "");
        setFieldId(p.field?.id ? String(p.field.id) : "");
      })
      .catch(e => setError(e.message ?? "حدث خطأ أثناء تحميل البرنامج"))
      .finally(() => setLoading(false));

    // fetch fields (non-blocking)
    fetchFields({ per_page: 100 })
      .then(r => {
        const list = r?.data?.fields ?? r?.data ?? [];
        setFields(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [programId]);

  // ── build PUT body ──────────────────────────
  const buildBody = () => {
    const body = {};
    if (nameAr)  body["name[ar]"]    = nameAr;
    if (nameEn)  body["name[en]"]    = nameEn;
    if (price)   body["price_amount"] = price;
    if (fieldId) body["field_id"]    = Number(fieldId);
    return body;
  };

  // ── PUT /provider/coach-programs/:id ────────
  const handleSave = async () => {
    if (!nameAr.trim()) { showToast("اسم البرنامج بالعربي مطلوب", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/provider/coach-programs/${programId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify(buildBody()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "حدث خطأ");
      showToast("تم حفظ التعديلات بنجاح");
    } catch (e) {
      showToast(e.message ?? "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── save + submit for review ─────────────────
  const handleSubmitReview = async () => {
    if (!nameAr.trim()) { showToast("اسم البرنامج بالعربي مطلوب", "error"); return; }
    setSubmitting(true);
    try {
      // 1. save first
      const saveRes = await fetch(`${BASE_URL}/provider/coach-programs/${programId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify(buildBody()),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson?.message ?? "خطأ في الحفظ");

      // 2. submit for review
      const submitRes = await fetch(`${BASE_URL}/provider/coach-programs/${programId}/submit_for_review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      const submitJson = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitJson?.message ?? "خطأ في الإرسال");

      showToast("تم إرسال البرنامج للمراجعة بنجاح");
      setTimeout(() => onSaved?.(), 1400);
    } catch (e) {
      showToast(e.message ?? "حدث خطأ", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <IcoGrad />
          <button onClick={onBack}
            className="font-semibold text-slate-500 hover:text-teal-600 transition">
            برامجي التدريبية
          </button>
          <IcoSlash />
          <span className="text-slate-500 truncate max-w-[200px]">
            {loading ? "…" : program?.name ?? "—"}
          </span>
          <IcoSlash />
          <span className="font-bold" style={{ color: "#024677" }}>تعديل</span>
        </div>

        {/* title */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#024677" }}>تعديل البرنامج</h1>
          <p className="text-xs text-slate-400 mt-1">عدّل البيانات ثم احفظ أو أرسل للمراجعة</p>
        </div>

        {/* loading */}
        {loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => <Sk key={i} className="h-24 rounded-2xl" />)}
          </div>
        )}

        {/* error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-right">
            {error}
          </div>
        )}

        {/* form */}
        {!loading && !error && (
          <>
            {/* ── name ── */}
            <div className={card}>
              <p className="text-sm font-bold text-slate-700">اسم البرنامج</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">
                    بالعربية <span className="text-red-400">*</span>
                  </p>
                  <input
                    value={nameAr}
                    onChange={e => setNameAr(e.target.value)}
                    placeholder="اسم البرنامج بالعربية"
                    className={`${inp} text-right`}
                    dir="rtl"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">بالإنجليزية</p>
                  <input
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    placeholder="Program name in English"
                    className={`${inp} text-left`}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* ── price + field ── */}
            <div className={card}>
              <p className="text-sm font-bold text-slate-700">السعر والمجال</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">السعر (SAR)</p>
                  <input
                    value={price}
                    onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="500"
                    type="text"
                    inputMode="decimal"
                    className={`${inp} text-left`}
                    dir="ltr"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">المجال</p>
                  {fields.length > 0 ? (
                    <select
                      value={fieldId}
                      onChange={e => setFieldId(e.target.value)}
                      className={`${inp} appearance-none text-right`}>
                      <option value="">— اختر المجال —</option>
                      {fields.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name?.ar ?? f.name ?? f.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={program?.field?.name ?? ""}
                      readOnly
                      className={`${inp} text-right opacity-60 cursor-default`}
                      placeholder="لا توجد مجالات"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── sessions read-only ── */}
            {program?.sessions?.length > 0 && (
              <SessionsAccordion sessions={program.sessions} />
            )}

            {/* ── toast ── */}
            {toast && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
                  toast.type === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
                dir="rtl">
                {toast.type !== "error" && <IcoCheck />}
                {toast.msg}
              </div>
            )}

            {/* ── actions ── */}
            <div className="flex flex-col sm:flex-row gap-3 pb-8 pt-2">
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition
                           hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#14b8a6" }}>
                {submitting ? <IcoSpinner /> : null}
                حفظ وإرسال للمراجعة
              </button>

              <button
                onClick={onBack}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-200
                           bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                إلغاء
              </button>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
