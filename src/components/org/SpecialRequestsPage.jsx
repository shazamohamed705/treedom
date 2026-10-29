import { useState, useEffect, useCallback } from "react";
import {
  fetchTrainerSpecialRequests,
  approveTrainerSpecialRequest,
  rejectTrainerSpecialRequest,
} from "../../services/api";
import Pagination from "../shared/Pagination";

const STATUS_CFG = {
  pending:  { label: "معلق",         color: "#f59e0b" },
  approved: { label: "تمت الموافقة", color: "#14b8a6" },
  rejected: { label: "مرفوض",        color: "#ef4444" },
};

function statusKey(raw) {
  if (raw == null) return "";
  if (typeof raw === "object") return String(raw.value ?? raw.key ?? raw.text ?? "");
  return String(raw);
}

function pickText(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    if (typeof v === "object") {
      const t = v.ar ?? v.en ?? v.name ?? v.title ?? v.text ?? v.label;
      if (t) return String(t);
      continue;
    }
    return String(v);
  }
  return "";
}

function mapRow(r) {
  const st = statusKey(r.status);
  const cfg = STATUS_CFG[st] ?? STATUS_CFG.pending;
  return {
    id: r.id,
    subject: pickText(r.subject, r.title, r.name, r.program?.name) || `طلب #${r.id}`,
    message: pickText(r.message, r.description, r.notes, r.details),
    status: st,
    status_label: pickText(r.status_label, r.status?.text, r.status?.label) || cfg.label,
    created_at: r.created_at ?? r.date ?? r.requested_at ?? "—",
    party: pickText(
      r.company?.name,
      r.company_name,
      r.requester?.name,
      r.user?.name,
      r.trainee?.name,
      r.provider?.name
    ) || "—",
    raw: r,
  };
}

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
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

function Sk({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3.5"><div className="flex flex-col gap-1.5"><Sk className="w-36 h-3" /><Sk className="w-24 h-2.5" /></div></td>
      <td className="px-4 py-3.5"><Sk className="w-20 h-6 rounded-full" /></td>
      <td className="px-4 py-3.5"><Sk className="w-28 h-3" /></td>
      <td className="px-4 py-3.5"><Sk className="w-24 h-3" /></td>
      <td className="px-4 py-3.5"><Sk className="w-20 h-8 rounded-xl" /></td>
    </tr>
  );
}

function TH({ children }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">
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

const FILTER_TABS = [
  { key: "",         label: "الكل"         },
  { key: "pending",  label: "معلقة"        },
  { key: "approved", label: "تمت الموافقة" },
  { key: "rejected", label: "مرفوضة"       },
];

function DetailsModal({ row, onClose, onActionDone }) {
  const r = row?.raw ?? {};
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);
  const [actError, setActError] = useState(null);

  const st = statusKey(row.status ?? r.status);
  const isPending = !["approved", "rejected", "2"].includes(st)
    && (st === "pending" || st === "0" || st === "معلق" || !st || r.can_approve === true);

  const handleApprove = async () => {
    if (!row?.id || acting) return;
    setActing(true);
    setActError(null);
    try {
      await approveTrainerSpecialRequest(row.id);
      onActionDone?.();
      onClose();
    } catch (e) {
      setActError(e.message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setActError("يرجى إدخال سبب الرفض"); return; }
    if (!row?.id || acting) return;
    setActing(true);
    setActError(null);
    try {
      await rejectTrainerSpecialRequest(row.id, rejectReason.trim());
      onActionDone?.();
      onClose();
    } catch (e) {
      setActError(e.message);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold" style={{ color: "#024677" }}>{row.subject}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 space-y-3 text-sm">
          <p className="text-slate-600 whitespace-pre-wrap">{row.message || "لا توجد تفاصيل إضافية."}</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
            <span>الحالة: <b className="text-slate-700">{row.status_label}</b></span>
            <span>التاريخ: <b className="text-slate-700">{row.created_at}</b></span>
            <span>الجهة: <b className="text-slate-700">{row.party}</b></span>
            {r.trainees_count != null && (
              <span>المتدربين: <b className="text-slate-700">{r.trainees_count}</b></span>
            )}
          </div>
          {r.reject_reason && (
            <div className="rounded-xl border border-red-100 p-4" style={{ background: "#fff5f5" }}>
              <p className="text-sm font-bold text-red-500 mb-1">سبب الرفض</p>
              <p className="text-xs text-slate-600">{r.reject_reason}</p>
            </div>
          )}
        </div>
        <div className="border-t border-slate-100">
          {actError && <p className="px-6 pt-3 text-xs text-red-500">{actError}</p>}
          {showReject && isPending && (
            <div className="px-6 pt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500">سبب الرفض <span className="text-red-400">*</span></p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="أدخل سبب الرفض..."
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
                  <button onClick={handleReject} disabled={acting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: "#ef4444" }}>
                    {acting ? <IcoSpinner /> : null}
                    تأكيد الرفض
                  </button>
                )}
                <button onClick={handleApprove} disabled={acting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#024677" }}>
                  {acting ? <IcoSpinner /> : <IcoCheck />}
                  الموافقة على الطلب
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpecialRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState("");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [detail,   setDetail]   = useState(null);

  const load = useCallback((status, q, p) => {
    setLoading(true);
    setError(null);
    fetchTrainerSpecialRequests({
      status:   status || undefined,
      search:   q      || undefined,
      page:     p,
      per_page: 15,
    })
      .then(res => {
        const paginator = res?.data ?? res ?? {};
        const rows = Array.isArray(paginator.data) ? paginator.data : [];
        setRequests(rows.map(mapRow));
        setLastPage(Number(paginator.last_page ?? paginator.meta?.last_page ?? 1) || 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filter, search, 1); setPage(1); }, [filter]); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(() => { load(filter, search, 1); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line
  useEffect(() => { load(filter, search, page); }, [page]); // eslint-disable-line

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50" dir="rtl">
      <div className="px-4 sm:px-6 py-5 space-y-5 max-w-full">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: "#024677" }}>
            الطلبات الخاصة
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            عرض الطلبات الخاصة الواردة للمدرب المستقل
          </p>
        </div>

        <div className="space-y-4">
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
                    <TH>الجهة</TH>
                    <TH>إجراء</TH>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    : requests.length === 0
                      ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-sm text-slate-400">
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
                                <p className="text-sm font-semibold text-slate-800">{r.subject}</p>
                                {r.message && (
                                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{r.message}</p>
                                )}
                              </div>
                            </TD>
                            <TD>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                                style={{ color: st.color, background: st.color + "18", border: `1px solid ${st.color}40` }}>
                                {r.status_label}
                              </span>
                            </TD>
                            <TD ltr>{r.created_at}</TD>
                            <TD>{r.party}</TD>
                            <TD>
                              <button onClick={() => setDetail(r)}
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

          {!loading && lastPage > 1 && (
            <Pagination page={page} totalPages={lastPage} onChange={p => setPage(p)} />
          )}
        </div>
      </div>

      {detail && (
        <DetailsModal
          row={detail}
          onClose={() => setDetail(null)}
          onActionDone={() => load(filter, search, page)}
        />
      )}
    </main>
  );
}
