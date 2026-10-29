import { useState } from "react";
import { enrollTrainee, submitEmployeeFundingRequest } from "../../../services/api";
import { getUser, getUserRole } from "../../../services/auth";

// ── helpers ───────────────────────────────────────────────────────────────────
function isStaffOrEmployee() {
  const role = getUserRole();
  if (role === "employee") return true;
  const u = getUser();
  const t = u?.type ?? u?.role ?? null;
  return t === "staff" || t === "employee";
}

function fmtPrice(val) {
  const n = parseFloat(val);
  if (!n && n !== 0) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── icons ─────────────────────────────────────────────────────────────────────
const IcoClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2.5"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcoBuilding = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoSAR = () => (
  <span style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", fontWeight: 700, color: "inherit", lineHeight: 1 }}>
    ﷼
  </span>
);

// ── shared modal shell ────────────────────────────────────────────────────────
function ModalShell({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(2,17,38,0.55)", backdropFilter: "blur(2px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        dir="rtl"
        className="w-full bg-white flex flex-col rounded-t-[24px] sm:rounded-[20px] shadow-2xl
          max-h-[92dvh] overflow-y-auto sm:max-w-[580px] sm:mx-4"
        style={{ animation: "enrollUp 0.2s cubic-bezier(0.34,1.1,0.64,1)" }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
      <style>{`
        @keyframes enrollUp {
          from { opacity:0; transform:translateY(24px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ── program info chip ─────────────────────────────────────────────────────────
function ProgramChip({ program }) {
  const trainerName = typeof program?.trainer === "object"
    ? program.trainer?.name
    : program?.trainer;

  return (
    <div className="mx-5 mb-4 rounded-2xl px-4 py-3 text-right"
      style={{ background: "#F4F7FA", border: "1px solid #E4EBF1" }}>
      <p className="text-[13px] font-bold leading-snug text-[#0B2A45]">
        {program?.name ?? program?.title ?? "البرنامج التدريبي"}
      </p>
      {trainerName && trainerName !== "—" && (
        <p className="text-[11.5px] mt-0.5 text-[#7B91A8]">{trainerName}</p>
      )}
    </div>
  );
}

// ── radio option card ─────────────────────────────────────────────────────────
function OptionCard({ id, selected, onSelect, icon, title, subtitle }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(id)}
      className="w-full text-right flex items-center gap-3 rounded-2xl px-4 py-3.5
        transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#31AFEA]/40"
      style={{
        background: selected ? "rgba(49,175,234,0.06)" : "#fff",
        border:     selected ? "1.5px solid #31AFEA"   : "1.5px solid #E2E8F0",
        cursor:     "pointer",
      }}
    >
      {/* icon */}
      <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: selected ? "rgba(49,175,234,0.15)" : "rgba(49,175,234,0.08)",
          color: "#31AFEA",
        }}>
        {icon}
      </div>

      {/* text */}
      <div className="flex-1 min-w-0 text-right">
        <p className="text-[13.5px] font-bold text-[#0B2A45] leading-snug">{title}</p>
        {subtitle && (
          <p className="text-[11px] mt-0.5 text-[#7B91A8] leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* radio */}
      <div className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all"
        style={{
          border:     selected ? "none"    : "1.5px solid #C8D8E8",
          background: selected ? "#31AFEA" : "transparent",
          boxShadow:  selected ? "0 0 0 3px rgba(49,175,234,0.2)" : "none",
        }}>
        {selected && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
      </div>
    </button>
  );
}

// ── STEP 1 — اختيار طريقة التسجيل ────────────────────────────────────────────
function StepChoice({ program, showCompany, onClose, onSelfPay, onCompanyFunding }) {
  // الموظف/الموظفة: تمويل الشركة فقط — بدون «ادفع بنفسك»
  const [choice, setChoice] = useState(showCompany ? "company" : null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const canGo = !!choice && !loading;

  const handleContinue = async () => {
    if (!canGo) return;
    if (choice === "self") {
      const pid = Number(program?.id ?? program?.programId);
      if (!pid) { setError("برنامج غير صالح."); return; }
      setLoading(true); setError(null);
      try {
        const res = await enrollTrainee({ program_id: pid });
        onSelfPay(res);
      } catch (err) {
        setError(err?.message ?? "تعذر إتمام التسجيل، حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    } else {
      onCompanyFunding();
    }
  };

  return (
    <ModalShell onClose={onClose}>
      {/* header */}
      <div className="flex items-start justify-between px-5 pt-6 pb-4 shrink-0">
        <div className="flex-1 min-w-0 pl-3 text-right">
          <h2 className="text-[19px] sm:text-[21px] font-extrabold text-[#0B2A45] leading-tight">
            طريقة التسجيل
          </h2>
          <p className="text-[12.5px] mt-1 text-[#6B8AA6]">
            {showCompany
              ? "التسجيل يتم عبر طلب تمويل من شركتك"
              : "اختر كيف تريد التسجيل في البرنامج"}
          </p>
        </div>
        <button onClick={onClose} aria-label="إغلاق"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100
            transition shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          style={{ color: "#64748b" }}>
          <IcoClose />
        </button>
      </div>

      <ProgramChip program={program} />

      {/* options — employees never see self-pay */}
      <div className="px-5 flex flex-col gap-2.5 shrink-0">
        {!showCompany && (
          <OptionCard id="self" selected={choice === "self"} onSelect={setChoice}
            icon={<IcoCard />} title="ادفع بنفسك"
            subtitle="بطاقة بنكية · Vodafone Cash · InstaPay" />
        )}
        {showCompany && (
          <OptionCard id="company" selected={choice === "company"} onSelect={setChoice}
            icon={<IcoBuilding />} title="طلب تمويل من الشركة"
            subtitle="يتم إرسال طلب لمسؤول الشركة للموافقة" />
        )}
      </div>

      {/* error */}
      {error && (
        <p className="text-[12px] text-red-500 text-center px-5 pt-3 shrink-0">{error}</p>
      )}

      {/* actions */}
      <div className="px-5 pt-5 pb-6 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
        <button type="button" onClick={onClose} disabled={loading}
          className="flex-1 py-3.5 rounded-2xl text-[13.5px] font-bold
            hover:bg-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          style={{ border: "1.5px solid #D1DCE7", color: "#4A6580",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
          إلغاء
        </button>
        <button type="button" onClick={handleContinue} disabled={!canGo}
          className="flex-1 py-3.5 rounded-2xl text-[13.5px] font-extrabold text-white
            flex items-center justify-center gap-2 transition
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#31AFEA]/50"
          style={{ background: canGo ? "#31AFEA" : "#B8D9EE",
            cursor: canGo ? "pointer" : "not-allowed" }}>
          {loading
            ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>جارٍ التسجيل…</>
            : "متابعة"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── STEP 2 — شاشة تأكيد طلب التمويل ─────────────────────────────────────────
function StepFunding({ program, onClose, onBack, onSuccess }) {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [note,     setNote]     = useState("");

  const price     = parseFloat(program?.price ?? program?.price_amount ?? 0) || 0;
  const hasNote   = note.trim().length > 0;

  const handleSubmit = async () => {
    const pid = Number(program?.id ?? program?.programId);
    if (!pid) { setError("برنامج غير صالح."); return; }
    setLoading(true); setError(null);
    try {
      await submitEmployeeFundingRequest({
        program_id: pid,
        ...(hasNote ? { body: note.trim() } : {}),
      });
      onSuccess({ company: true });
    } catch (err) {
      setError(err?.message ?? "تعذر إرسال الطلب، حاول مرة أخرى.");
      setLoading(false);
    }
  };

  const trainerName = typeof program?.trainer === "object"
    ? program.trainer?.name
    : program?.trainer;

  return (
    <ModalShell onClose={onClose}>
      {/* header */}
      <div className="flex items-start justify-between px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* back button */}
          <button onClick={onBack} aria-label="رجوع"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100
              transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            style={{ color: "#64748b" }}>
            <IcoBack />
          </button>
          <div className="flex-1 min-w-0 text-right">
            <h2 className="text-[19px] sm:text-[21px] font-extrabold text-[#0B2A45] leading-tight">
              طلب تمويل من الشركة
            </h2>
            <p className="text-[12.5px] mt-0.5 text-[#6B8AA6]">
              سيتم إرسال الطلب لمسؤول الشركة للمراجعة والموافقة
            </p>
          </div>
        </div>
        <button onClick={onClose} aria-label="إغلاق"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100
            transition shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          style={{ color: "#64748b" }}>
          <IcoClose />
        </button>
      </div>

      {/* program detail card */}
      <div className="px-5 mb-4 shrink-0">
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E4EBF1" }}>

          {/* program info row */}
          <div className="px-4 py-3.5 text-right"
            style={{ background: "#F4F7FA" }}>
            <p className="text-[13px] font-bold text-[#0B2A45] leading-snug">
              {program?.name ?? program?.title ?? "البرنامج التدريبي"}
            </p>
            {trainerName && trainerName !== "—" && (
              <p className="text-[11.5px] mt-0.5 text-[#7B91A8]">{trainerName}</p>
            )}
          </div>

          {/* divider */}
          <div style={{ height: 1, background: "#E4EBF1" }} />

          {/* price row */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: "#fff" }}>
            <span className="text-[11.5px] text-[#7B91A8]">قيمة البرنامج</span>
            <span className="text-[16px] font-extrabold flex items-center gap-1"
              style={{ color: "#0B2A45", direction: "ltr" }}>
              <IcoSAR />
              <span dir="ltr">{fmtPrice(price)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* info notice */}
      <div className="px-5 mb-4 shrink-0">
        <div className="rounded-xl px-4 py-3 flex items-start gap-2.5 text-right"
          style={{ background: "rgba(49,175,234,0.07)", border: "1px solid rgba(49,175,234,0.2)" }}>
          <div className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "#31AFEA", minWidth: 16 }}>
            <span className="text-white font-extrabold" style={{ fontSize: 9, lineHeight: 1 }}>!</span>
          </div>
          <p className="text-[11.5px] text-[#31567A] leading-relaxed">
            سيتم إرسال طلب التمويل لمسؤول الشركة. بعد الموافقة ستتلقى إشعاراً ويتم تسجيلك تلقائياً في البرنامج.
          </p>
        </div>
      </div>

      {/* optional note */}
      <div className="px-5 mb-1 shrink-0">
        <label className="block text-[12.5px] font-bold text-[#0B2A45] mb-1.5 text-right">
          ملاحظة للمسؤول
          <span className="text-[11px] font-normal text-[#7B91A8] mr-1">(اختياري)</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          disabled={loading}
          rows={3}
          placeholder="أضف أي ملاحظة أو سبب لطلب التمويل…"
          dir="rtl"
          className="w-full rounded-xl px-3.5 py-2.5 text-[12.5px] text-right
            outline-none transition resize-none
            placeholder:text-[#B0BEC5]
            focus:ring-2 focus:ring-[#31AFEA]/30"
          style={{
            border:     "1.5px solid #DDE4EB",
            color:      "#0B2A45",
            background: loading ? "#F8FAFC" : "#fff",
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* error */}
      {error && (
        <p className="text-[12px] text-red-500 text-center px-5 pt-2 shrink-0">{error}</p>
      )}

      {/* actions */}
      <div className="px-5 pt-4 pb-6 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
        <button type="button" onClick={onBack} disabled={loading}
          className="flex-1 py-3.5 rounded-2xl text-[13.5px] font-bold
            hover:bg-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          style={{ border: "1.5px solid #D1DCE7", color: "#4A6580",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
          رجوع
        </button>
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="flex-1 py-3.5 rounded-2xl text-[13.5px] font-extrabold text-white
            flex items-center justify-center gap-2 transition
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#31AFEA]/50"
          style={{ background: loading ? "#B8D9EE" : "#31AFEA",
            cursor: loading ? "not-allowed" : "pointer" }}>
          {loading
            ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>جارٍ الإرسال…</>
            : <>
                <IcoBuilding />
                تأكيد طلب التمويل
              </>}
        </button>
      </div>
    </ModalShell>
  );
}

// ── STEP 3 — نجاح طلب التمويل ────────────────────────────────────────────────
function StepFundingSuccess({ program, onClose }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-8 text-center gap-4">

        {/* success icon */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(34,197,94,0.10)" }}>
          <IcoCheck />
        </div>

        <div>
          <h2 className="text-[19px] font-extrabold text-[#0B2A45] mb-2">
            تم إرسال طلب التمويل
          </h2>
          <p className="text-[13px] text-[#6B8AA6] leading-relaxed max-w-[320px] mx-auto">
            تم إرسال طلبك لمسؤول الشركة بنجاح. ستصلك إشعار عند الموافقة وتسجيلك في البرنامج.
          </p>
        </div>

        {/* program name */}
        <div className="w-full rounded-2xl px-4 py-3 text-right"
          style={{ background: "#F4F7FA", border: "1px solid #E4EBF1" }}>
          <p className="text-[12.5px] font-bold text-[#0B2A45]">
            {program?.name ?? program?.title ?? "البرنامج التدريبي"}
          </p>
        </div>

        <button type="button" onClick={onClose}
          className="w-full py-3.5 rounded-2xl text-[14px] font-extrabold text-white
            hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#31AFEA]/50"
          style={{ background: "#31AFEA" }}>
          حسناً
        </button>
      </div>
    </ModalShell>
  );
}

// ── main export ───────────────────────────────────────────────────────────────
export default function EnrollModal({ program, onClose, onSuccess }) {
  const showCompany = isStaffOrEmployee();
  // "choice" | "funding" | "funding-success"
  const [step, setStep] = useState("choice");

  if (step === "funding-success") {
    return (
      <StepFundingSuccess
        program={program}
        onClose={onClose}
      />
    );
  }

  if (step === "funding") {
    return (
      <StepFunding
        program={program}
        onClose={onClose}
        onBack={() => setStep("choice")}
        onSuccess={(res) => {
          setStep("funding-success");
          onSuccess?.(res);
        }}
      />
    );
  }

  return (
    <StepChoice
      program={program}
      showCompany={showCompany}
      onClose={onClose}
      onSelfPay={(res) => {
        onSuccess?.(res);
        onClose();
      }}
      onCompanyFunding={() => setStep("funding")}
    />
  );
}
