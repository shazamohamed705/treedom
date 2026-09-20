import { useState, useEffect, useCallback } from "react";
import {
  fetchReviewRequests,
  fetchReviewRequest,
  approveReviewRequest,
  rejectReviewRequest,
} from "../services/api";
import { isIndeCoach } from "../services/auth";
import Pagination from "./Pagination";
import SpecialRequestsPage from "./SpecialRequestsPage";

// ── status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:  { label: "معلق",         color: "#f59e0b" },
  approved: { label: "تمت الموافقة", color: "#14b8a6" },
  rejected: { label: "مرفوض",        color: "#ef4444" },
};

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IcoClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function Sk({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}
function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3.5"><div className="flex flex-col gap-1.5"><Sk className="w-36 h-3" /><Sk className="w-24 h-2.5" /></div></td>
      <td className="px-4 py-3.5"><Sk className="w-20 h-6 rounded-full" /></td>
      <td className="px-4 py-3.5"><Sk className="w-28 h-3" /></td>
      <td className="px-4 py-3.5"><Sk className="w-20 h-6 rounded-full" /></td>
      <td className="px-4 py-3.5"><Sk className="w-16 h-3" /></td>
      <td className="px-4 py-3.5"><Sk className="w-20 h-8 rounded-xl" /></td>
    </tr>
  );
}

