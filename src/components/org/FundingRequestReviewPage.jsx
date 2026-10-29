import { useState, useEffect } from "react";
import {
  C, Icon, StatusBadge, Card, InfoRow, Timeline, Button, Modal, SuccessToast,
} from "./FundingShared";
import {
  approveCompanyFundingRequest,
  rejectCompanyFundingRequest,
} from "../../services/api";

export default function FundingRequestReviewPage({ request: initialRequest, onBack, onDone }) {
  const [req,          setReq]          = useState(initialRequest ?? null);
  const [showApprove,  setShowApprove]  = useState(false);
  const [showReject,   setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [decision,     setDecision]     = useState(null); // "approved" | "rejected"

  // sync if parent passes a new request (e.g. after navigation)
  useEffect(() => {
    if (initialRequest) setReq(initialRequest);
  }, [initialRequest]);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ── approve ───────────────────────────────────────────────────────────────
  const confirmApprove = () => {
    setSubmitting(true);
    approveCompanyFundingRequest(req.id)
      .then(() => {
        setShowApprove(false);
        setDecision("approved");
        setReq(r => ({ ...r, status: "approved" }));
        setToast({ msg: "تمت الموافقة على الطلب بنجاح" });
      })
      .catch(err => {
        setShowApprove(false);
        setToast({ msg: err?.message ?? "حدث خطأ، حاول مرة أخرى" });
      })
      .finally(() => setSubmitting(false));
  };

  // ── reject ────────────────────────────────────────────────────────────────
  const confirmReject = () => {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    rejectCompanyFundingRequest(req.id, rejectReason.trim())
      .then(() => {
        setShowReject(false);
        setDecision("rejected");
        setReq(r => ({ ...r, status: "rejected", rejectReason: rejectReason.trim() }));
        setToast({ msg: "تم رفض الطلب" });
        setRejectReason("");
      })
      .catch(err => {
        setShowReject(false);
        setToast({ msg: err?.message ?? "حدث خطأ، حاول مرة أخرى" });
      })
      .finally(() => setSubmitting(false));
  };

  // ── no data ───────────────────────────────────────────────────────────────
  if (!req) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-8" style={{ background: C.pageBg }} dir="rtl">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 h-[36px] px-4 rounded-xl text-[12px] font-bold
            bg-white border transition hover:border-[#075985]/40 mb-6"
          style={{ borderColor: C.border, color: C.primary }}>
          <Icon name="back" size="14" color={C.primary} sw={2} />
          العودة إلى الطلبات
        </button>
        <p className="text-sm text-center" style={{ color: C.muted }}>لم يتم تحديد طلب. يرجى العودة والمحاولة مجددًا.</p>
      </div>
    );
  }

  const isPending  = req.status === "pending"  && !decision;
  const isApproved = req.status === "approved" || decision === "approved";
  const isRejected = req.status === "rejected" || decision === "rejected";

  return (
    <div className="flex-1 overflow-y-auto min-h-0" style={{ background: C.pageBg }} dir="rtl">
      <div className="w-full max-w-none p-5 sm:p-8">

        {/* ── header ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 h-[36px] px-4 rounded-xl text-[12px] font-bold
              bg-white border transition hover:border-[#075985]/40"
            style={{ borderColor: C.border, color: C.primary }}>
            <Icon name="back" size="14" color={C.primary} sw={2} />
            العودة إلى الطلبات
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[16px] font-bold" style={{ color: C.text }}>{req.title}</h1>
            <StatusBadge status={req.status} />
          </div>
        </div>

        {/* ── timeline ── */}
        <Card className="mb-5" style={{ padding: 0 }}>
          <Timeline current={isApproved || isRejected ? 3 : 2} />
        </Card>

        {/* ── employee info ── */}
        <Card
          title="معلومات الموظف"
          icon={<Icon name="user" size="15" color={C.primary} />}
          className="mb-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6">
            <InfoRow label="الاسم"               value={req.employee}              icon={<Icon name="user"      size="13" color={C.muted} />} />
            <InfoRow label="البريد الإلكتروني"   value={req.employeeInfo?.email ?? req.email ?? "—"} icon={<Icon name="mail"      size="13" color={C.muted} />} />
            <InfoRow label="المسمى الوظيفي"      value={req.role}                  icon={<Icon name="briefcase" size="13" color={C.muted} />} />
            <InfoRow label="القسم"               value={req.dept}                  icon={<Icon name="briefcase" size="13" color={C.muted} />} />
            <InfoRow label="رقم الموظف"          value={req.employeeInfo?.empNo ?? `EMP-${req.id}`} icon={<Icon name="user"      size="13" color={C.muted} />} />
          </div>
        </Card>

        {/* ── program info ── */}
        <Card
          title="تفاصيل البرنامج"
          icon={<Icon name="briefcase" size="15" color={C.primary} />}
          className="mb-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6">
            <InfoRow label="اسم البرنامج"  value={req.title}                      icon={<Icon name="briefcase" size="13" color={C.muted} />} />
            <InfoRow label="مزود التدريب"  value={req.org}                        icon={<Icon name="briefcase" size="13" color={C.muted} />} />
            <InfoRow label="التكلفة"        value={req.program?.cost ?? "—"}       icon={<Icon name="money"     size="13" color={C.muted} />} />
            <InfoRow label="تاريخ التقديم"  value={req.date}                       icon={<Icon name="calendar"  size="13" color={C.muted} />} />
          </div>

          {/* مبرر الطلب */}
          {req.body && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: C.border }}>
              <p className="text-[11px] font-bold mb-1.5" style={{ color: C.muted }}>مبرر الطلب</p>
              <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>{req.body}</p>
            </div>
          )}
        </Card>

        {/* ── rejection reason (if already rejected) ── */}
        {isRejected && req.rejectReason && (
          <div className="rounded-2xl border p-4 mb-5"
            style={{ borderColor: C.dangerBg, background: C.dangerBg }}>
            <p className="text-[12px] font-bold mb-1" style={{ color: C.danger }}>سبب الرفض:</p>
            <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>{req.rejectReason}</p>
          </div>
        )}

        {/* ── decision section (only for pending) ── */}
        {isPending && (
          <Card
            title="قرار المراجعة"
            icon={<Icon name="edit" size="15" color={C.primary} />}
            className="mb-6"
          >
            <p className="text-[12px] mb-5" style={{ color: C.muted }}>
              اختر القرار المناسب لهذا الطلب. سيتم إشعار الموظف فور اتخاذ القرار.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="success"
                icon={<Icon name="check" size="14" color="#fff" sw={2.4} />}
                onClick={() => setShowApprove(true)}>
                الموافقة على الطلب
              </Button>
              <Button
                variant="danger"
                icon={<Icon name="x" size="14" color="#fff" sw={2.4} />}
                onClick={() => { setShowReject(true); setRejectReason(""); }}>
                رفض الطلب
              </Button>
            </div>
          </Card>
        )}

        {/* ── result banner ── */}
        {(isApproved || isRejected) && (
          <div className="rounded-2xl border p-5 flex items-center gap-3 mb-6"
            style={{
              borderColor: isRejected ? C.dangerBg  : C.successBg,
              background:  isRejected ? C.dangerBg  : C.successBg,
            }}>
            <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: isRejected ? C.danger : C.success }}>
              <Icon name={isRejected ? "x" : "check"} size="16" color="#fff" sw={2.6} />
            </span>
            <div>
              <p className="text-[13px] font-bold" style={{ color: C.text }}>
                {isApproved && "تمت الموافقة على الطلب بنجاح"}
                {isRejected && "تم رفض الطلب"}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                {isApproved && "سيتم تحويل الطلب لمرحلة التنفيذ."}
                {isRejected && (req.rejectReason ? `سبب الرفض: ${req.rejectReason}` : "تم تسجيل القرار.")}
              </p>
            </div>
          </div>
        )}

        {/* ── done button after decision ── */}
        {decision && (
          <div className="flex justify-end">
            <Button variant="primary" onClick={onDone}>
              العودة إلى قائمة الطلبات
            </Button>
          </div>
        )}

      </div>

      {/* ── approve modal ── */}
      <Modal open={showApprove} onClose={() => !submitting && setShowApprove(false)} title="تأكيد الموافقة">
        <p className="text-[13px] mb-5" style={{ color: C.muted }}>
          هل أنت متأكد من الموافقة على طلب التمويل لـ <b style={{ color: C.text }}>{req.employee}</b>؟
        </p>
        <div className="flex items-center gap-2.5">
          <Button variant="success" className="flex-1" loading={submitting} onClick={confirmApprove}>
            تأكيد الموافقة
          </Button>
          <Button variant="secondary" className="flex-1" disabled={submitting} onClick={() => setShowApprove(false)}>
            إلغاء
          </Button>
        </div>
      </Modal>

      {/* ── reject modal ── */}
      <Modal open={showReject} onClose={() => !submitting && setShowReject(false)} title="رفض الطلب">
        <p className="text-[13px] mb-3" style={{ color: C.muted }}>
          هل أنت متأكد من رفض هذا الطلب؟
        </p>
        <label className="block text-[11px] font-bold mb-1.5" style={{ color: C.text }}>
          سبب الرفض <span style={{ color: C.danger }}>*</span>
        </label>
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          rows={3}
          placeholder="اكتب سبب الرفض هنا..."
          className="w-full rounded-xl border bg-white p-3 text-[12px] resize-none
            focus:outline-none focus:border-[#075985] transition mb-4"
          style={{ borderColor: C.border, color: C.text }}
        />
        <div className="flex items-center gap-2.5">
          <Button variant="danger" className="flex-1" loading={submitting}
            disabled={!rejectReason.trim()} onClick={confirmReject}>
            تأكيد الرفض
          </Button>
          <Button variant="secondary" className="flex-1" disabled={submitting}
            onClick={() => setShowReject(false)}>
            إلغاء
          </Button>
        </div>
      </Modal>

      {/* ── toast ── */}
      {toast && <SuccessToast show={!!toast} message={toast.msg} />}
    </div>
  );
}
