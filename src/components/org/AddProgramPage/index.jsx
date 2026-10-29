import { useState, useEffect } from "react";
import { useToast } from "../../shared/ToastProvider";
import {
  fetchCoaches,
  fetchFields,
  fetchApprovedPrograms,
  createProgram,
  submitProgram,
} from "../../../services/api";
import { isIndeCoach } from "../../../services/auth";
import useZoomAuto from "../../../hooks/useZoomAuto";
import SessionEditPage from "../SessionEditPage";

import { loadDraft, saveDraft, clearDraft } from "./draft";
import { buildFormData, debugFormData, extractErrorMsg } from "./helpers";
import { DEFAULT_FORM } from "./constants";
import { IcoGrad, IcoSlash } from "./icons";
import ProgramPreview from "./ProgramPreview";
import SubmitSuccessModal from "./SubmitSuccessModal";
import Tab1BasicInfo from "./Tab1BasicInfo";
import Tab2Schedule from "./Tab2Schedule";
import Tab3Content from "./Tab3Content";

export default function AddProgramPage({ onBack }) {
  const showToast = useToast();
  const { autoZoom: autoZoomSetting } = useZoomAuto();
  const indeCoach = isIndeCoach();
  // للمدرب المستقل الـ API بتولّد رابط Zoom تلقائياً — لا يحتاج يدخل رابط يدوياً
  const autoZoom = indeCoach ? true : autoZoomSetting;

  const draft = loadDraft();
  const [sessions] = useState(draft?.sessions ?? []);
  // merge draft with DEFAULT_FORM so new fields always have their defaults
  const [form, setForm] = useState(draft?.form ? { ...DEFAULT_FORM, ...draft.form } : { ...DEFAULT_FORM });
  const [coaches,        setCoaches]        = useState([]);
  const [fields,         setFields]         = useState([]);
  const [approvedPrograms, setApprovedPrograms] = useState([]);

  const [activeTab,     setActiveTab]     = useState(1);

  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // auto-save draft
  useEffect(() => { saveDraft(form, sessions); }, [form, sessions]);

  // load dropdowns
  useEffect(() => {
    if (isIndeCoach()) {
      fetchApprovedPrograms()
        .then(r => setApprovedPrograms(r.data?.programs ?? []))
        .catch(() => {});
    } else {
      fetchCoaches({ per_page: 100 }).then(r => setCoaches(r.data?.coaches ?? [])).catch(() => {});
    }
    fetchFields({  per_page: 100 }).then(r => {
      const list = r.data?.fields ?? [];
      const seen = new Set();
      setFields(list.filter(f => {
        const key = String(f.id ?? "").trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
    }).catch(() => {});
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // ── submit for review ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // log current form state for debugging
    console.log("[AddProgram] form state on submit:", {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      coachId: form.coachId,
      categoryId: form.categoryId,
      price: form.price,
    });
    if (!form.name || !form.startDate || !form.endDate) {
      console.warn("[AddProgram] client validation failed — missing fields:", {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setError("اسم البرنامج وتاريخ البدء والانتهاء مطلوبة");
      return;
    }
    setSaving(true); setError(null); setSubmitMsg(null);
    try {
      const fd = buildFormData(form, sessions, false, autoZoom);
      debugFormData("POST /provider/programs (submit)", fd);
      const created = await createProgram(fd);
      // handle different API response shapes: { data: { id } } or { data: { program: { id } } } or { id }
      const programId = created?.data?.id ?? created?.data?.program?.id ?? created?.id;
      if (!programId) throw new Error("لم يتم الحصول على معرّف البرنامج من الخادم");
      const result  = await submitProgram(programId);
      clearDraft();
      const msg = extractErrorMsg(result) || "تم إرسال البرنامج للمراجعة، وهو بانتظار موافقة الجهة التدريبية";
      setSubmitMsg(msg);
      showToast("تم إرسال البرنامج للمراجعة بنجاح", "success");
    } catch (err) {
      // log full error details to console for debugging
      console.error("[AddProgram] submit error:", err);
      const msg = extractErrorMsg(err) || err.message || "حدث خطأ أثناء الإرسال";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── لو في درس مختار: عرض صفحة التعديل كاملة ──
  if (selectedLesson) {
    return (
      <SessionEditPage
        key={selectedLesson.key}
        lesson={selectedLesson}
        unitTitle={selectedLesson.unitTitle}
        programName="إضافة برنامج جديد"
        onSave={(data) => {
          // write back into form.units so video/attachments/desc are persisted
          const { unitIndex, lessonIndex } = selectedLesson;
          if (unitIndex != null && lessonIndex != null) {
            setForm(prev => {
              const units = prev.units ? [...prev.units] : [];
              if (units[unitIndex]) {
                const lessonList = [...(units[unitIndex].lessonNames || [])];
                const existing   = typeof lessonList[lessonIndex] === "object"
                  ? lessonList[lessonIndex]
                  : { name: lessonList[lessonIndex] || `درس ${lessonIndex + 1}`, desc: "", video: null, attachments: [] };
                lessonList[lessonIndex] = { ...existing, ...data };
                units[unitIndex] = { ...units[unitIndex], lessonNames: lessonList };
              }
              return { ...prev, units };
            });
          }
          setSelectedLesson(prev => ({ ...prev, ...data }));
        }}
        onCancel={() => setSelectedLesson(null)}
      />
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">

        {/* ── title ── */}
        <div className="flex items-center gap-2 mb-6" dir="rtl">
          <IcoGrad />
          <button onClick={onBack}
            className="text-sm font-semibold text-slate-500 hover:text-teal-600 transition">
            البرامج التدريبية
          </button>
          <IcoSlash />
          <span className="text-sm font-bold" style={{ color: "#024677" }}>
            إضافة برنامج جديد
          </span>
        </div>

        {/* ── 3-step tabs ── */}
        <div className="w-full mb-6 mt-4 flex border border-slate-200 rounded-xl overflow-hidden" dir="rtl">
          {[
            { n: 1, label: "المعلومات الأساسية" },
            { n: 2, label: "الجدول الزمني"      },
            { n: 3, label: "المحتوى والتقييمات" },
          ].map((tab, idx) => {
            const active = activeTab === tab.n;
            const done   = activeTab > tab.n;
            return (
              <div key={tab.n} className="flex flex-1 min-w-0">
                {idx > 0 && (
                  <div className="w-px bg-slate-200 shrink-0 self-stretch" />
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.n)}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 text-xs sm:text-sm font-medium transition whitespace-nowrap min-w-0"
                  style={{
                    background: active ? "#024677" : done ? "#f0fdf4" : "#f8fafc",
                    color: active ? "#fff" : done ? "#14b8a6" : "#94a3b8",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      background: active ? "rgba(255,255,255,0.2)" : done ? "#14b8a6" : "#e2e8f0",
                      color: active ? "#fff" : done ? "#fff" : "#94a3b8",
                    }}>
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : tab.n}
                  </span>
                  <span className="truncate hidden xs:inline sm:inline">{tab.label}</span>
                  <span className="truncate xs:hidden sm:hidden">{tab.n === 1 ? "الأساسية" : tab.n === 2 ? "الجدول" : "المحتوى"}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className={`flex flex-col xl:flex-row gap-5 items-start ${activeTab === 3 ? "xl:flex-row-reverse" : ""}`}>

          {/* ── form ── */}
          <div className={`w-full min-w-0 space-y-5 ${activeTab === 3 ? "" : "xl:flex-1"}`}>

            {/* ════ TAB 1: المعلومات الأساسية ════ */}
            {activeTab === 1 && (
              <Tab1BasicInfo
                indeCoach={indeCoach}
                approvedPrograms={approvedPrograms}
                form={form}
                set={set}
                setForm={setForm}
                coaches={coaches}
                fields={fields}
                setActiveTab={setActiveTab}
                onBack={onBack}
                error={error}
                setError={setError}
              />
            )}

            {/* ════ TAB 2: الجدول الزمني ════ */}
            {activeTab === 2 && (
              <Tab2Schedule
                form={form}
                set={set}
                setActiveTab={setActiveTab}
                setError={setError}
              />
            )}

            {/* ════ TAB 3: المحتوى والتقييمات ════ */}
            {activeTab === 3 && (
              <Tab3Content
                form={form}
                set={set}
                selectedLesson={selectedLesson}
                setSelectedLesson={setSelectedLesson}
                handleSubmit={handleSubmit}
                saving={saving}
                onBack={onBack}
                error={error}
              />
            )}

          </div>

          {/* ── preview sidebar — hidden on mobile, visible on xl+ ── */}
          {activeTab !== 3 && (
            <div className="hidden xl:block xl:w-72 xl:shrink-0">
              <ProgramPreview form={form} sessions={sessions} indeCoach={indeCoach} />
            </div>
          )}
        </div>
      </div>

      {/* submit success modal */}
      <SubmitSuccessModal
        message={submitMsg}
        onClose={() => setSubmitMsg(null)}
        onDone={() => { setSubmitMsg(null); onBack?.(); }}
      />
    </main>
  );
}