// ── compare panel (inside modal) ──────────────────────────────────────────────
function ComparePanel({ req }) {
  if (!req) return null;

  // API returns: subject, message, status, coach, provider, reject_reason, reviewed_at, created_at
  // Show the request details in a clean layout
  const coach    = req.coach    ?? {};
  const provider = req.provider ?? {};

  return (
    <div className="px-6 py-4 space-y-4" dir="rtl">

      {/* subject + message */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex flex-col gap-0">
          <div className="flex items-start gap-3 px-5 py-3 bg-white border-b border-slate-50">
            <span className="text-xs font-semibold text-slate-400 shrink-0 pt-0.5">الموضوع</span>
            <span className="text-sm font-bold text-slate-800">{req.subject ?? "—"}</span>
          </div>
          <div className="flex items-start gap-3 px-5 py-3 bg-slate-50">
            <span className="text-xs font-semibold text-slate-400 shrink-0 pt-0.5">الرسالة</span>
            <span className="text-sm text-slate-700 leading-relaxed">{req.message ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* coach info */}
      {coach.name && (
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500">المدرب</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-3">
            {coach.image && (
              <img src={coach.image} alt={coach.name}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{coach.name}</p>
              <p className="text-xs text-slate-400">{coach.email}</p>
            </div>
            {provider.name && (
              <span className="mr-auto text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "#e0f2fe", color: "#0369a1" }}>
                {provider.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* dates */}
      <div className="flex items-center gap-4 text-xs text-slate-400 px-1">
        {req.created_at && (
          <span>تاريخ الطلب: <span className="text-slate-600 font-semibold">{req.created_at}</span></span>
        )}
        {req.reviewed_at && (
          <span>تاريخ المراجعة: <span className="text-slate-600 font-semibold">{req.reviewed_at}</span></span>
        )}
      </div>

      {/* reject reason */}
      {req.reject_reason && (
        <div className="rounded-xl border border-red-100 p-4 text-right" style={{ background: "#fff5f5" }}>
          <p className="text-sm font-bold text-red-500 mb-1">سبب الرفض</p>
          <p className="text-xs text-slate-600">{req.reject_reason}</p>
        </div>
      )}
    </div>
  );
}

// ── details modal ─────────────────────────────────────────────────────────────
function DetailsModal({ reqId, onClose, onActionDone }) {
  const [req,          setReq]          = useState(null);
  const [loadingDetail,setLoadingDetail] = useState(true);
  const [showReject,   setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting,       setActing]       = useState(false);
  const [actError,     setActError]     = useState(null);

  useEffect(() => {
    setLoadingDetail(true);
    fetchReviewRequest(reqId)
      .then(res => {
        // API returns: { status, message, data: { id, subject, message, status, coach, provider, ... } }
        setReq(res.data ?? res);
      })
      .catch(() => setReq(null))
      .finally(() => setLoadingDetail(false));
  }, [reqId]);

  const handleApprove = async () => {
    setActing(true); setActError(null);
    try {
      await approveReviewRequest(reqId);
      onActionDone();
      onClose();
    } catch (e) {
      setActError(e.message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setActError("يرجى إدخال سبب الرفض"); return; }
    setActing(true); setActError(null);
    try {
      await rejectReviewRequest(reqId, rejectReason.trim());
      onActionDone();
      onClose();
    } catch (e) {
      setActError(e.message);
    } finally {
      setActing(false);
    }
  };

  const isPending = req?.status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" dir="rtl">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {req?.subject ?? req?.program?.name ?? req?.title ?? "تفاصيل الطلب"}
            </h2>
            {(req?.coach?.name ?? req?.trainer?.name) && (
              <p className="text-xs text-slate-400 mt-0.5">{req.coach?.name ?? req.trainer?.name}</p>
            )}
          </div>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition">
            <IcoClose />
          </button>
        </div>

        {/* body */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24"
                fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            </div>
          ) : (
            <ComparePanel req={req} />
          )}
        </div>

        {/* footer actions */}
        {!loadingDetail && (
          <div className="border-t border-slate-100" dir="rtl">
            {actError && (
              <p className="px-6 pt-3 text-xs text-red-500 text-right">{actError}</p>
            )}

            {showReject && isPending && (
              <div className="px-6 pt-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500">سبب الرفض <span className="text-red-400">*</span></p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="أدخل سبب الرفض لإعلام المدرب..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-red-300 transition resize-none
                    placeholder:text-slate-400 text-right"
                  style={{ background: "#F8FAFC" }} />
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap px-6 py-4">
              <button onClick={onClose}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition px-4 py-2">
                إغلاق
              </button>

              {isPending && (
                <>
                  {!showReject ? (
                    <button onClick={() => setShowReject(true)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                      style={{ background: "#ef4444" }}>
                      رفض الطلب
                    </button>
                  ) : (
                    <button
                      onClick={handleReject}
                      disabled={acting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                      style={{ background: "#ef4444" }}>
                      {acting ? <IcoSpinner /> : null}
                      تأكيد الرفض
                    </button>
                  )}

                  <button
                    onClick={handleApprove}
                    disabled={acting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: "#024677" }}>
                    {acting ? <IcoSpinner /> : <IcoCheck />}
                    الموافقة على الطلب
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── table header / cell ───────────────────────────────────────────────────────
function TH({ children }) {
  return (
    <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap border-b border-slate-100"
      style={{ background: "#F0F4F8" }}>
      {children}
    </th>
  );
}
function TD({ children, ltr }) {
  return (
    <td className="px-4 py-3.5 border-b border-slate-50 text-sm text-right align-middle"
      dir={ltr ? "ltr" : undefined}>
      {children}
    </td>
  );
}

// ── filter tabs config ────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: "",         label: "الكل"         },
  { key: "pending",  label: "معلقة"        },
  { key: "approved", label: "تمت الموافقة" },
  { key: "rejected", label: "مرفوضة"       },
];

// ── requests table ────────────────────────────────────────────────────────────
function RequestsTable({ type }) {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [filter,    setFilter]    = useState("pending");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [lastPage,  setLastPage]  = useState(1);
  const [detailId,  setDetailId]  = useState(null);

  const load = useCallback((status, q, p) => {
    setLoading(true);
    setError(null);
    fetchReviewRequests({
      status:   status || undefined,
      search:   q      || undefined,
      type:     type   || undefined,
      page:     p,
      per_page: 15,
    })
      .then(res => {
        const data = res.data ?? res;
        setRequests(data.review_requests ?? []);
        setLastPage(data.pagination?.total_pages ?? 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [type]);

  useEffect(() => { load(filter, search, 1); setPage(1); }, [filter]); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(() => { load(filter, search, 1); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line
  useEffect(() => { load(filter, search, page); }, [page]); // eslint-disable-line

  const handleActionDone = () => load(filter, search, page);

  return (
    <div className="space-y-4">
      {/* filter row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              style={filter === f.key
                ? { background: "#024677", color: "#fff" }
                : { background: "#f1f5f9", color: "#64748b" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <IcoSearch />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث..."
            className="pr-9 pl-4 py-2 text-xs bg-white border border-slate-200 rounded-xl
              w-44 focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400"
            dir="rtl" />
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
        {error ? (
          <div className="flex flex-col items-center py-12 gap-3 text-center" dir="rtl">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => load(filter, search, page)}
              className="text-xs font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: "#024677" }}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <table className="w-full" dir="rtl" style={{ borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr>
                <TH>الموضوع</TH>
                <TH>الحالة</TH>
                <TH>تاريخ الطلب</TH>
                <TH>المدرب / الجهة</TH>
                <TH>تاريخ المراجعة</TH>
                <TH>إجراء</TH>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : requests.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-sm text-slate-400">
                        لا توجد طلبات
                      </td>
                    </tr>
                  )
                  : requests.map(r => {
                    const st = STATUS_CFG[r.status] ?? STATUS_CFG.pending;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <TD>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {r.subject ?? `طلب #${r.id}`}
                            </p>
                            {r.message && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
                                {r.message}
                              </p>
                            )}
                          </div>
                        </TD>
                        <TD>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ color: st.color, background: st.color + "18", border: `1px solid ${st.color}40` }}>
                            {r.status_label ?? st.label}
                          </span>
                        </TD>
                        <TD ltr>
                          {r.created_at ?? "—"}
                        </TD>
                        <TD>
                          {/* coach name */}
                          {r.coach ? (
                            <div className="flex items-center gap-2">
                              {r.coach.image && (
                                <img src={r.coach.image} alt={r.coach.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700 truncate">{r.coach.name}</p>
                                {r.provider?.name && (
                                  <p className="text-xs text-slate-400 truncate">{r.provider.name}</p>
                                )}
                              </div>
                            </div>
                          ) : "—"}
                        </TD>
                        <TD>
                          {/* reviewed_at or reject_reason indicator */}
                          {r.reviewed_at
                            ? <span className="text-xs text-slate-500">{r.reviewed_at}</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </TD>
                        <TD>
                          <button onClick={() => setDetailId(r.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition whitespace-nowrap"
                            style={{ color: "#024677" }}>
                            عرض التفاصيل
                          </button>
                        </TD>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        )}
      </div>

      {/* pagination */}
      {!loading && lastPage > 1 && (
        <Pagination
          page={page}
          totalPages={lastPage}
          onChange={p => setPage(p)} />
      )}

      {/* details modal */}
      {detailId && (
        <DetailsModal
          reqId={detailId}
          onClose={() => setDetailId(null)}
          onActionDone={handleActionDone} />
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function ReviewRequestsPage() {
  if (isIndeCoach()) return <SpecialRequestsPage />;
  return <OrgReviewRequestsPage />;
}

function OrgReviewRequestsPage() {
  const [activeTab, setActiveTab] = useState("programs");

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50" dir="rtl">
      <div className="px-4 sm:px-6 py-5 space-y-5 max-w-full">

        {/* header */}
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: "#024677" }}>
            طلبات المراجعة
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مراجعة طلبات الإضافة والتعديل المقدَّمة من المدربين قبل تطبيقها
          </p>
        </div>

        {/* tabs */}
        <div className="flex items-center justify-end gap-0 border-b border-slate-200">
          {[
            { key: "programs", label: "طلبات البرامج والجلسات"  },
            { key: "identity", label: "طلبات التحقق من الهوية" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px
                ${activeTab === tab.key
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* content — key forces remount on tab switch */}
        <RequestsTable
          key={activeTab}
          type={activeTab === "identity" ? "identity" : undefined} />
      </div>
    </main>
  );
}
