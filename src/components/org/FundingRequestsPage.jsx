import { useEffect, useMemo, useState } from "react";
import {
  C, Icon, REQUEST_STATUS, StatusIcon, StatusBadge, SearchInput, StatusTabs,
  EmptyState, NoResults, ErrorState, ListSkeleton, Modal, Button, SuccessToast,
} from "./FundingShared";
import FundingProgramModal from "./FundingProgramModal";
import {
  fetchCompanyFundingRequests,
  approveCompanyFundingRequest,
  rejectCompanyFundingRequest,
} from "../../services/api";

/** invoice may be a string or { id, invoice_num, total_amount } */
function invoiceLabel(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "object") return String(raw);
  const num = raw.invoice_num;
  if (typeof num === "object" && num !== null) {
    return String(num.invoice_num ?? num.id ?? raw.id ?? "");
  }
  return String(num ?? raw.id ?? "");
}

function textField(val) {
  if (val == null) return "—";
  if (typeof val === "object") return val.name ?? val.text ?? val.label ?? "—";
  return String(val);
}

/** Map one API item to the shape RequestCard / FundingProgramModal expect */
function mapRequest(item) {
  return {
    id:           item.id,
    _programId:   item.program?.id ?? null,
    status:       item.status,
    title:        item.program?.name ?? "—",
    employee:     item.employee?.name ?? "—",
    role:         item.employee?.job_title ?? "—",
    dept:         textField(item.employee?.department),
    org:          textField(item.program?.provider),
    date:         item.submitted_at ?? "—",
    rejectReason: item.reject_reason ?? null,
    inv:          invoiceLabel(item.invoice),
    body:         item.body ?? "",
    employeeInfo: {
      email: item.employee?.email ?? "—",
      empNo: `EMP-${item.employee?.id ?? ""}`,
      title: item.employee?.job_title ?? "—",
      dept:  item.employee?.department ?? "—",
    },
    program: {
      name:        item.program?.name ?? "—",
      provider:    textField(item.program?.provider),
      cost:        item.program?.price_amount ? `${item.program.price_amount} ر.س` : "—",
      priceShort:  item.program?.price_amount ?? "—",
      currency:    "ر.س",
      description: item.body ?? "",
      keyPoints:   null,
      modules:     null,
    },
    files: [],
  };
}

function RequestCard({ request, onView, onReview }) {
  return (
    <article
      onClick={() => onView(request)}
      className="bg-white rounded-2xl border cursor-pointer transition hover:border-[#075985]/40 hover:shadow-[0_6px_24px_rgba(7,89,133,0.06)] p-5"
      style={{ borderColor: C.border }}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-4">
        {/* right side */}
        <div className="flex items-start gap-3.5 min-w-0">
          <StatusIcon status={request.status} />
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold leading-snug" style={{ color: C.text }}>
              {request.title}
            </h3>
            <p className="text-[12px] mt-1.5 font-semibold" style={{ color: C.primary }}>
              {request.employee}
              <span className="text-[#8A9AAA] font-normal"> — {request.role}</span>
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{request.org}</p>
          </div>
        </div>

        {/* left side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* meta row */}
      <div className="flex items-center justify-between gap-3 flex-wrap mt-4 pt-4 border-t"
        style={{ borderColor: C.border }}>
        <div className="flex items-center gap-4 text-[11px]" style={{ color: C.muted }}>
          <span className="flex items-center gap-1.5">
            <Icon name="briefcase" size="13" color={C.muted} /> رقم الطلب: {request.id}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="calendar" size="13" color={C.muted} /> تاريخ التقديم: {request.date}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {request.status === "approved" && request.inv && (
            <span className="text-[11px]" style={{ color: C.muted }}>
              الفاتورة المرجعية: <b style={{ color: C.primary }}>{request.inv}</b>
            </span>
          )}
          {/* "مراجعة الطلب" يروح لصفحة Review التفصيلية */}
          {request.status === "pending" && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onReview(request); }}
              className="flex items-center gap-1.5 text-[12px] font-bold transition hover:opacity-80"
              style={{ color: C.primary }}>
              مراجعة الطلب
              <Icon name="arrow-left" size="14" color={C.primary} sw={2.2} />
            </button>
          )}
          {/* عرض التفاصيل يفتح الـ modal */}
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onView(request); }}
            className="flex items-center gap-1.5 text-[12px] font-bold transition hover:opacity-80"
            style={{ color: C.muted }}>
            عرض تفاصيل البرنامج
            <Icon name="arrow-left" size="14" color={C.muted} sw={2.2} />
          </button>
        </div>
      </div>

      {/* rejection reason box */}
      {request.status === "rejected" && request.rejectReason && (
        <div className="mt-4 rounded-xl border bg-[#FAFBFC] p-3.5"
          style={{ borderColor: C.border }}>
          <p className="text-[11px] font-bold mb-1" style={{ color: C.danger }}>
            سبب الرفض:
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: C.text }}>{request.rejectReason}</p>
        </div>
      )}
    </article>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function FundingRequestsPage({ onReviewRequest }) {
  const [search,       setSearch]       = useState("");
  const [tab,          setTab]          = useState("all");
  const [pageStatus,   setPageStatus]   = useState("loading"); // loading | ready | error
  const [list,         setList]         = useState([]);
  const [selected,     setSelected]     = useState(null);   // modal
  const [approving,    setApproving]    = useState(null);   // request being approved
  const [rejecting,    setRejecting]    = useState(null);   // request being rejected
  const [rejectReason, setRejectReason] = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── load list ─────────────────────────────────────────────────────────────
  const load = () => {
    setPageStatus("loading");
    fetchCompanyFundingRequests()
      .then(res => {
        const items = res?.data?.data ?? [];
        setList(items.map(mapRequest));
        setPageStatus("ready");
      })
      .catch(() => setPageStatus("error"));
  };

  useEffect(() => { load(); }, []);

  // ── auto-dismiss toast ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── approve ───────────────────────────────────────────────────────────────
  const handleApprove = () => {
    if (!approving) return;
    setSubmitting(true);
    approveCompanyFundingRequest(approving.id)
      .then(() => {
        setList(l => l.map(r => r.id === approving.id ? { ...r, status: "approved" } : r));
        setApproving(null);
        setToast({ msg: "تمت الموافقة على الطلب بنجاح" });
      })
      .catch(err => {
        setApproving(null);
        setToast({ msg: err?.message ?? "حدث خطأ، حاول مرة أخرى", error: true });
      })
      .finally(() => setSubmitting(false));
  };

  // ── reject ────────────────────────────────────────────────────────────────
  const handleReject = () => {
    if (!rejecting || !rejectReason.trim()) return;
    setSubmitting(true);
    rejectCompanyFundingRequest(rejecting.id, rejectReason.trim())
      .then(() => {
        setList(l => l.map(r =>
          r.id === rejecting.id ? { ...r, status: "rejected", rejectReason: rejectReason.trim() } : r
        ));
        setRejecting(null);
        setRejectReason("");
        setToast({ msg: "تم رفض الطلب" });
      })
      .catch(err => {
        setRejecting(null);
        setRejectReason("");
        setToast({ msg: err?.message ?? "حدث خطأ، حاول مرة أخرى", error: true });
      })
      .finally(() => setSubmitting(false));
  };

  // ── counts / filter ───────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      list.length,
    pending:  list.filter(r => r.status === "pending").length,
    approved: list.filter(r => r.status === "approved").length,
    rejected: list.filter(r => r.status === "rejected").length,
  }), [list]);

  const filtered = useMemo(() => {
    let r = [...list];
    if (tab !== "all") r = r.filter(x => x.status === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(x =>
        x.employee.toLowerCase().includes(q) ||
        x.role.toLowerCase().includes(q) ||
        x.dept.toLowerCase().includes(q) ||
        x.title.toLowerCase().includes(q) ||
        String(x.id).includes(q)
      );
    }
    return r;
  }, [list, tab, search]);

  // ── loading ───────────────────────────────────────────────────────────────
  if (pageStatus === "loading") {
    return (
      <div className="flex-1 overflow-y-auto min-h-0" style={{ background: C.pageBg }} dir="rtl">
        <div className="w-full max-w-none p-5 sm:p-8">
          <div className="h-6 w-1/3 bg-[#E8EDF2] rounded-lg animate-pulse mb-2" />
          <div className="h-3 w-1/2 bg-[#EEF2F5] rounded-lg animate-pulse mb-6" />
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="h-[38px] w-60 bg-[#EEF2F5] rounded-xl animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[36px] w-24 bg-[#EEF2F5] rounded-xl animate-pulse" />
            ))}
          </div>
          <ListSkeleton count={4} />
        </div>
      </div>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (pageStatus === "error") {
    return (
      <div className="flex-1 overflow-y-auto min-h-0" style={{ background: C.pageBg }} dir="rtl">
        <div className="w-full max-w-none p-5 sm:p-8">
          <div className="rounded-2xl border bg-white" style={{ borderColor: C.border }}>
            <ErrorState onRetry={load} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0" style={{ background: C.pageBg }} dir="rtl">
      <div className="w-full max-w-none p-5 sm:p-8">

        {/* ── header ── */}
        <div className="mb-7">
          <h1 className="text-[20px] font-bold" style={{ color: C.text }}>
            طلبات تمويل الموظفين
          </h1>
          <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>
            مراجعة واتخاذ القرارات لطلبات الرعاية والتمويل التدريبي المقدمة من الموظفين.
          </p>
        </div>

        {/* ── toolbar ── */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث عن موظف" />
          <StatusTabs value={tab} onChange={setTab} counts={counts} />
        </div>

        {/* ── list ── */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white" style={{ borderColor: C.border }}>
            {list.length === 0
              ? <EmptyState />
              : search.trim()
                ? <NoResults />
                : <EmptyState
                    title="لا توجد طلبات"
                    desc="لا توجد طلبات تمويل ضمن هذا الفلتر في الوقت الحالي." />}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                onView={setSelected}
                onReview={(req) => onReviewRequest?.(req)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── program detail modal (view only) ── */}
      <FundingProgramModal
        request={selected}
        onClose={() => setSelected(null)}
        onApprove={(r) => { setSelected(null); setApproving(r); }}
        onReject={(r)  => { setSelected(null); setRejecting(r); setRejectReason(""); }}
      />

      {/* ── approve confirm modal ── */}
      <Modal
        open={!!approving}
        onClose={() => !submitting && setApproving(null)}
        title="تأكيد الموافقة"
      >
        <p className="text-[13px] mb-5" style={{ color: C.muted }}>
          هل أنت متأكد من الموافقة على طلب التمويل لـ{" "}
          <b style={{ color: C.text }}>{approving?.employee}</b>؟
        </p>
        <div className="flex items-center gap-2.5">
          <Button variant="success" className="flex-1" loading={submitting} onClick={handleApprove}>
            تأكيد الموافقة
          </Button>
          <Button variant="secondary" className="flex-1" disabled={submitting} onClick={() => setApproving(null)}>
            إلغاء
          </Button>
        </div>
      </Modal>

      {/* ── reject confirm modal ── */}
      <Modal
        open={!!rejecting}
        onClose={() => { if (!submitting) { setRejecting(null); setRejectReason(""); } }}
        title="رفض الطلب"
      >
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
          <Button
            variant="danger"
            className="flex-1"
            loading={submitting}
            disabled={!rejectReason.trim()}
            onClick={handleReject}>
            تأكيد الرفض
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={submitting}
            onClick={() => { setRejecting(null); setRejectReason(""); }}>
            إلغاء
          </Button>
        </div>
      </Modal>

      {/* ── toast ── */}
      {toast && <SuccessToast show={!!toast} message={toast.msg} />}
    </div>
  );
}
